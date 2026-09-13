"""Health response schema.

Canonical schema per contract §10, §11.
"""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response model for the health endpoint.

    Contract §10: Response field is 'status', type is string, success value is "ok".
    """

    status: str
