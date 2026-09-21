"""Workspace activity timeline API route.

Canonical endpoint per CONTRACT v0.3.1 §13.1, §13.2.
GET /api/v1/workspaces/{workspace_id}/activity
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.activity import ActivityResponse
from app.services import activity_service

router = APIRouter()


@router.get("/workspaces/{workspace_id}/activity", response_model=ActivityResponse)
def get_activity(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> ActivityResponse:
    """Retrieve workspace activity timeline per CONTRACT §13.2."""
    items, total = activity_service.get_workspace_activity(db, workspace_id, limit=limit)
    return ActivityResponse(items=items, total=total)
