import asyncio
from datetime import date
import random
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.domains.projects.models import Project, ProjectSet, ProjectStatus
from app.domains.kpis.models import KPIDefinition, KPIRecord, KpiType, RecordPeriod
from app.domains.highlights.models import Highlight, HighlightStatus, HighlightPeriod
from app.domains.users.models import User, UserRole
from app.core.security import hash_password


DEFINITIONS = [
    {"name": "Output", "unit": "units", "kpi_type": KpiType.NUMERIC},
    {"name": "Scrap Rate", "unit": "%", "kpi_type": KpiType.NUMERIC},
    {"name": "OEE", "unit": "%", "kpi_type": KpiType.NUMERIC},
    {"name": "Downtime", "unit": "hours", "kpi_type": KpiType.NUMERIC},
    {"name": "Insertion rate cim-1", "unit": "%", "kpi_type": KpiType.NUMERIC},
    {"name": "Insertion rate cim-2", "unit": "%", "kpi_type": KpiType.NUMERIC},
    {"name": "Insertion rate cim-3", "unit": "%", "kpi_type": KpiType.NUMERIC},
]

HIGHLIGHT_STATUS = {
    "Slight dip due to material change": HighlightStatus.BAD,
    "Raw material quality issue": HighlightStatus.BAD,
    "High scrap rate due to raw material defect": HighlightStatus.BAD,
    "Tooling wear detected, replacement scheduled": HighlightStatus.BAD,
    "Shift handover gaps identified": HighlightStatus.BAD,
    "Unexpected line stoppage": HighlightStatus.BAD,
    "Conveyor belt fault caused delay": HighlightStatus.BAD,
    "Staff shortage impact": HighlightStatus.BAD,
    "New line commissioning challenges": HighlightStatus.BAD,
    "Sensor calibration issues": HighlightStatus.BAD,
    "Material shortage affected output": HighlightStatus.BAD,
    "Supply chain disruption": HighlightStatus.BAD,
    "Preventive maintenance performed": HighlightStatus.BAD,
    "Cooling system issue resolved": HighlightStatus.BAD,
    "Quality check frequency increased": HighlightStatus.BAD,
    "Process parameter tuning underway": HighlightStatus.BAD,
    "New operator training ongoing": HighlightStatus.BAD,
    "Minor process adjustment completed": HighlightStatus.BAD,
}


PROJECTS = [
    {"name": "MEB31", "location": "Morocco", "sets": ["Set 1", "Set 2", "Set 3"]},
    {"name": "MEB21 HV", "location": "Morocco", "sets": ["Set 1", "Set 2"]},
    {"name": "TIGUAN", "location": "Morocco", "sets": ["Set 1", "Set 2", "Set 3", "Set 4"]},
    {"name": "MEB21 LV KSK", "location": "Morocco", "sets": ["Set 1", "Set 2"]},
    {"name": "MEB21 LV AUTRAK", "location": "Morocco", "sets": ["Set 1", "Set 2", "Set 3"]},
    {"name": "BMW", "location": "Mexico", "sets": ["Set 1", "Set 2", "Set 3"]},
]

USERS = [
    {"email": "superadmin@hcm.com", "full_name": "Super Admin", "role": UserRole.SUPER_ADMIN, "password": "superadmin123"},
    {"email": "admin@hcm.com", "full_name": "Admin User", "role": UserRole.ADMIN, "password": "admin123"},
]

WEEKS = [
    {"iso_year": 2026, "iso_week": 27, "monday": date(2026, 6, 29)},
    {"iso_year": 2026, "iso_week": 28, "monday": date(2026, 7, 6)},
    {"iso_year": 2026, "iso_week": 29, "monday": date(2026, 7, 13)},
    {"iso_year": 2026, "iso_week": 30, "monday": date(2026, 7, 20)},
    {"iso_year": 2026, "iso_week": 31, "monday": date(2026, 7, 27)},
    {"iso_year": 2026, "iso_week": 32, "monday": date(2026, 8, 3)},
    {"iso_year": 2026, "iso_week": 33, "monday": date(2026, 8, 10)},
    {"iso_year": 2026, "iso_week": 34, "monday": date(2026, 8, 17)},
]

BASE_WEEKLY_DATA = [
    {"Output": 9200, "Scrap Rate": 1.5, "OEE": 82.0, "Downtime": 2.8, "Highlight": "Strong start, excellent OEE"},
    {"Output": 8800, "Scrap Rate": 1.8, "OEE": 79.5, "Downtime": 3.2, "Highlight": "Slight dip due to material change"},
    {"Output": 9500, "Scrap Rate": 1.3, "OEE": 84.0, "Downtime": 2.1, "Highlight": "Record output week"},
    {"Output": 9100, "Scrap Rate": 1.6, "OEE": 81.0, "Downtime": 3.0, "Highlight": "Stable performance across shifts"},
    {"Output": 8900, "Scrap Rate": 1.4, "OEE": 80.5, "Downtime": 2.5, "Highlight": "Minor maintenance completed"},
    {"Output": 9300, "Scrap Rate": 1.7, "OEE": 82.5, "Downtime": 2.9, "Highlight": "New operator training ongoing"},
    {"Output": 8600, "Scrap Rate": 2.0, "OEE": 78.0, "Downtime": 3.8, "Highlight": "Raw material quality issue"},
    {"Output": 9000, "Scrap Rate": 1.5, "OEE": 81.5, "Downtime": 2.6, "Highlight": "Strong recovery, targets met"},
]


async def seed():
    async with AsyncSessionLocal() as session:
        for u in USERS:
            existing = await session.execute(select(User).where(User.email == u["email"]))
            if existing.scalar_one_or_none():
                print(f"User already exists: {u['email']}")
            else:
                user = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    role=u["role"],
                    password_hash=hash_password(u["password"])
                )
                session.add(user)
                await session.flush()
                print(f"Created user: {u['email']} ({u['role'].value})")

        def_map = {}
        for d in DEFINITIONS:
            existing = await session.execute(select(KPIDefinition).where(KPIDefinition.name == d["name"]))
            existing = existing.scalar_one_or_none()
            if existing:
                def_map[d["name"]] = existing
                print(f"Definition already exists: {d['name']}")
            else:
                kpi_def = KPIDefinition(**d)
                session.add(kpi_def)
                await session.flush()
                def_map[d["name"]] = kpi_def
                print(f"Created definition: {d['name']}")

        for proj_info in PROJECTS:
            existing = await session.execute(select(Project).where(Project.name == proj_info["name"]))
            project = existing.scalar_one_or_none()

            if not project:
                project = Project(
                    name=proj_info["name"],
                    location=proj_info["location"],
                    status=ProjectStatus.ACTIVE,
                )
                session.add(project)
                await session.flush()
                print(f"Created project: {proj_info['name']} ({proj_info['location']})")
            else:
                print(f"Project already exists: {proj_info['name']}")

            # Seed Sets for this project
            set_map = {}
            for set_name in proj_info["sets"]:
                existing_set = await session.execute(
                    select(ProjectSet).where(
                        ProjectSet.project_id == project.id,
                        ProjectSet.name == set_name
                    )
                )
                pset = existing_set.scalar_one_or_none()
                if not pset:
                    pset = ProjectSet(project_id=project.id, name=set_name)
                    session.add(pset)
                    await session.flush()
                    print(f"  Created set: {set_name} for {project.name}")
                set_map[set_name] = pset

            # Seed weekly data per set
            for set_name, pset in set_map.items():
                for week_idx, week in enumerate(WEEKS):
                    base_data = BASE_WEEKLY_DATA[week_idx]
                    # Add slight variation per set
                    set_multiplier = 0.9 + (hash(set_name + str(week_idx)) % 20) / 100.0

                    output_val = round(base_data["Output"] * set_multiplier)
                    scrap_val = round(base_data["Scrap Rate"] * set_multiplier, 1)
                    oee_val = min(100.0, round(base_data["OEE"] * set_multiplier, 1))
                    downtime_val = round(base_data["Downtime"] * set_multiplier, 1)
                    ins1_val = round(random.uniform(75, 90), 1)
                    ins2_val = round(random.uniform(75, 90), 1)
                    ins3_val = round(random.uniform(75, 90), 1)

                    kpi_values = {
                        "Output": output_val,
                        "Scrap Rate": scrap_val,
                        "OEE": oee_val,
                        "Downtime": downtime_val,
                        "Insertion rate cim-1": ins1_val,
                        "Insertion rate cim-2": ins2_val,
                        "Insertion rate cim-3": ins3_val,
                    }

                    existing_record = await session.execute(
                        select(KPIRecord).where(
                            KPIRecord.project_id == project.id,
                            KPIRecord.set_id == pset.id,
                            KPIRecord.kpi_id == def_map["Output"].id,
                            KPIRecord.record_date == week["monday"],
                            KPIRecord.period == RecordPeriod.WEEKLY,
                        )
                    )
                    if not existing_record.scalars().first():
                        records = []
                        for def_name, definition in def_map.items():
                            record = KPIRecord(
                                project_id=project.id,
                                set_id=pset.id,
                                kpi_id=definition.id,
                                record_date=week["monday"],
                                period=RecordPeriod.WEEKLY,
                                numeric_value=float(kpi_values[def_name]),
                            )
                            records.append(record)

                        session.add_all(records)
                        await session.flush()

            # Seed project-level highlights per week
            for week_idx, week in enumerate(WEEKS):
                base_data = BASE_WEEKLY_DATA[week_idx]
                existing_highlight = await session.execute(
                    select(Highlight).where(
                        Highlight.project_id == project.id,
                        Highlight.record_date == week["monday"],
                        Highlight.period == HighlightPeriod.WEEKLY,
                    )
                )
                highlight = existing_highlight.scalars().first()
                status = HIGHLIGHT_STATUS.get(base_data["Highlight"], HighlightStatus.GOOD)
                if highlight:
                    highlight.value = base_data["Highlight"]
                    highlight.status = status
                else:
                    session.add(Highlight(
                        project_id=project.id,
                        record_date=week["monday"],
                        period=HighlightPeriod.WEEKLY,
                        value=base_data["Highlight"],
                        status=status,
                    ))
                await session.flush()

            print(f"Seeded {len(WEEKS)} weeks across {len(set_map)} sets for {proj_info['name']}")

        await session.commit()
        print("\nSeeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
