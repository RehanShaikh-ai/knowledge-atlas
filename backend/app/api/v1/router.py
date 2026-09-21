"""API v1 router aggregation.

Canonical module per contract §4.3, §10, §14.
Aggregates all v1 sub-routers. main.py mounts only api_router under /api/v1.
"""

from fastapi import APIRouter

from app.api.v1 import (
    activity,
    dashboard,
    graph,
    health,
    jobs,
    notes,
    rag,
    saved_searches,
    search,
    sources,
    tags,
    users,
    versions,
    workspaces,
)

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
api_router.include_router(rag.router)
api_router.include_router(jobs.router)
api_router.include_router(versions.router)
api_router.include_router(activity.router)
api_router.include_router(saved_searches.router)
