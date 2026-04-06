import uuid
from pathlib import Path

from blog_app.config import settings

_CT_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def _detect_kind(data: bytes) -> str | None:
    if len(data) >= 3 and data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(data) >= 8 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 6 and data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


class LocalFileStorage:
    def __init__(self, root: Path | None = None) -> None:
        self._root = (root or settings.upload_dir).resolve()
        self._root.mkdir(parents=True, exist_ok=True)

    def _resolve(self, relative: str) -> Path:
        path = (self._root / relative).resolve()
        try:
            path.relative_to(self._root)
        except ValueError:
            raise ValueError("invalid path") from None
        return path

    def save_avatar(self, user_id: int, data: bytes, content_type: str) -> str:
        kind = _detect_kind(data)
        if kind is None or kind != content_type.split(";")[0].strip().lower():
            raise ValueError("file content does not match declared image type")
        ext = _CT_EXT.get(kind)
        if ext is None:
            raise ValueError("unsupported image type")
        subdir = self._root / "avatars" / str(user_id)
        subdir.mkdir(parents=True, exist_ok=True)
        name = f"{uuid.uuid4().hex}{ext}"
        rel = f"avatars/{user_id}/{name}"
        path = self._root / rel
        path.write_bytes(data)
        return rel.replace("\\", "/")

    def save_post_image(self, data: bytes, content_type: str) -> str:
        kind = _detect_kind(data)
        if kind is None or kind != content_type.split(";")[0].strip().lower():
            raise ValueError("file content does not match declared image type")
        ext = _CT_EXT.get(kind)
        if ext is None:
            raise ValueError("unsupported image type")
        subdir = self._root / "posts"
        subdir.mkdir(parents=True, exist_ok=True)
        name = f"{uuid.uuid4().hex}{ext}"
        rel = f"posts/{name}"
        path = self._root / rel
        path.write_bytes(data)
        return rel.replace("\\", "/")

    def delete_if_exists(self, relative_path: str | None) -> None:
        if not relative_path:
            return
        path = self._resolve(relative_path)
        if path.is_file():
            path.unlink()
