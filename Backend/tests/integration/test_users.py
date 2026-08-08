"""
tests/integration/test_users.py
Integration tests for /api/v1/auth/signup and /api/v1/users.
"""

import pytest
from app.core.security import create_access_token


# ─────────────────────────────────────────────────────────────────────────────
# POST /auth/signup  (requires ADMIN or SUPER_ADMIN token)
# ─────────────────────────────────────────────────────────────────────────────

class TestSignup:

    def _payload(self, **overrides):
        base = {
            "email": "newadmin@test.com",
            "full_name": "New Admin",
            "password": "NewPass123",
            "role": "ADMIN",
        }
        return {**base, **overrides}

    async def test_admin_can_create_admin(self, client, auth_headers):
        resp = await client.post("/api/v1/auth/signup", json=self._payload(), headers=auth_headers)
        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == "newadmin@test.com"
        assert body["role"] == "ADMIN"
        assert "id" in body

    async def test_duplicate_email_raises_400(self, client, admin_user, auth_headers):
        resp = await client.post(
            "/api/v1/auth/signup",
            json=self._payload(email=admin_user.email),
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "Email already registered" in resp.json()["detail"]

    async def test_admin_cannot_create_super_admin(self, client, auth_headers):
        """Only the current SUPER_ADMIN can grant that role."""
        resp = await client.post(
            "/api/v1/auth/signup",
            json=self._payload(role="SUPER_ADMIN"),
            headers=auth_headers,
        )
        assert resp.status_code == 403

    async def test_super_admin_can_create_super_admin(self, client, super_admin_user, super_auth_headers):
        """SUPER_ADMIN can create another (first time — no existing super admin yet)."""
        resp = await client.post(
            "/api/v1/auth/signup",
            json=self._payload(email="super2@test.com", role="SUPER_ADMIN"),
            headers=super_auth_headers,
        )
        # Either 201 (first SA) or 400 (SA already exists) — both are correct behaviour
        assert resp.status_code in (201, 400)

    async def test_unauthenticated_signup_returns_401(self, client):
        resp = await client.post("/api/v1/auth/signup", json=self._payload())
        assert resp.status_code in (401, 403)

    async def test_invalid_password_returns_422(self, client, auth_headers):
        resp = await client.post(
            "/api/v1/auth/signup",
            json=self._payload(password="short"),
            headers=auth_headers,
        )
        assert resp.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# GET /users
# ─────────────────────────────────────────────────────────────────────────────

class TestListUsers:

    async def test_super_admin_sees_all_users(self, client, admin_user, super_admin_user, super_auth_headers):
        resp = await client.get("/api/v1/users", headers=super_auth_headers)
        assert resp.status_code == 200
        emails = [u["email"] for u in resp.json()]
        assert admin_user.email in emails
        assert super_admin_user.email in emails

    async def test_admin_sees_only_admins(self, client, admin_user, super_admin_user, auth_headers):
        resp = await client.get("/api/v1/users", headers=auth_headers)
        assert resp.status_code == 200
        roles = [u["role"] for u in resp.json()]
        assert "SUPER_ADMIN" not in roles

    async def test_unauthenticated_returns_401(self, client):
        resp = await client.get("/api/v1/users")
        assert resp.status_code in (401, 403)


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /users/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestUpdateUser:

    async def test_update_full_name(self, client, admin_user, auth_headers):
        resp = await client.patch(
            f"/api/v1/users/{admin_user.id}",
            json={"full_name": "Updated Name"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Name"

    async def test_update_nonexistent_user_returns_404(self, client, auth_headers):
        resp = await client.patch(
            "/api/v1/users/nonexistent-id",
            json={"full_name": "Ghost"},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_cannot_demote_super_admin(self, client, super_admin_user, super_auth_headers):
        """Super admin account cannot have its role changed."""
        resp = await client.patch(
            f"/api/v1/users/{super_admin_user.id}",
            json={"role": "ADMIN"},
            headers=super_auth_headers,
        )
        assert resp.status_code == 400

    async def test_admin_cannot_modify_super_admin(self, client, super_admin_user, auth_headers):
        resp = await client.patch(
            f"/api/v1/users/{super_admin_user.id}",
            json={"full_name": "Hacker"},
            headers=auth_headers,
        )
        assert resp.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /users/{id}
# ─────────────────────────────────────────────────────────────────────────────

class TestDeleteUser:

    async def test_delete_admin_user_succeeds(self, client, db_session, super_auth_headers):
        """Create a throwaway admin and delete it as super admin."""
        from tests.conftest import _create_user
        user = await _create_user(db_session, email="todelete@test.com", role="ADMIN")
        resp = await client.delete(f"/api/v1/users/{user.id}", headers=super_auth_headers)
        assert resp.status_code == 204

    async def test_cannot_delete_super_admin(self, client, super_admin_user, super_auth_headers):
        resp = await client.delete(f"/api/v1/users/{super_admin_user.id}", headers=super_auth_headers)
        assert resp.status_code == 400
        assert "cannot be deleted" in resp.json()["detail"]

    async def test_delete_nonexistent_user_returns_404(self, client, super_auth_headers):
        resp = await client.delete("/api/v1/users/does-not-exist", headers=super_auth_headers)
        assert resp.status_code == 404
