"""
tests/integration/test_auth.py
Integration tests for /api/v1/auth — login, signup, refresh, me.
"""

import pytest


# ─────────────────────────────────────────────────────────────────────────────
# POST /auth/login
# ─────────────────────────────────────────────────────────────────────────────

class TestLogin:

    async def test_login_success(self, client, admin_user):
        """Valid credentials return tokens and user info."""
        resp = await client.post("/api/v1/auth/login", json={
            "email": admin_user.email,
            "password": "TestPass123",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == admin_user.email
        assert body["user"]["role"] == "ADMIN"

    async def test_login_wrong_password(self, client, admin_user):
        resp = await client.post("/api/v1/auth/login", json={
            "email": admin_user.email,
            "password": "WrongPassword!",
        })
        assert resp.status_code == 401
        assert "Invalid" in resp.json()["detail"]

    async def test_login_unknown_email(self, client):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "ghost@nowhere.com",
            "password": "DoesNotMatter1",
        })
        assert resp.status_code == 401

    async def test_login_invalid_email_format(self, client):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "not-an-email",
            "password": "SomePass123",
        })
        assert resp.status_code == 422  # Pydantic validation error


# ─────────────────────────────────────────────────────────────────────────────
# POST /auth/refresh
# ─────────────────────────────────────────────────────────────────────────────

class TestRefresh:

    async def test_refresh_returns_new_access_token(self, client, admin_user):
        # Step 1: login to get a real refresh token
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": admin_user.email,
            "password": "TestPass123",
        })
        assert login_resp.status_code == 200
        refresh_token = login_resp.json()["refresh_token"]

        # Step 2: exchange it
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    async def test_refresh_with_invalid_token(self, client):
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": "this.is.not.a.valid.token",
        })
        assert resp.status_code == 401

    async def test_refresh_with_access_token_fails(self, client, admin_user, admin_token):
        """Passing an access token as refresh token must be rejected."""
        resp = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": admin_token,
        })
        assert resp.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# GET /auth/me
# ─────────────────────────────────────────────────────────────────────────────

class TestMe:

    async def test_me_returns_current_user(self, client, admin_user, auth_headers):
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["email"] == admin_user.email
        assert body["role"] == "ADMIN"
        assert "id" in body

    async def test_me_unauthenticated(self, client):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)

    async def test_me_with_invalid_token(self, client):
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert resp.status_code == 401
