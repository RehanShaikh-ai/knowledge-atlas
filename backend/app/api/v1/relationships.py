"""Graph Relationship endpoints.

Canonical endpoints per CONTRACT v0.3.2 §9.3.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.graph_relationship import (
    GraphRelationshipCreate,
    GraphRelationshipResponse,
    GraphRelationshipUpdate,
)
from app.services import graph_service

router = APIRouter(tags=["relationships"])


@router.post(
    "/workspaces/{workspace_id}/relationships",
    response_model=GraphRelationshipResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_relationship(
    workspace_id: uuid.UUID,
    data: GraphRelationshipCreate,
    db: Annotated[Session, Depends(get_db)],
) -> GraphRelationshipResponse:
    """Manually create a relationship in a workspace per CONTRACT §9.3."""
    rel = graph_service.create_relationship(db, workspace_id, data)
    return GraphRelationshipResponse.model_validate(rel)


@router.get(
    "/relationships/{relationship_id}",
    response_model=GraphRelationshipResponse,
    status_code=status.HTTP_200_OK,
)
def get_relationship(
    relationship_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> GraphRelationshipResponse:
    """Retrieve a relationship by ID per CONTRACT §9.3."""
    rel = graph_service.get_relationship(db, relationship_id)
    return GraphRelationshipResponse.model_validate(rel)


@router.patch(
    "/relationships/{relationship_id}",
    response_model=GraphRelationshipResponse,
    status_code=status.HTTP_200_OK,
)
def update_relationship(
    relationship_id: uuid.UUID,
    data: GraphRelationshipUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> GraphRelationshipResponse:
    """Update a relationship per CONTRACT §9.3."""
    rel = graph_service.update_relationship(db, relationship_id, data)
    return GraphRelationshipResponse.model_validate(rel)


@router.delete(
    "/relationships/{relationship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_relationship(
    relationship_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    """Delete a relationship per CONTRACT §9.3."""
    graph_service.delete_relationship(db, relationship_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
