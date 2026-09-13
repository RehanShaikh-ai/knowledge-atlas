"""Global exception handlers for the FastAPI application.

Implements the error contract defined in §12 and §4.4.
All error responses use the canonical ErrorResponse/ErrorDetail schema.
No unhandled exception may reach the client as a raw stack trace.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse

logger = logging.getLogger("app.core.exception_handlers")


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    """Build a canonical ErrorResponse JSON response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
            }
        },
    )


def _http_status_to_code(status_code: int) -> str:
    """Derive an error code string from an HTTP status code."""
    status_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
    }
    return status_map.get(status_code, f"HTTP_{status_code}")


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app.

    Canonical function per contract §4.4. Covers:
    - RequestValidationError → 422, code="VALIDATION_ERROR"
    - HTTPException → matching status, code derived from status
    - Exception (catch-all) → 500, code="INTERNAL_SERVER_ERROR"
    """

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning("Validation error on %s %s", request.method, request.url.path)
        return _error_response(
            status_code=422,
            code="VALIDATION_ERROR",
            message="Request validation failed.",
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        logger.warning("HTTP %d on %s %s", exc.status_code, request.method, request.url.path)
        code = _http_status_to_code(exc.status_code)
        # Use the HTTPException detail as the message if it's a string,
        # but never expose internal exception messages for 500s.
        if exc.status_code >= 500:
            message = "An unexpected error occurred."
        else:
            message = str(exc.detail) if exc.detail else "An error occurred."
        return _error_response(
            status_code=exc.status_code,
            code=code,
            message=message,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return _error_response(
            status_code=500,
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred.",
        )
