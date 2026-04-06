from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from blog_app.config import settings
from blog_app.infrastructure.persistence.database import Base, engine
from blog_app.infrastructure.persistence import models as _models  # noqa: F401
from blog_app.infrastructure.persistence.sqlite_migrate import ensure_sqlite_columns
from blog_app.presentation.api.v1.router import api_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.database_url.startswith("sqlite"):
        ensure_sqlite_columns(engine)
    yield


upload_root = Path(settings.upload_dir).resolve()
upload_root.mkdir(parents=True, exist_ok=True)

app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=str(upload_root)), name="static")
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
