from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from blog_app.config import settings


class JwtTokenService:
    def create_access_token(self, subject: str, extra_claims: dict[str, Any] | None = None) -> str:
        expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
        payload: dict[str, Any] = {"sub": subject, "exp": expire}
        if extra_claims:
            payload.update(extra_claims)
        return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)

    def decode_token(self, token: str) -> dict[str, Any]:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])


def decode_token_safe(token: str) -> dict[str, Any] | None:
    try:
        return JwtTokenService().decode_token(token)
    except JWTError:
        return None
