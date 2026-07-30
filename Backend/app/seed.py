import asyncio
from datetime import date
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.domains.projects.models import Project, ProjectStatus
from app.domains.kpis.models import KPIDefinition, KPIRecord, KpiType, RecordPeriod
from app.domains.users.models import User, UserRole
from app.core.security import hash_password


PROJECTS = [
    {"name": "MEB31", "location": "Morocco"},
    {"name": "MEB21 HV", "location": "Morocco"},
    {"name": "TIGUAN", "location": "Morocco"},
    {"name": "MEB21 LV KSK", "location": "Morocco"},
    {"name": "MEB21 LV AUTRAK", "location": "Morocco"},
    {"name": "BMW", "location": "Mexico"},
]

USERS = [
    {"email": "admin@hcm.com", "full_name": "Admin User", "role": UserRole.ADMIN, "password": "admin123"},
    {"email": "viewer@hcm.com", "full_name": "Viewer User", "role": UserRole.VIEWER, "password": "viewer123"},
]

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
    {"iso_year": 2026, "iso_week": 32, "monday": date(2026, 8, 3)},
    {"iso_year": 2026, "iso_week": 33, "monday": date(2026, 8, 10)},
    {"iso_year": 2026, "iso_week": 34, "monday": date(2026, 8, 17)},
]

PROJECT_WEEKLY_DATA = {
    "MEB31": [
        {"Output": 9200, "Scrap Rate": 1.5, "OEE": 82.0, "Downtime": 2.8, "Highlight": "Strong start, excellent OEE"},
        {"Output": 8800, "Scrap Rate": 1.8, "OEE": 79.5, "Downtime": 3.2, "Highlight": "Slight dip due to material change"},
        {"Output": 9500, "Scrap Rate": 1.3, "OEE": 84.0, "Downtime": 2.1, "Highlight": "Record output week"},
        {"Output": 9100, "Scrap Rate": 1.6, "OEE": 81.0, "Downtime": 3.0, "Highlight": "Stable performance across shifts"},
        {"Output": 8900, "Scrap Rate": 1.4, "OEE": 80.5, "Downtime": 2.5, "Highlight": "Minor maintenance completed"},
        {"Output": 9300, "Scrap Rate": 1.7, "OEE": 82.5, "Downtime": 2.9, "Highlight": "New operator training ongoing"},
        {"Output": 8600, "Scrap Rate": 2.0, "OEE": 78.0, "Downtime": 3.8, "Highlight": "Raw material quality issue"},
        {"Output": 9000, "Scrap Rate": 1.5, "OEE": 81.5, "Downtime": 2.6, "Highlight": "Strong recovery, targets met"},
    ],
    "MEB21 HV": [
        {"Output": 8500, "Scrap Rate": 1.8, "OEE": 78.5, "Downtime": 3.5, "Highlight": "Stable production, minor adjustments needed"},
        {"Output": 7200, "Scrap Rate": 2.1, "OEE": 74.2, "Downtime": 5.2, "Highlight": "High scrap rate due to raw material defect"},
        {"Output": 8900, "Scrap Rate": 1.5, "OEE": 81.0, "Downtime": 2.1, "Highlight": "Team performed well, OEE improved significantly"},
        {"Output": 7800, "Scrap Rate": 1.9, "OEE": 76.8, "Downtime": 4.0, "Highlight": "Preventive maintenance performed"},
        {"Output": 8200, "Scrap Rate": 1.7, "OEE": 79.3, "Downtime": 3.0, "Highlight": "Good week, all quality targets met"},
        {"Output": 8000, "Scrap Rate": 1.6, "OEE": 78.0, "Downtime": 3.3, "Highlight": "Consistent throughput maintained"},
        {"Output": 7600, "Scrap Rate": 2.2, "OEE": 75.5, "Downtime": 4.5, "Highlight": "Tooling wear detected, replacement scheduled"},
        {"Output": 8400, "Scrap Rate": 1.4, "OEE": 80.2, "Downtime": 2.8, "Highlight": "End-of-month push, strong results"},
    ],
    "TIGUAN": [
        {"Output": 6500, "Scrap Rate": 2.0, "OEE": 76.0, "Downtime": 4.0, "Highlight": "Ramp-up phase ongoing"},
        {"Output": 6800, "Scrap Rate": 1.8, "OEE": 77.5, "Downtime": 3.5, "Highlight": "Process stabilization improving"},
        {"Output": 6200, "Scrap Rate": 2.3, "OEE": 74.0, "Downtime": 4.8, "Highlight": "Cooling system issue resolved"},
        {"Output": 7000, "Scrap Rate": 1.6, "OEE": 79.0, "Downtime": 3.0, "Highlight": "Best OEE so far this quarter"},
        {"Output": 6700, "Scrap Rate": 1.9, "OEE": 76.8, "Downtime": 3.8, "Highlight": "Shift handover gaps identified"},
        {"Output": 7100, "Scrap Rate": 1.5, "OEE": 80.0, "Downtime": 2.8, "Highlight": "Continuous improvement initiatives paying off"},
        {"Output": 6400, "Scrap Rate": 2.1, "OEE": 75.0, "Downtime": 4.2, "Highlight": "Unexpected line stoppage"},
        {"Output": 6900, "Scrap Rate": 1.7, "OEE": 78.2, "Downtime": 3.2, "Highlight": "Week-on-week improvement sustained"},
    ],
    "MEB21 LV KSK": [
        {"Output": 4800, "Scrap Rate": 2.5, "OEE": 72.0, "Downtime": 5.0, "Highlight": "Line balancing in progress"},
        {"Output": 5100, "Scrap Rate": 2.2, "OEE": 73.5, "Downtime": 4.5, "Highlight": "Minor process adjustment completed"},
        {"Output": 4600, "Scrap Rate": 2.8, "OEE": 70.0, "Downtime": 5.8, "Highlight": "Conveyor belt fault caused delay"},
        {"Output": 5200, "Scrap Rate": 2.0, "OEE": 75.0, "Downtime": 4.0, "Highlight": "Recovery plan implemented"},
        {"Output": 4900, "Scrap Rate": 2.3, "OEE": 72.5, "Downtime": 4.8, "Highlight": "Quality check frequency increased"},
        {"Output": 5300, "Scrap Rate": 1.9, "OEE": 76.0, "Downtime": 3.5, "Highlight": "Best production week for this line"},
        {"Output": 4700, "Scrap Rate": 2.6, "OEE": 71.0, "Downtime": 5.2, "Highlight": "Staff shortage impact"},
        {"Output": 5000, "Scrap Rate": 2.1, "OEE": 73.8, "Downtime": 4.2, "Highlight": "Stable end to the period"},
    ],
    "MEB21 LV AUTRAK": [
        {"Output": 3500, "Scrap Rate": 3.0, "OEE": 68.0, "Downtime": 6.0, "Highlight": "New line commissioning challenges"},
        {"Output": 3800, "Scrap Rate": 2.7, "OEE": 70.0, "Downtime": 5.2, "Highlight": "Process parameter tuning underway"},
        {"Output": 3400, "Scrap Rate": 3.2, "OEE": 66.5, "Downtime": 6.5, "Highlight": "Sensor calibration issues"},
        {"Output": 4000, "Scrap Rate": 2.5, "OEE": 72.0, "Downtime": 4.5, "Highlight": "Improvement after calibration"},
        {"Output": 3700, "Scrap Rate": 2.8, "OEE": 69.5, "Downtime": 5.5, "Highlight": "Operator training sessions held"},
        {"Output": 4100, "Scrap Rate": 2.3, "OEE": 73.0, "Downtime": 4.0, "Highlight": "Gradual ramp-up continues"},
        {"Output": 3600, "Scrap Rate": 3.1, "OEE": 67.5, "Downtime": 5.8, "Highlight": "Material shortage affected output"},
        {"Output": 3900, "Scrap Rate": 2.6, "OEE": 70.8, "Downtime": 5.0, "Highlight": "End of period assessment positive"},
    ],
    "BMW": [
        {"Output": 7500, "Scrap Rate": 1.9, "OEE": 77.0, "Downtime": 3.8, "Highlight": "Mexico plant ramping steadily"},
        {"Output": 7800, "Scrap Rate": 1.7, "OEE": 78.5, "Downtime": 3.2, "Highlight": "Local workforce fully trained"},
        {"Output": 7200, "Scrap Rate": 2.1, "OEE": 75.0, "Downtime": 4.2, "Highlight": "Supply chain disruption"},
        {"Output": 8000, "Scrap Rate": 1.5, "OEE": 80.0, "Downtime": 2.8, "Highlight": "Production milestone achieved"},
        {"Output": 7700, "Scrap Rate": 1.8, "OEE": 77.8, "Downtime": 3.5, "Highlight": "Consistent quality maintained"},
        {"Output": 8100, "Scrap Rate": 1.4, "OEE": 81.0, "Downtime": 2.5, "Highlight": "Record OEE for Mexico plant"},
        {"Output": 7400, "Scrap Rate": 2.0, "OEE": 76.0, "Downtime": 4.0, "Highlight": "Preventive maintenance week"},
        {"Output": 7900, "Scrap Rate": 1.6, "OEE": 79.2, "Downtime": 3.0, "Highlight": "Strong finish, targets achieved"},
    ],
}


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

            project_data = PROJECT_WEEKLY_DATA[proj_info["name"]]

            for week_idx, week in enumerate(WEEKS):
                data = project_data[week_idx]

                existing_record = await session.execute(
                    select(KPIRecord).where(
                        KPIRecord.project_id == project.id,
                        KPIRecord.kpi_id == def_map["Output"].id,
                        KPIRecord.record_date == week["monday"],
                        KPIRecord.period == RecordPeriod.WEEKLY,
                    )
                )
                if existing_record.scalar_one_or_none():
                    continue

                records = []
                for def_name, definition in def_map.items():
                    if def_name == "Highlight":
                        record = KPIRecord(
                            project_id=project.id,
                            kpi_id=definition.id,
                            record_date=week["monday"],
                            period=RecordPeriod.WEEKLY,
                            text_value=data[def_name],
                        )
                    else:
                        record = KPIRecord(
                            project_id=project.id,
                            kpi_id=definition.id,
                            record_date=week["monday"],
                            period=RecordPeriod.WEEKLY,
                            numeric_value=float(data[def_name]),
                        )
                    records.append(record)

                session.add_all(records)
                await session.flush()

            print(f"Seeded {len(WEEKS)} weeks for {proj_info['name']}")

        await session.commit()
        print("\nSeeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
