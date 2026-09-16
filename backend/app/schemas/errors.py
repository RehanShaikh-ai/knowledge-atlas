"""Error response schemas.

Canonical schemas per contract §12, Interface I-003.
"""

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Detail object nested inside ErrorResponse.

    Contract §12:
        code: ERROR_CODE string
        message: Human-readable error message
    """

    code: str
    message: str


class ErrorResponse(BaseModel):
    """Top-level error response wrapper.

    Contract §12: All error paths must return this shape.
    """

    error: ErrorDetail
