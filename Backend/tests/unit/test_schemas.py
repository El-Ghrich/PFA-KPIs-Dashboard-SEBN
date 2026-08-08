"""
tests/unit/test_schemas.py
Unit tests for Pydantic schema validation — no I/O required.
"""

import pytest
from pydantic import ValidationError

from app.domains.users.schemas import UserCreate, UserUpdate, UserRoleEnum
from app.domains.projects.schemas import ProjectCreate, ProjectUpdate


# ─────────────────────────────────────────────────────────────────────────────
# UserCreate
# ─────────────────────────────────────────────────────────────────────────────

class TestUserCreateSchema:

    def _valid_payload(self, **overrides):
        base = {
            "email": "user@example.com",
            "full_name": "Alice Bob",
            "password": "SecurePass1",
            "role": "ADMIN",
        }
        return {**base, **overrides}

    def test_valid_user_create(self):
        user = UserCreate(**self._valid_payload())
        assert user.email == "user@example.com"
        assert user.role == UserRoleEnum.ADMIN

    def test_password_too_short_raises(self):
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**self._valid_payload(password="short"))
        assert "password" in str(exc_info.value).lower() or "min_length" in str(exc_info.value).lower()

    def test_invalid_email_raises(self):
        with pytest.raises(ValidationError):
            UserCreate(**self._valid_payload(email="not-an-email"))

    def test_invalid_role_raises(self):
        with pytest.raises(ValidationError):
            UserCreate(**self._valid_payload(role="VIEWER"))

    def test_empty_full_name_raises(self):
        with pytest.raises(ValidationError):
            UserCreate(**self._valid_payload(full_name=""))

    def test_full_name_max_length_raises(self):
        with pytest.raises(ValidationError):
            UserCreate(**self._valid_payload(full_name="A" * 101))

    def test_super_admin_role_accepted(self):
        user = UserCreate(**self._valid_payload(role="SUPER_ADMIN"))
        assert user.role == UserRoleEnum.SUPER_ADMIN

    def test_default_role_is_admin(self):
        payload = self._valid_payload()
        payload.pop("role")
        user = UserCreate(**payload)
        assert user.role == UserRoleEnum.ADMIN


# ─────────────────────────────────────────────────────────────────────────────
# UserUpdate
# ─────────────────────────────────────────────────────────────────────────────

class TestUserUpdateSchema:

    def test_all_fields_optional(self):
        update = UserUpdate()
        assert update.email is None
        assert update.full_name is None
        assert update.role is None
        assert update.password is None

    def test_strips_whitespace_from_full_name(self):
        update = UserUpdate(full_name="  Alice  ")
        assert update.full_name == "Alice"

    def test_whitespace_only_full_name_raises(self):
        with pytest.raises(ValidationError):
            UserUpdate(full_name="   ")

    def test_password_too_short_raises(self):
        with pytest.raises(ValidationError):
            UserUpdate(password="abc")

    def test_invalid_email_raises(self):
        with pytest.raises(ValidationError):
            UserUpdate(email="bad@")

    def test_partial_update_works(self):
        update = UserUpdate(full_name="New Name")
        assert update.full_name == "New Name"
        assert update.email is None


# ─────────────────────────────────────────────────────────────────────────────
# ProjectCreate
# ─────────────────────────────────────────────────────────────────────────────

class TestProjectCreateSchema:

    def _valid_payload(self, **overrides):
        base = {
            "name": "Project Alpha",
            "status": "ACTIVE",
            "location": "Morocco",
            "initial_sets_count": 2,
        }
        return {**base, **overrides}

    def test_valid_project_create(self):
        project = ProjectCreate(**self._valid_payload())
        assert project.name == "Project Alpha"
        assert project.initial_sets_count == 2

    def test_initial_sets_count_min_1(self):
        with pytest.raises(ValidationError):
            ProjectCreate(**self._valid_payload(initial_sets_count=0))

    def test_initial_sets_count_max_20(self):
        with pytest.raises(ValidationError):
            ProjectCreate(**self._valid_payload(initial_sets_count=21))

    def test_default_initial_sets_count_is_1(self):
        payload = self._valid_payload()
        payload.pop("initial_sets_count")
        project = ProjectCreate(**payload)
        assert project.initial_sets_count == 1

    def test_empty_name_raises(self):
        with pytest.raises(ValidationError):
            ProjectCreate(**self._valid_payload(name=""))

    def test_name_too_long_raises(self):
        with pytest.raises(ValidationError):
            ProjectCreate(**self._valid_payload(name="X" * 101))

    def test_invalid_status_raises(self):
        with pytest.raises(ValidationError):
            ProjectCreate(**self._valid_payload(status="UNKNOWN"))

    def test_default_status_is_active(self):
        payload = self._valid_payload()
        payload.pop("status")
        project = ProjectCreate(**payload)
        assert project.status.value == "ACTIVE"


# ─────────────────────────────────────────────────────────────────────────────
# ProjectUpdate
# ─────────────────────────────────────────────────────────────────────────────

class TestProjectUpdateSchema:

    def test_all_fields_optional(self):
        update = ProjectUpdate()
        assert update.name is None
        assert update.status is None
        assert update.location is None

    def test_strips_whitespace_from_name(self):
        update = ProjectUpdate(name="  Alpha  ")
        assert update.name == "Alpha"

    def test_whitespace_only_name_raises(self):
        with pytest.raises(ValidationError):
            ProjectUpdate(name="   ")

    def test_invalid_status_raises(self):
        with pytest.raises(ValidationError):
            ProjectUpdate(status="INVALID")

    def test_name_too_long_raises(self):
        with pytest.raises(ValidationError):
            ProjectUpdate(name="Y" * 101)
