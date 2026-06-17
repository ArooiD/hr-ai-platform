import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict


def _b64url_encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).rstrip(b"=").decode("ascii")


def _get_signing_key() -> bytes:
    return os.getenv("JWT_SECRET", "hr-ai-platform-local-development-key").encode("utf-8")


# Генерация JWT токена доступа
    def create_access_token(subject: str, claims: Dict[str, Any] | None = None, ttl_seconds: int = 3600) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    body = {
        "sub": subject,
        "iat": now,
        "exp": now + ttl_seconds,
        "iss": os.getenv("JWT_ISSUER", "hr-ai-platform"),
        **(claims or {}),
    }
    signing_input = ".".join([
        _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8")),
        _b64url_encode(json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf-8")),
    ])
    signature = hmac.new(_get_signing_key(), signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url_encode(signature)}"


# Проверка пароля по хешу (SHA-256 + HMAC)
    def verify_password(candidate: str | None, expected_hash: str | None) -> bool:
    if not expected_hash:
        return True
    digest = hashlib.sha256((candidate or "").encode("utf-8")).hexdigest()
    return hmac.compare_digest(digest, expected_hash)
