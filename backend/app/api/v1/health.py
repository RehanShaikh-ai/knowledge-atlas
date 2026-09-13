"""Health check endpoint.

Canonical module per contract §4.3, §10, §11.
"""

from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, name="get_health")
def get_health() -> HealthResponse:
    """Return the health status of the backend.

    Contract §10: Returns {"status": "ok"} with HTTP 200.
    """
    return HealthResponse(status="ok")
