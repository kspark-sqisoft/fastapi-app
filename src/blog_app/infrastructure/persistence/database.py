from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from blog_app.config import settings

_engine_kw: dict = {}
if settings.database_url.startswith("sqlite"):
    _engine_kw["connect_args"] = {"check_same_thread": False}
if settings.database_url.startswith("postgresql"):
    _engine_kw["pool_pre_ping"] = True

engine = create_engine(settings.database_url, **_engine_kw)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
