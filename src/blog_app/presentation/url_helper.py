from fastapi import Request


def _public_base_url(request: Request) -> str:
    """브라우저가 쓰는 공개 호스트(리버스 프록시 뒤에서도 맞게)."""
    raw_host = request.headers.get("x-forwarded-host")
    if raw_host:
        host = raw_host.split(",")[0].strip()
        raw_proto = request.headers.get("x-forwarded-proto")
        if raw_proto:
            scheme = raw_proto.split(",")[0].strip().lower()
        else:
            scheme = request.url.scheme
        return f"{scheme}://{host}".rstrip("/")
    return str(request.base_url).rstrip("/")


def static_file_url(request: Request, relative_path: str | None) -> str | None:
    if not relative_path:
        return None
    base = _public_base_url(request)
    return f"{base}/static/{relative_path}"
