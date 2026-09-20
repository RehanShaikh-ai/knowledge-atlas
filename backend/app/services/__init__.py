"""Services package.

Canonical module per contract §15.
"""

from app.services import (
    dashboard_service,
    graph_service,
    note_service,
    obsidian_parser,
    search_service,
    source_service,
    tag_service,
    user_service,
    workspace_service,
)

__all__ = [
    "dashboard_service",
    "graph_service",
    "note_service",
    "obsidian_parser",
    "search_service",
    "source_service",
    "tag_service",
    "user_service",
    "workspace_service",
]
