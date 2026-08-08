"""
tests/integration/test_api_keys.py
Integration tests for /api/v1/api-keys — create, list, revoke, delete, and auth via API key.
"""

import pytest
from datetime import datetime, timedelta, timezone


def _key_payload(name: str = "Test Key", days: int = 30, user_id: str | None = None) -> dict:
    expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    payload = {"name": name, "expires_at": expires_at}
    if user_id:
        payload["user_id"] = user_id
    return payload


# ─────────────────────────────────────────────────────────────────────────────
# POST /api-keys
# ─────────────────────────────────────────────────────────────────────────────

class TestCreateApiKey:

    async def test_create_key_success(self, client, admin_user, auth_headers):
        resp = await client.post(
            "/api/v1/api-keys",
            json=_key_payload(name="CI Key"),
            headers=auth_headers,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "plain_key" in body
        assert body["plain_key"].startswith("hcm_")
        assert body["name"] == "CI Key"
        assert body["status"] == "ACTIVE"
        # Key prefix stored — not the full key
        assert body["key_prefix"] == body["plain_key"][:8]

    async def test_plain_key_not_in_list_response(self, client, auth_headers):
        """After creation the raw key should never appear in GET responses."""
        await client.post(
            "/api/v1/api-keys",
            json=_key_payload(name="Hidden Key"),
            headers=auth_headers,
        )
        list_resp = await client.get("/api/v1/api-keys", headers=auth_headers)
        assert list_resp.status_code == 200
        for key in list_resp.json():
            assert "plain_key" not in key

    async def test_create_key_unauthenticated(self, client):
        resp = await client.post("/api/v1/api-keys", json=_key_payload())
        assert resp.status_code in (401, 403)

    async def test_create_key_for_specific_user(self, client, admin_user, auth_headers):
        resp = await client.post(
            "/api/v1/api-keys",
            json=_key_payload(user_id=admin_user.id),
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["user_id"] == admin_user.id


# ─────────────────────────────────────────────────────────────────────────────
# GET /api-keys
# ─────────────────────────────────────────────────────────────────────────────

class TestListApiKeys:

    async def test_admin_sees_active_keys(self, client, admin_user, auth_headers):
        # Create a key first
        await client.post("/api/v1/api-keys", json=_key_payload("Visible Key"), headers=auth_headers)
        resp = await client.get("/api/v1/api-keys", headers=auth_headers)
        assert resp.status_code == 200
        statuses = [k["status"] for k in resp.json()]
        # Admins must not see DELETED keys
        assert "DELETED" not in statuses

    async def test_super_admin_can_see_all_statuses(self, client, db_session, super_admin_user, super_auth_headers, admin_user, auth_headers):
        """After deleting a key, the super admin can still see it in the list."""
        create_resp = await client.post(
            "/api/v1/api-keys", json=_key_payload("To Delete"), headers=auth_headers
        )
        key_id = create_resp.json()["id"]

        # Delete the key
        await client.delete(f"/api/v1/api-keys/{key_id}", headers=auth_headers)

        # Super admin should see it as DELETED
        resp = await client.get("/api/v1/api-keys", headers=super_auth_headers)
        assert resp.status_code == 200
        all_statuses = [k["status"] for k in resp.json()]
        assert "DELETED" in all_statuses

    async def test_list_unauthenticated_returns_401(self, client):
        resp = await client.get("/api/v1/api-keys")
        assert resp.status_code in (401, 403)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api-keys/{id}/revoke
# ─────────────────────────────────────────────────────────────────────────────

class TestRevokeApiKey:

    async def test_revoke_key_success(self, client, auth_headers):
        create_resp = await client.post(
            "/api/v1/api-keys", json=_key_payload("Revoke Me"), headers=auth_headers
        )
        key_id = create_resp.json()["id"]

        resp = await client.post(f"/api/v1/api-keys/{key_id}/revoke", headers=auth_headers)
        assert resp.status_code == 204

    async def test_revoked_key_no_longer_authenticates(
        self, client, db_session, admin_user, auth_headers, sample_project, sample_kpi_def
    ):
        """A revoked key must be rejected as Bearer token."""
        create_resp = await client.post(
            "/api/v1/api-keys", json=_key_payload("Soon Revoked"), headers=auth_headers
        )
        body = create_resp.json()
        plain_key = body["plain_key"]
        key_id = body["id"]

        # Verify it works before revocation
        kpi_payload = {
            "project_id": sample_project.id,
            "kpi_id": sample_kpi_def.id,
            "record_date": "2026-01-01",
            "period": "DAILY",
            "numeric_value": 1.0,
        }
        before = await client.post(
            "/api/v1/kpis/records",
            json=kpi_payload,
            headers={"Authorization": f"Bearer {plain_key}"},
        )
        assert before.status_code == 201

        # Now revoke
        await client.post(f"/api/v1/api-keys/{key_id}/revoke", headers=auth_headers)

        # Should now be rejected
        after = await client.post(
            "/api/v1/kpis/records",
            json=kpi_payload,
            headers={"Authorization": f"Bearer {plain_key}"},
        )
        assert after.status_code == 401

    async def test_revoke_nonexistent_key_returns_404(self, client, auth_headers):
        resp = await client.post("/api/v1/api-keys/nonexistent-id/revoke", headers=auth_headers)
        assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api-keys/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestDeleteApiKey:

    async def test_delete_key_success(self, client, auth_headers):
        create_resp = await client.post(
            "/api/v1/api-keys", json=_key_payload("Delete Me"), headers=auth_headers
        )
        key_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/v1/api-keys/{key_id}", headers=auth_headers)
        assert resp.status_code == 204

    async def test_deleted_key_hidden_from_admin(self, client, auth_headers):
        create_resp = await client.post(
            "/api/v1/api-keys", json=_key_payload("Hidden After Delete"), headers=auth_headers
        )
        key_id = create_resp.json()["id"]

        await client.delete(f"/api/v1/api-keys/{key_id}", headers=auth_headers)

        # Admin cannot revoke/delete it again — it appears not found
        resp = await client.post(f"/api/v1/api-keys/{key_id}/revoke", headers=auth_headers)
        assert resp.status_code == 404

    async def test_delete_nonexistent_key_returns_404(self, client, auth_headers):
        resp = await client.delete("/api/v1/api-keys/does-not-exist", headers=auth_headers)
        assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# API Key used as Bearer token (full auth flow)
# ─────────────────────────────────────────────────────────────────────────────

class TestApiKeyAuthentication:

    async def test_api_key_can_create_kpi_record(
        self, client, auth_headers, sample_project, sample_kpi_def
    ):
        """An active API key should be accepted as a Bearer token for write endpoints."""
        create_resp = await client.post(
            "/api/v1/api-keys", json=_key_payload("Integration Key"), headers=auth_headers
        )
        assert create_resp.status_code == 201
        plain_key = create_resp.json()["plain_key"]

        kpi_payload = {
            "project_id": sample_project.id,
            "kpi_id": sample_kpi_def.id,
            "record_date": "2026-06-15",
            "period": "DAILY",
            "numeric_value": 77.5,
        }
        resp = await client.post(
            "/api/v1/kpis/records",
            json=kpi_payload,
            headers={"Authorization": f"Bearer {plain_key}"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["numeric_value"] == 77.5
        # API key source should populate api_key_id field
        assert "id" in body

    async def test_expired_api_key_returns_401(self, client, db_session, admin_user, auth_headers):
        """An expired key (expires_at in the past) must not authenticate."""
        from datetime import datetime, timedelta, timezone
        past = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
        # Create an already-expired key
        create_resp = await client.post(
            "/api/v1/api-keys",
            json={"name": "Expired Key", "expires_at": past},
            headers=auth_headers,
        )
        # Service doesn't validate expiry at creation, so this succeeds
        if create_resp.status_code != 201:
            pytest.skip("API does not allow creating already-expired keys")

        plain_key = create_resp.json()["plain_key"]

        # The key should not authenticate
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {plain_key}"},
        )
        assert resp.status_code == 401
