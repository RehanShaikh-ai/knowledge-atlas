"""API v1 router aggregation.

Canonical module per contract §4.3.
Aggregates all v1 sub-routers. main.py mounts only api_router under /api/v1.
"""

from fastapi import APIRouter

from app.api.v1 import health

api_router = APIRouter()
api_router.include_router(health.router)
