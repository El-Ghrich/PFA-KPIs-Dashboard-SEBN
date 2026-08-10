import pytest


@pytest.mark.asyncio
class TestKeyTakeaways:
    async def test_get_takeaways_empty(self, client, sample_project):
        resp = await client.get(f"/api/v1/projects/{sample_project.id}/takeaways")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_create_bulk_takeaways_success(self, client, sample_project, auth_headers):
        payload = {
            "items": [
                {"content": "Line 1 successfully upgraded to high-speed sensors."},
                {"content": "New safety protocol deployed across plant floor."},
            ]
        }
        resp = await client.post(
            f"/api/v1/projects/{sample_project.id}/takeaways",
            json=payload,
            headers=auth_headers,
        )
        assert resp.status_code == 201
        created = resp.json()
        assert len(created) == 2
        assert created[0]["content"] == "Line 1 successfully upgraded to high-speed sensors."
        assert created[1]["content"] == "New safety protocol deployed across plant floor."
        assert created[0]["project_id"] == sample_project.id

        # Verify GET returns both
        get_resp = await client.get(f"/api/v1/projects/{sample_project.id}/takeaways")
        assert get_resp.status_code == 200
        items = get_resp.json()["items"]
        assert len(items) == 2

    async def test_create_takeaways_unauthenticated_401(self, client, sample_project):
        payload = {"items": [{"content": "Unauthenticated note"}]}
        resp = await client.post(
            f"/api/v1/projects/{sample_project.id}/takeaways",
            json=payload,
        )
        assert resp.status_code == 401

    async def test_delete_takeaway(self, client, sample_project, auth_headers):
        # Create one
        create_resp = await client.post(
            f"/api/v1/projects/{sample_project.id}/takeaways",
            json={"items": [{"content": "Temporary note"}]},
            headers=auth_headers,
        )
        takeaway_id = create_resp.json()[0]["id"]

        # Delete it
        del_resp = await client.delete(
            f"/api/v1/takeaways/{takeaway_id}",
            headers=auth_headers,
        )
        assert del_resp.status_code == 204

        # Verify no longer returned
        get_resp = await client.get(f"/api/v1/projects/{sample_project.id}/takeaways")
        assert get_resp.json()["total"] == 0
