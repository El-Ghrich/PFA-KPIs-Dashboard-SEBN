import secrets
import hashlib
from datetime import datetime, timedelta, timezone
import jwt
from app.core.config import settings

ALGORITHM = settings.ALGORITHM


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "role": role, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return f"{salt}${pwd_hash}"


def verify_password(password: str, stored: str) -> bool:
    salt, pwd_hash = stored.split("$")
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return pwd_hash == check


def generate_api_key() -> tuple[str, str]:
    plain = "hcm_" + secrets.token_hex(24)
    key_hash = hashlib.sha256(plain.encode()).hexdigest()
    return plain, key_hash


def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()
