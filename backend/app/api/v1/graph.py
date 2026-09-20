"""Knowledge Graph endpoints.

Canonical endpoints per contract §8.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.graph import GraphResponse
from app.services import graph_service

router = APIRouter(tags=["graph"])


@router.get(
    "/workspaces/{workspace_id}/graph",
    response_model=GraphResponse,
    status_code=status.HTTP_200_OK,
)
def get_workspace_graph(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    tag: Annotated[str | None, Query(description="Only include notes with this tag")] = None,
    limit: Annotated[
        int, Query(ge=1, le=1000, description="Maximum nodes returned (max 1000)")
    ] = 500,
) -> GraphResponse:
    """Return the knowledge graph for a workspace."""
    return graph_service.get_workspace_graph(db, workspace_id, tag=tag, limit=limit)


@router.get(
    "/notes/{note_id}/graph",
    response_model=GraphResponse,
    status_code=status.HTTP_200_OK,
)
def get_note_neighborhood(
    note_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> GraphResponse:
    """Return the 1-hop neighborhood knowledge graph for a note."""
    return graph_service.get_note_neighborhood(db, note_id)
