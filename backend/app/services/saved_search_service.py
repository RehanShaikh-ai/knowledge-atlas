"""Saved search service.

Canonical service per CONTRACT v0.3.1 §5.3, §13.3.
Provides create_saved_search, list_saved_searches, delete_saved_search.
"""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError, WorkspaceNotFoundError
from app.models.saved_search import SavedSearch
from app.models.workspace import Workspace

logger = logging.getLogger("app.services.saved_search_service")


def create_saved_search(
    db: Session,
    workspace_id: uuid.UUID,
    name: str,
    query: str,
    search_mode: str,
) -> SavedSearch:
    """Create a saved search query for a workspace."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError("Workspace not found.")

    clean_name = name.strip()
    clean_query = query.strip()
    if not clean_name:
        raise ValidationError("Saved search name cannot be empty.")
    if not clean_query:
        raise ValidationError("Saved search query cannot be empty.")
    if search_mode not in ("semantic", "lexical", "hybrid"):
        raise ValidationError("Invalid search mode.")

    saved_search = SavedSearch(
        workspace_id=workspace_id,
        name=clean_name,
        query=clean_query,
        search_mode=search_mode,
        created_at=datetime.now(UTC),
    )
    db.add(saved_search)
    db.commit()
    db.refresh(saved_search)
    return saved_search


def list_saved_searches(
    db: Session,
    workspace_id: uuid.UUID,
) -> tuple[list[SavedSearch], int]:
    """List all saved searches for a workspace."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError("Workspace not found.")

    stmt = (
        select(SavedSearch)
        .where(SavedSearch.workspace_id == workspace_id)
        .order_by(SavedSearch.created_at.desc())
    )
    items = list(db.scalars(stmt).all())
    return items, len(items)


def delete_saved_search(
    db: Session,
    saved_search_id: uuid.UUID,
) -> None:
    """Delete a saved search by ID."""
    ss = db.get(SavedSearch, saved_search_id)
    if ss:
        db.delete(ss)
        db.commit()
