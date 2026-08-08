"""
tests/unit/test_security.py
Unit tests for app.core.security — pure logic, no I/O.
"""

import time
import pytest
import jwt

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_api_key,
    hash_api_key,
)
from app.core.config import settings


# ─────────────────────────────────────────────────────────────────────────────
# Password hashing
# ─────────────────────────────────────────────────────────────────────────────

class TestPasswordHashing:

    def test_hash_password_returns_string(self):
        result = hash_password("mysecretpassword")
        assert isinstance(result, str)

    def test_hash_contains_salt_separator(self):
        """Hash must be `salt$hash` — two segments separated by `$`."""
        result = hash_password("mysecretpassword")
        parts = result.split("$")
        assert len(parts) == 2, "Hash should be in 'salt$hash' format"

    def test_two_hashes_of_same_password_differ(self):
        """Random salt means identical passwords produce different stored hashes."""
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2

    def test_verify_password_correct(self):
        stored = hash_password("correct_password")
        assert verify_password("correct_password", stored) is True

    def test_verify_password_wrong(self):
        stored = hash_password("correct_password")
        assert verify_password("wrong_password", stored) is False

    def test_verify_password_empty_wrong(self):
        stored = hash_password("notempty")
        assert verify_password("", stored) is False


# ─────────────────────────────────────────────────────────────────────────────
# JWT tokens
# ─────────────────────────────────────────────────────────────────────────────

class TestJWTTokens:

    def test_create_access_token_is_str(self):
        token = create_access_token("user-123", "ADMIN")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_access_token_decode_round_trip(self):
        user_id = "user-abc"
        role = "SUPER_ADMIN"
        token = create_access_token(user_id, role)
        payload = decode_token(token)
        assert payload["sub"] == user_id
        assert payload["role"] == role
        assert payload["type"] == "access"

    def test_refresh_token_has_correct_type(self):
        token = create_refresh_token("user-xyz")
        payload = decode_token(token)
        assert payload["type"] == "refresh"
        assert payload["sub"] == "user-xyz"
        # refresh tokens must NOT carry a role claim
        assert "role" not in payload

    def test_access_and_refresh_tokens_differ(self):
        uid = "user-1"
        access = create_access_token(uid, "ADMIN")
        refresh = create_refresh_token(uid)
        assert access != refresh

    def test_expired_token_raises(self):
        """
        Forge an already-expired token and assert decode_token raises.
        """
        from datetime import datetime, timedelta, timezone
        expired_payload = {
            "sub": "user-999",
            "role": "ADMIN",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
            "type": "access",
        }
        expired_token = jwt.encode(
            expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM
        )
        with pytest.raises(jwt.ExpiredSignatureError):
            decode_token(expired_token)

    def test_tampered_token_raises(self):
        token = create_access_token("user-1", "ADMIN")
        tampered = token[:-4] + "xxxx"
        with pytest.raises(Exception):
            decode_token(tampered)

    def test_different_users_get_different_tokens(self):
        t1 = create_access_token("user-1", "ADMIN")
        t2 = create_access_token("user-2", "ADMIN")
        assert t1 != t2


# ─────────────────────────────────────────────────────────────────────────────
# API Key generation
# ─────────────────────────────────────────────────────────────────────────────

class TestAPIKeyGeneration:

    def test_generate_api_key_returns_tuple(self):
        result = generate_api_key()
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_plain_key_starts_with_prefix(self):
        plain, _ = generate_api_key()
        assert plain.startswith("hcm_")

    def test_plain_key_minimum_length(self):
        plain, _ = generate_api_key()
        # "hcm_" (4) + 48 hex chars from token_hex(24)
        assert len(plain) == 52

    def test_hash_is_sha256_hex(self):
        _, key_hash = generate_api_key()
        assert len(key_hash) == 64  # SHA-256 → 64 hex chars
        assert all(c in "0123456789abcdef" for c in key_hash)

    def test_two_keys_are_unique(self):
        plain1, hash1 = generate_api_key()
        plain2, hash2 = generate_api_key()
        assert plain1 != plain2
        assert hash1 != hash2

    def test_hash_api_key_deterministic(self):
        plain, _ = generate_api_key()
        h1 = hash_api_key(plain)
        h2 = hash_api_key(plain)
        assert h1 == h2

    def test_hash_api_key_matches_generate(self):
        plain, expected_hash = generate_api_key()
        assert hash_api_key(plain) == expected_hash
