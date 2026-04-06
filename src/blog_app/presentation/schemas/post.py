from datetime import datetime

from pydantic import BaseModel, Field


class PostUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    content: str | None = Field(default=None, min_length=1)


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    image_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
