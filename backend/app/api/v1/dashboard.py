"""Knowledge Dashboard endpoint.

Canonical endpoint per contract §9.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard import DashboardResponse
from app.services import dashboard_service

router = APIRouter(tags=["dashboard"])


@router.get(
    "/workspaces/{workspace_id}/dashboard",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
)
def get_workspace_dashboard(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> DashboardResponse:
    """Return factual workspace dashboard statistics."""
    return dashboard_service.get_workspace_dashboard(db, workspace_id)
