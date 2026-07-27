import asyncio
from datetime import date
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.domains.projects.models import Project
from app.domains.kpis.models import KPIDefinition, KPIRecord, KpiType, RecordPeriod


PROJECT_NAME = "MEB21 HV"
LOCATION = "Morocco"

DEFINITIONS = [
    {"name": "Output", "unit": "units", "kpi_type": KpiType.NUMERIC},
    {"name": "Scrap Rate", "unit": "%", "kpi_type": KpiType.NUMERIC},
    {"name": "OEE", "unit": "%", "kpi_type": KpiType.NUMERIC},
    {"name": "Downtime", "unit": "hours", "kpi_type": KpiType.NUMERIC},
    {"name": "Highlight", "unit": "", "kpi_type": KpiType.TEXT},
]

WEEKS = [
    {"iso_year": 2026, "iso_week": 27, "monday": date(2026, 6, 29)},
    {"iso_year": 2026, "iso_week": 28, "monday": date(2026, 7, 6)},
    {"iso_year": 2026, "iso_week": 29, "monday": date(2026, 7, 13)},
    {"iso_year": 2026, "iso_week": 30, "monday": date(2026, 7, 20)},
    {"iso_year": 2026, "iso_week": 31, "monday": date(2026, 7, 27)},
]

WEEKLY_DATA = [
    {"Output": 8500, "Scrap Rate": 1.8, "OEE": 78.5, "Downtime": 3.5,
     "Highlight": "Stable production, minor adjustments needed"},
    {"Output": 7200, "Scrap Rate": 2.1, "OEE": 74.2, "Downtime": 5.2,
     "Highlight": "High scrap rate due to raw material defect"},
    {"Output": 8900, "Scrap Rate": 1.5, "OEE": 81.0, "Downtime": 2.1,
     "Highlight": "Team performed well, OEE improved significantly"},
    {"Output": 7800, "Scrap Rate": 1.9, "OEE": 76.8, "Downtime": 4.0,
     "Highlight": "Preventive maintenance performed, downtime controlled"},
    {"Output": 8200, "Scrap Rate": 1.7, "OEE": 79.3, "Downtime": 3.0,
     "Highlight": "Good week, all quality targets met"},
]


async def seed():
    async with AsyncSessionLocal() as session:
        project = await session.execute(
            select(Project).where(Project.name == PROJECT_NAME)
        )
        project = project.scalar_one_or_none()

        if not project:
            project = Project(name=PROJECT_NAME, location=LOCATION)
            session.add(project)
            await session.flush()
            print(f"Created project: {PROJECT_NAME}")
        else:
            print(f"Project already exists: {PROJECT_NAME}")

        def_map = {}
        for d in DEFINITIONS:
            existing = await session.execute(
                select(KPIDefinition).where(KPIDefinition.name == d["name"])
            )
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

        for week_idx, week in enumerate(WEEKS):
            data = WEEKLY_DATA[week_idx]

            existing_record = await session.execute(
                select(KPIRecord).where(
                    KPIRecord.project_id == project.id,
                    KPIRecord.kpi_id == def_map["Output"].id,
                    KPIRecord.record_date == week["monday"],
                    KPIRecord.period == RecordPeriod.WEEKLY,
                )
            )
            if existing_record.scalar_one_or_none():
                print(f"Week {week['iso_week']} already seeded, skipping")
                continue

            records = []
            for def_name, definition in def_map.items():
                value = data[def_name]
                record = KPIRecord(
                    project_id=project.id,
                    kpi_id=definition.id,
                    record_date=week["monday"],
                    period=RecordPeriod.WEEKLY,
                    numeric_value=float(value) if definition.kpi_type == KpiType.NUMERIC else None,
                    text_value=str(value) if definition.kpi_type == KpiType.TEXT else None,
                )
                records.append(record)

            session.add_all(records)
            await session.flush()
            print(f"Seeded week {week['iso_week']} ({week['monday']})")

        await session.commit()
        print("\nSeeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
