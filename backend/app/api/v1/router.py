"""API v1 router aggregation.

Canonical module per contract §4.3, §10, §14.
Aggregates all v1 sub-routers. main.py mounts only api_router under /api/v1.
"""

from fastapi import APIRouter

from app.api.v1 import dashboard, graph, health, notes, search, sources, tags, users, workspaces

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(workspaces.router)
api_router.include_router(notes.router)
api_router.include_router(tags.router)
api_router.include_router(search.router)
api_router.include_router(sources.router)
api_router.include_router(graph.router)
api_router.include_router(dashboard.router)
