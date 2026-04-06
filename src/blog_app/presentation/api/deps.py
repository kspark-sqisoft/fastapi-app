from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from blog_app.infrastructure.files.local_file_storage import LocalFileStorage
from blog_app.infrastructure.persistence.database import SessionLocal
from blog_app.infrastructure.security.bcrypt_password_hasher import BcryptPasswordHasher
from blog_app.infrastructure.security.jwt_token_service import (
    JwtTokenService,
    decode_token_safe,
)

security = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_password_hasher() -> BcryptPasswordHasher:
    return BcryptPasswordHasher()


def get_token_service() -> JwtTokenService:
    return JwtTokenService()


def get_file_storage() -> LocalFileStorage:
    return LocalFileStorage()


def get_current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> int:
    if creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth scheme"
        )
    payload = decode_token_safe(creds.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )
    try:
        return int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject"
        )
