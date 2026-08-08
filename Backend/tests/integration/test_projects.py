"""
tests/integration/test_projects.py
Integration tests for /api/v1/projects — CRUD + set management.
"""

import pytest
import uuid


# ─────────────────────────────────────────────────────────────────────────────
# POST /projects
# ─────────────────────────────────────────────────────────────────────────────

class TestCreateProject:

    def _payload(self, **overrides):
        return {"name": "Alpha Plant", "status": "ACTIVE", "location": "Morocco",
                "initial_sets_count": 2, **overrides}

    async def test_create_project_success(self, client, auth_headers):
        resp = await client.post("/api/v1/projects", json=self._payload(), headers=auth_headers)
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "Alpha Plant"
        assert body["location"] == "Morocco"
        assert len(body["sets"]) == 2
        # Verify auto-named sets
        names = {s["name"] for s in body["sets"]}
        assert names == {"Set 1", "Set 2"}

    async def test_create_project_default_one_set(self, client, auth_headers):
        resp = await client.post(
            "/api/v1/projects",
            json={"name": "Beta Plant", "initial_sets_count": 1},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert len(resp.json()["sets"]) == 1

    async def test_duplicate_name_returns_400(self, client, sample_project, auth_headers):
        resp = await client.post(
            "/api/v1/projects",
            json=self._payload(name=sample_project.name),
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "already exists" in resp.json()["detail"]

    async def test_unauthenticated_returns_401(self, client):
        resp = await client.post("/api/v1/projects", json=self._payload())
        assert resp.status_code in (401, 403)

    async def test_initial_sets_count_zero_returns_422(self, client, auth_headers):
        resp = await client.post(
            "/api/v1/projects",
            json=self._payload(initial_sets_count=0),
            headers=auth_headers,
        )
        assert resp.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# GET /projects
# ─────────────────────────────────────────────────────────────────────────────

class TestListProjects:

    async def test_list_returns_projects(self, client, sample_project):
        resp = await client.get("/api/v1/projects")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total" in body
        assert body["total"] >= 1

    async def test_pagination_page_size(self, client, db_session, auth_headers):
        from tests.conftest import _create_project
        for i in range(5):
            await _create_project(db_session, name=f"Pag Project {i}")

        resp = await client.get("/api/v1/projects?page=1&page_size=3")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["items"]) <= 3
        assert body["page"] == 1
        assert body["page_size"] == 3

    async def test_location_filter(self, client, db_session, auth_headers):
        from tests.conftest import _create_project
        await _create_project(db_session, name="France Site", location="France")
        await _create_project(db_session, name="Morocco Site", location="Morocco")

        resp = await client.get("/api/v1/projects?location=France")
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert all(p["location"] == "France" for p in items)

    async def test_no_auth_required_for_list(self, client):
        """GET /projects is a public endpoint."""
        resp = await client.get("/api/v1/projects")
        assert resp.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /projects/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestGetProject:

    async def test_get_project_by_id(self, client, sample_project):
        resp = await client.get(f"/api/v1/projects/{sample_project.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == sample_project.name

    async def test_get_project_not_found(self, client):
        fake_id = str(uuid.uuid4())
        resp = await client.get(f"/api/v1/projects/{fake_id}")
        assert resp.status_code == 404

    async def test_get_project_with_kpis(self, client, sample_project):
        resp = await client.get(f"/api/v1/projects/{sample_project.id}?include_kpis=true")
        assert resp.status_code == 200
        body = resp.json()
        assert "kpi_records" in body
        assert isinstance(body["kpi_records"], list)

    async def test_get_project_invalid_uuid(self, client):
        resp = await client.get("/api/v1/projects/not-a-uuid")
        assert resp.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /projects/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestUpdateProject:

    async def test_update_project_name(self, client, sample_project, auth_headers):
        resp = await client.patch(
            f"/api/v1/projects/{sample_project.id}",
            json={"name": "Renamed Plant"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed Plant"

    async def test_update_project_status(self, client, sample_project, auth_headers):
        resp = await client.patch(
            f"/api/v1/projects/{sample_project.id}",
            json={"status": "COMPLETED"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "COMPLETED"

    async def test_update_to_duplicate_name_returns_400(self, client, db_session, sample_project, auth_headers):
        from tests.conftest import _create_project
        other = await _create_project(db_session, name="Other Plant")
        resp = await client.patch(
            f"/api/v1/projects/{sample_project.id}",
            json={"name": other.name},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    async def test_update_nonexistent_project_returns_404(self, client, auth_headers):
        resp = await client.patch(
            f"/api/v1/projects/{uuid.uuid4()}",
            json={"name": "Ghost"},
            headers=auth_headers,
        )
        assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /projects/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestDeleteProject:

    async def test_soft_delete_project(self, client, sample_project, auth_headers):
        resp = await client.delete(
            f"/api/v1/projects/{sample_project.id}",
            headers=auth_headers,
        )
        assert resp.status_code == 204

    async def test_deleted_project_not_found(self, client, sample_project, auth_headers):
        await client.delete(f"/api/v1/projects/{sample_project.id}", headers=auth_headers)
        resp = await client.get(f"/api/v1/projects/{sample_project.id}")
        assert resp.status_code == 404

    async def test_delete_nonexistent_returns_404(self, client, auth_headers):
        resp = await client.delete(f"/api/v1/projects/{uuid.uuid4()}", headers=auth_headers)
        assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# SET MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

class TestProjectSets:

    async def test_add_set_to_project(self, client, sample_project, auth_headers):
        resp = await client.post(
            f"/api/v1/projects/{sample_project.id}/sets",
            json={"name": "Set Extra"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "Set Extra"
        assert body["project_id"] == sample_project.id

    async def test_add_set_to_nonexistent_project_returns_404(self, client, auth_headers):
        resp = await client.post(
            f"/api/v1/projects/{uuid.uuid4()}/sets",
            json={"name": "Orphan Set"},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_update_set_name(self, client, sample_project, auth_headers):
        # The sample_project fixture has 2 sets
        project_resp = await client.get(f"/api/v1/projects/{sample_project.id}")
        set_id = project_resp.json()["sets"][0]["id"]

        resp = await client.patch(
            f"/api/v1/projects/{sample_project.id}/sets/{set_id}",
            json={"name": "Renamed Set"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed Set"

    async def test_soft_delete_set(self, client, sample_project, auth_headers):
        project_resp = await client.get(f"/api/v1/projects/{sample_project.id}")
        set_id = project_resp.json()["sets"][0]["id"]

        resp = await client.delete(
            f"/api/v1/projects/{sample_project.id}/sets/{set_id}",
            headers=auth_headers,
        )
        assert resp.status_code == 204

    async def test_delete_already_deleted_set_returns_404(self, client, sample_project, auth_headers):
        project_resp = await client.get(f"/api/v1/projects/{sample_project.id}")
        set_id = project_resp.json()["sets"][0]["id"]

        # First delete
        await client.delete(
            f"/api/v1/projects/{sample_project.id}/sets/{set_id}",
            headers=auth_headers,
        )
        # Second delete should 404
        resp = await client.delete(
            f"/api/v1/projects/{sample_project.id}/sets/{set_id}",
            headers=auth_headers,
        )
        assert resp.status_code == 404
