"""Saved searches API routes.

Canonical endpoints per CONTRACT v0.3.1 §13.1, §13.3.
GET    /api/v1/workspaces/{workspace_id}/saved-searches
POST   /api/v1/workspaces/{workspace_id}/saved-searches
DELETE /api/v1/workspaces/{workspace_id}/saved-searches/{saved_search_id}
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.saved_search import (
    SavedSearchCreate,
    SavedSearchListResponse,
    SavedSearchResponse,
)
from app.services import saved_search_service

router = APIRouter()


@router.get(
    "/workspaces/{workspace_id}/saved-searches",
    response_model=SavedSearchListResponse,
)
def list_saved_searches(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> SavedSearchListResponse:
    """List saved searches for workspace per CONTRACT §13.3."""
    items, total = saved_search_service.list_saved_searches(db, workspace_id)
    return SavedSearchListResponse(
        items=[SavedSearchResponse.model_validate(s) for s in items],
        total=total,
    )


@router.post(
    "/workspaces/{workspace_id}/saved-searches",
    response_model=SavedSearchResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_saved_search(
    workspace_id: uuid.UUID,
    request: SavedSearchCreate,
    db: Annotated[Session, Depends(get_db)],
) -> SavedSearchResponse:
    """Create saved search for workspace per CONTRACT §13.3."""
    s = saved_search_service.create_saved_search(
        db,
        workspace_id=workspace_id,
        name=request.name,
        query=request.query,
        search_mode=request.search_mode,
    )
    return SavedSearchResponse.model_validate(s)


@router.delete(
    "/workspaces/{workspace_id}/saved-searches/{saved_search_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_saved_search(
    workspace_id: uuid.UUID,
    saved_search_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete saved search per CONTRACT §13.3."""
    saved_search_service.delete_saved_search(db, saved_search_id)
