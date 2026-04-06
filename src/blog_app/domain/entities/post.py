from dataclasses import dataclass
from datetime import datetime


@dataclass
class Post:
    id: int | None
    title: str
    content: str
    author_id: int
    image_path: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
