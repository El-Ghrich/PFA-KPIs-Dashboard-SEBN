"""
tests/integration/test_kpis.py
Integration tests for /api/v1/kpis — definitions, records (single & bulk), queries.
"""

import pytest
from datetime import date, timedelta


# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────────────────

def _record_payload(project_id: str, kpi_id: str, **overrides):
    return {
        "project_id": project_id,
        "kpi_id": kpi_id,
        "record_date": str(date.today()),
        "period": "DAILY",
        "numeric_value": 42.0,
        **overrides,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /kpis/definitions
# ─────────────────────────────────────────────────────────────────────────────

class TestKPIDefinitions:

    async def test_create_definition_success(self, client, auth_headers):
        resp = await client.post(
            "/api/v1/kpis/definitions",
            json={"name": "Throughput", "unit": "units/hr", "kpi_type": "NUMERIC"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "Throughput"
        assert body["kpi_type"] == "NUMERIC"
        assert "id" in body

    async def test_duplicate_definition_name_returns_400(self, client, sample_kpi_def, auth_headers):
        resp = await client.post(
            "/api/v1/kpis/definitions",
            json={"name": sample_kpi_def.name, "unit": "%", "kpi_type": "NUMERIC"},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "already exists" in resp.json()["detail"]

    async def test_list_definitions(self, client, sample_kpi_def):
        resp = await client.get("/api/v1/kpis/definitions")
        assert resp.status_code == 200
        names = [d["name"] for d in resp.json()]
        assert sample_kpi_def.name in names

    async def test_create_definition_unauthenticated(self, client):
        resp = await client.post(
            "/api/v1/kpis/definitions",
            json={"name": "Ghost KPI", "unit": "x", "kpi_type": "NUMERIC"},
        )
        assert resp.status_code in (401, 403)

    async def test_create_text_type_definition(self, client, auth_headers):
        resp = await client.post(
            "/api/v1/kpis/definitions",
            json={"name": "Status Note", "unit": "text", "kpi_type": "TEXT"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["kpi_type"] == "TEXT"


# ─────────────────────────────────────────────────────────────────────────────
# POST /kpis/records  (single record)
# ─────────────────────────────────────────────────────────────────────────────

class TestCreateKPIRecord:

    async def test_create_record_jwt_auth(self, client, sample_project, sample_kpi_def, auth_headers):
        resp = await client.post(
            "/api/v1/kpis/records",
            json=_record_payload(sample_project.id, sample_kpi_def.id),
            headers=auth_headers,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["project_id"] == sample_project.id
        assert body["numeric_value"] == 42.0
        assert "id" in body

    async def test_create_record_unknown_project_returns_404(
        self, client, sample_kpi_def, auth_headers
    ):
        from uuid import uuid4
        resp = await client.post(
            "/api/v1/kpis/records",
            json=_record_payload(str(uuid4()), sample_kpi_def.id),
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_create_record_unknown_kpi_returns_404(
        self, client, sample_project, auth_headers
    ):
        from uuid import uuid4
        resp = await client.post(
            "/api/v1/kpis/records",
            json=_record_payload(sample_project.id, str(uuid4())),
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_numeric_kpi_without_value_returns_400(
        self, client, sample_project, sample_kpi_def, auth_headers
    ):
        """NUMERIC KPI must have numeric_value if is_missing=False."""
        resp = await client.post(
            "/api/v1/kpis/records",
            json=_record_payload(
                sample_project.id, sample_kpi_def.id,
                numeric_value=None,
                is_missing=False,
            ),
            headers=auth_headers,
        )
        assert resp.status_code == 400

    async def test_missing_record_does_not_require_value(
        self, client, sample_project, sample_kpi_def, auth_headers
    ):
        resp = await client.post(
            "/api/v1/kpis/records",
            json=_record_payload(
                sample_project.id, sample_kpi_def.id,
                numeric_value=None,
                is_missing=True,
            ),
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["is_missing"] is True

    async def test_create_record_unauthenticated(self, client, sample_project, sample_kpi_def):
        resp = await client.post(
            "/api/v1/kpis/records",
            json=_record_payload(sample_project.id, sample_kpi_def.id),
        )
        assert resp.status_code in (401, 403)


# ─────────────────────────────────────────────────────────────────────────────
# POST /kpis/records/bulk
# ─────────────────────────────────────────────────────────────────────────────

class TestBulkKPIRecords:

    async def test_bulk_create_success(self, client, sample_project, sample_kpi_def, auth_headers):
        today = str(date.today())
        yesterday = str(date.today() - timedelta(days=1))
        resp = await client.post(
            "/api/v1/kpis/records/bulk",
            json={"records": [
                _record_payload(sample_project.id, sample_kpi_def.id, record_date=today, numeric_value=10.0),
                _record_payload(sample_project.id, sample_kpi_def.id, record_date=yesterday, numeric_value=20.0),
            ]},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["total"] == 2
        assert len(body["records"]) == 2

    async def test_bulk_fails_if_any_kpi_invalid(self, client, sample_project, auth_headers):
        from uuid import uuid4
        resp = await client.post(
            "/api/v1/kpis/records/bulk",
            json={"records": [
                _record_payload(sample_project.id, str(uuid4())),  # bad kpi_id
            ]},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_bulk_empty_list_accepted(self, client, auth_headers):
        """Empty bulk payload — service returns 0 records."""
        resp = await client.post(
            "/api/v1/kpis/records/bulk",
            json={"records": []},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["total"] == 0


# ─────────────────────────────────────────────────────────────────────────────
# GET /kpis/records  (project query with filters)
# ─────────────────────────────────────────────────────────────────────────────

class TestQueryKPIRecords:

    async def _seed_record(self, client, sample_project, sample_kpi_def, auth_headers, **overrides):
        payload = _record_payload(sample_project.id, sample_kpi_def.id, **overrides)
        resp = await client.post("/api/v1/kpis/records", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        return resp.json()

    async def test_list_records_for_project(
        self, client, sample_project, sample_kpi_def, auth_headers
    ):
        await self._seed_record(client, sample_project, sample_kpi_def, auth_headers)
        resp = await client.get(f"/api/v1/kpis/records?project_id={sample_project.id}")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    async def test_filter_by_period(self, client, sample_project, sample_kpi_def, auth_headers):
        await self._seed_record(client, sample_project, sample_kpi_def, auth_headers, period="DAILY")
        resp = await client.get(
            f"/api/v1/kpis/records?project_id={sample_project.id}&period=DAILY"
        )
        assert resp.status_code == 200
        assert all(r["period"] == "DAILY" for r in resp.json())

    async def test_iso_week_without_iso_year_returns_400(self, client, sample_project):
        resp = await client.get(
            f"/api/v1/kpis/records?project_id={sample_project.id}&iso_week=5"
        )
        assert resp.status_code == 400
        assert "iso_year" in resp.json()["detail"]

    async def test_filter_by_kpi_id(self, client, sample_project, sample_kpi_def, auth_headers):
        await self._seed_record(client, sample_project, sample_kpi_def, auth_headers)
        resp = await client.get(
            f"/api/v1/kpis/records?project_id={sample_project.id}&kpi_id={sample_kpi_def.id}"
        )
        assert resp.status_code == 200
        assert all(r["kpi_id"] == sample_kpi_def.id for r in resp.json())


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /kpis/records/{id}  and  DELETE /kpis/records/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestKPIRecordCRUD:

    async def _seed(self, client, sample_project, sample_kpi_def, auth_headers):
        payload = _record_payload(sample_project.id, sample_kpi_def.id, numeric_value=5.0)
        resp = await client.post("/api/v1/kpis/records", json=payload, headers=auth_headers)
        return resp.json()

    async def test_update_record_numeric_value(
        self, client, sample_project, sample_kpi_def, auth_headers
    ):
        record = await self._seed(client, sample_project, sample_kpi_def, auth_headers)
        resp = await client.patch(
            f"/api/v1/kpis/records/{record['id']}",
            json={"numeric_value": 99.9},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["numeric_value"] == 99.9

    async def test_get_record_by_id(self, client, sample_project, sample_kpi_def, auth_headers):
        record = await self._seed(client, sample_project, sample_kpi_def, auth_headers)
        resp = await client.get(f"/api/v1/kpis/records/{record['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == record["id"]

    async def test_get_nonexistent_record_returns_404(self, client):
        from uuid import uuid4
        resp = await client.get(f"/api/v1/kpis/records/{uuid4()}")
        assert resp.status_code == 404

    async def test_delete_record_success(
        self, client, sample_project, sample_kpi_def, auth_headers
    ):
        record = await self._seed(client, sample_project, sample_kpi_def, auth_headers)
        resp = await client.delete(
            f"/api/v1/kpis/records/{record['id']}",
            headers=auth_headers,
        )
        assert resp.status_code == 204

    async def test_delete_nonexistent_record_returns_404(self, client, auth_headers):
        from uuid import uuid4
        resp = await client.delete(
            f"/api/v1/kpis/records/{uuid4()}",
            headers=auth_headers,
        )
        assert resp.status_code == 404
