from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    id: int | None
    email: str
    hashed_password: str
    display_name: str = ""
    profile_image_path: str | None = None
    created_at: datetime | None = None
