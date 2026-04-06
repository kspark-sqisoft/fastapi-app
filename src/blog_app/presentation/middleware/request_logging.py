import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

log = logging.getLogger("blog_app.http")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """요청 메서드·경로·상태코드·소요 시간(ms)을 기록합니다."""

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if path.startswith("/static/"):
            return await call_next(request)

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - start) * 1000
            log.exception(
                "%s %s -> unhandled exception (%.1fms)",
                request.method,
                path,
                elapsed_ms,
            )
            raise
        elapsed_ms = (time.perf_counter() - start) * 1000
        log.info(
            "%s %s -> %s (%.1fms)",
            request.method,
            path,
            response.status_code,
            elapsed_ms,
        )
        return response
