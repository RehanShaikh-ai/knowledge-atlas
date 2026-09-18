"""Services package.

Canonical module per contract §15.
"""

from app.services import note_service, search_service, tag_service, user_service, workspace_service

__all__ = [
    "note_service",
    "search_service",
    "tag_service",
    "user_service",
    "workspace_service",
]
