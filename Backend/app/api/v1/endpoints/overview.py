from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.domains.projects.models import Project, ProjectStatus
from app.domains.kpis.models import KPIRecord, KPIDefinition, RecordPeriod
from app.domains.highlights.models import Highlight, HighlightPeriod, HighlightStatus


router = APIRouter()


# ==========================================
# SCHEMAS
# ==========================================

class ProjectOverviewCard(BaseModel):
    id: str
    name: str
    location: str
    status: str
    sets_count: int
    sets: list[str]
    oee: Optional[float] = None
    oee_diff: Optional[float] = None
    output: Optional[float] = None
    scrap_rate: Optional[float] = None
    downtime: Optional[float] = None
    latest_highlight: Optional[str] = None
    highlight_status: Optional[str] = None


class LocationOverview(BaseModel):
    location: str
    average_oee: Optional[float] = None
    total_output: Optional[float] = None
    projects_count: int
    projects: list[ProjectOverviewCard]


class GlobalOverviewMetrics(BaseModel):
    average_oee: Optional[float] = None
    total_output: Optional[float] = None
    average_scrap_rate: Optional[float] = None
    total_downtime: Optional[float] = None
    total_locations: int
    total_projects: int
    on_target_projects: int  # projects with OEE >= 80%


class OverviewResponse(BaseModel):
    iso_year: int
    iso_week: int
    week_label: str
    week_start: str
    global_metrics: GlobalOverviewMetrics
    locations: list[LocationOverview]


# ==========================================
# ENDPOINT
# ==========================================

@router.get("", response_model=OverviewResponse)
async def get_overview(
    iso_year: int = Query(..., ge=2020, le=2035, description="ISO year (e.g. 2026)"),
    iso_week: int = Query(..., ge=1, le=53, description="ISO week number (1-53)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint: Returns company-wide aggregated overview metrics
    for all manufacturing locations and their active projects for a given ISO week.
    """
    try:
        week_start = date.fromisocalendar(iso_year, iso_week, 1)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISO calendar week: year={iso_year}, week={iso_week}. Error: {str(e)}"
        )

    # Calculate previous week start for trend comparison
    if iso_week > 1:
        prev_week_start = date.fromisocalendar(iso_year, iso_week - 1, 1)
    else:
        prev_week_start = date.fromisocalendar(iso_year - 1, 52, 1)

    # 1. Fetch all active projects and their non-deleted sets
    projects_query = (
        select(Project)
        .where(Project.is_deleted == False, Project.status == ProjectStatus.ACTIVE)
        .options(selectinload(Project.sets))
        .order_by(Project.location.asc(), Project.name.asc())
    )
    projects_result = await db.execute(projects_query)
    projects = projects_result.scalars().all()

    if not projects:
        return OverviewResponse(
            iso_year=iso_year,
            iso_week=iso_week,
            week_label=f"CW{iso_week:02d}",
            week_start=week_start.isoformat(),
            global_metrics=GlobalOverviewMetrics(
                average_oee=None,
                total_output=None,
                average_scrap_rate=None,
                total_downtime=None,
                total_locations=0,
                total_projects=0,
                on_target_projects=0,
            ),
            locations=[],
        )

    project_ids = [p.id for p in projects]

    # 2. Fetch KPI definitions to resolve names: Output, Scrap Rate, OEE, Downtime
    defs_result = await db.execute(select(KPIDefinition))
    definitions = {d.id: d.name for d in defs_result.scalars().all()}

    # 3. Fetch KPI records for both current and previous weeks in one query
    kpi_query = (
        select(KPIRecord)
        .where(
            KPIRecord.project_id.in_(project_ids),
            KPIRecord.period == RecordPeriod.WEEKLY,
            KPIRecord.record_date.in_([week_start, prev_week_start]),
        )
    )
    kpis_result = await db.execute(kpi_query)
    all_kpi_records = kpis_result.scalars().all()

    # Map records: (project_id, week_start_date) -> {kpi_name: [values across sets]}
    curr_kpi_map: dict[str, dict[str, list[float]]] = {pid: {} for pid in project_ids}
    prev_kpi_map: dict[str, dict[str, list[float]]] = {pid: {} for pid in project_ids}

    for rec in all_kpi_records:
        if rec.numeric_value is None:
            continue
        kpi_name = definitions.get(rec.kpi_id)
        if not kpi_name:
            continue

        target_map = curr_kpi_map if rec.record_date == week_start else prev_kpi_map
        if rec.project_id in target_map:
            target_map[rec.project_id].setdefault(kpi_name, []).append(rec.numeric_value)

    # 4. Fetch highlights for the current week
    hl_query = (
        select(Highlight)
        .where(
            Highlight.project_id.in_(project_ids),
            Highlight.period == HighlightPeriod.WEEKLY,
            Highlight.record_date == week_start,
        )
        .order_by(Highlight.created_at.desc())
    )
    hl_result = await db.execute(hl_query)
    highlights = hl_result.scalars().all()

    highlights_map: dict[str, Highlight] = {}
    for h in highlights:
        if h.project_id not in highlights_map:
            highlights_map[h.project_id] = h

    # 5. Build project cards and group by location
    locations_dict: dict[str, list[ProjectOverviewCard]] = {}

    all_oee_values: list[float] = []
    all_outputs: list[float] = []
    all_scrap_rates: list[float] = []
    all_downtimes: list[float] = []
    on_target_count = 0

    for p in projects:
        loc = p.location or "Other"
        p_curr = curr_kpi_map.get(p.id, {})
        p_prev = prev_kpi_map.get(p.id, {})

        # Compute averages / sums across sets
        oee_vals = p_curr.get("OEE", [])
        avg_oee = round(sum(oee_vals) / len(oee_vals), 1) if oee_vals else None

        prev_oee_vals = p_prev.get("OEE", [])
        prev_avg_oee = round(sum(prev_oee_vals) / len(prev_oee_vals), 1) if prev_oee_vals else None
        oee_diff = round(avg_oee - prev_avg_oee, 1) if (avg_oee is not None and prev_avg_oee is not None) else None

        output_vals = p_curr.get("Output", [])
        # Output is cumulative across sets
        tot_output = round(sum(output_vals), 0) if output_vals else None

        scrap_vals = p_curr.get("Scrap Rate", [])
        avg_scrap = round(sum(scrap_vals) / len(scrap_vals), 2) if scrap_vals else None

        down_vals = p_curr.get("Downtime", [])
        tot_downtime = round(sum(down_vals), 1) if down_vals else None

        # Highlight
        p_hl = highlights_map.get(p.id)
        hl_text = p_hl.value if p_hl else None
        hl_status = p_hl.status.value if p_hl else None

        card = ProjectOverviewCard(
            id=p.id,
            name=p.name,
            location=loc,
            status=p.status.value,
            sets_count=len(p.sets),
            sets=[s.name for s in p.sets if not getattr(s, 'is_deleted', False)],
            oee=avg_oee,
            oee_diff=oee_diff,
            output=tot_output,
            scrap_rate=avg_scrap,
            downtime=tot_downtime,
            latest_highlight=hl_text,
            highlight_status=hl_status,
        )

        locations_dict.setdefault(loc, []).append(card)

        if avg_oee is not None:
            all_oee_values.append(avg_oee)
            if avg_oee >= 80.0:
                on_target_count += 1
        if tot_output is not None:
            all_outputs.append(tot_output)
        if avg_scrap is not None:
            all_scrap_rates.append(avg_scrap)
        if tot_downtime is not None:
            all_downtimes.append(tot_downtime)

    # 6. Aggregate locations
    locations_list: list[LocationOverview] = []
    for loc_name, cards in locations_dict.items():
        loc_oees = [c.oee for c in cards if c.oee is not None]
        loc_avg_oee = round(sum(loc_oees) / len(loc_oees), 1) if loc_oees else None

        loc_outputs = [c.output for c in cards if c.output is not None]
        loc_tot_output = round(sum(loc_outputs), 0) if loc_outputs else None

        locations_list.append(
            LocationOverview(
                location=loc_name,
                average_oee=loc_avg_oee,
                total_output=loc_tot_output,
                projects_count=len(cards),
                projects=cards,
            )
        )

    # Sort locations alphabetically or Morocco first
    locations_list.sort(key=lambda l: (0 if l.location.lower() == "morocco" else 1, l.location))

    # 7. Global metrics
    global_avg_oee = round(sum(all_oee_values) / len(all_oee_values), 1) if all_oee_values else None
    global_tot_output = round(sum(all_outputs), 0) if all_outputs else None
    global_avg_scrap = round(sum(all_scrap_rates) / len(all_scrap_rates), 2) if all_scrap_rates else None
    global_tot_downtime = round(sum(all_downtimes), 1) if all_downtimes else None

    global_metrics = GlobalOverviewMetrics(
        average_oee=global_avg_oee,
        total_output=global_tot_output,
        average_scrap_rate=global_avg_scrap,
        total_downtime=global_tot_downtime,
        total_locations=len(locations_list),
        total_projects=len(projects),
        on_target_projects=on_target_count,
    )

    return OverviewResponse(
        iso_year=iso_year,
        iso_week=iso_week,
        week_label=f"CW{iso_week:02d}",
        week_start=week_start.isoformat(),
        global_metrics=global_metrics,
        locations=locations_list,
    )
