from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from blog_app.config import settings

JWT_TYP_ACCESS = "access"
JWT_TYP_REFRESH = "refresh"


class JwtTokenService:
    def create_access_token(
        self, subject: str, extra_claims: dict[str, Any] | None = None
    ) -> str:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
        payload: dict[str, Any] = {"sub": subject, "exp": expire}
        if extra_claims:
            payload.update(extra_claims)
        payload["typ"] = JWT_TYP_ACCESS
        return jwt.encode(
            payload, settings.secret_key, algorithm=settings.jwt_algorithm
        )

    def create_refresh_token(self, subject: str) -> str:
        expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
        payload: dict[str, Any] = {
            "sub": subject,
            "exp": expire,
            "typ": JWT_TYP_REFRESH,
        }
        return jwt.encode(
            payload, settings.secret_key, algorithm=settings.jwt_algorithm
        )

    def decode_token(self, token: str) -> dict[str, Any]:
        return jwt.decode(
            token, settings.secret_key, algorithms=[settings.jwt_algorithm]
        )

    def subject_from_refresh_token(self, token: str) -> int | None:
        payload = decode_token_safe(token.strip())
        if payload is None or payload.get("typ") != JWT_TYP_REFRESH:
            return None
        sub = payload.get("sub")
        try:
            return int(sub)
        except (TypeError, ValueError):
            return None


def decode_token_safe(token: str) -> dict[str, Any] | None:
    try:
        return JwtTokenService().decode_token(token)
    except JWTError:
        return None
