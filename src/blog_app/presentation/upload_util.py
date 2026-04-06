from fastapi import HTTPException, UploadFile, status

from blog_app.config import settings

_ALLOWED_CT = frozenset({"image/jpeg", "image/png", "image/webp", "image/gif"})


def _normalize_content_type(raw: str | None) -> str:
    return (raw or "").split(";")[0].strip().lower()


async def read_image_upload(file: UploadFile) -> tuple[bytes, str]:
    ct = _normalize_content_type(file.content_type)
    if ct not in _ALLOWED_CT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type. Allowed: {', '.join(sorted(_ALLOWED_CT))}",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {settings.max_upload_bytes} bytes)",
        )
    return data, ct
