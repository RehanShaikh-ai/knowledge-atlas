"""Graph Entity endpoints.

Canonical endpoints per CONTRACT v0.3.2 §9.2.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.graph import (
    EntityProvenanceResponse,
    GraphResponse,
)
from app.schemas.graph_entity import (
    GraphEntityCreate,
    GraphEntityResponse,
    GraphEntityUpdate,
)
from app.services import graph_service

router = APIRouter(tags=["entities"])


@router.post(
    "/workspaces/{workspace_id}/entities",
    response_model=GraphEntityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_entity(
    workspace_id: uuid.UUID,
    data: GraphEntityCreate,
    db: Annotated[Session, Depends(get_db)],
) -> GraphEntityResponse:
    """Manually create an entity in a workspace per CONTRACT §9.2."""
    entity = graph_service.create_entity(db, workspace_id, data)
    return GraphEntityResponse.model_validate(entity)


@router.get(
    "/workspaces/{workspace_id}/entities",
    response_model=list[GraphEntityResponse],
    status_code=status.HTTP_200_OK,
)
def list_entities(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    entity_type: Annotated[str | None, Query()] = None,
    cluster_id: Annotated[uuid.UUID | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=1000)] = 500,
) -> list[GraphEntityResponse]:
    """List entities in a workspace."""
    entities = graph_service.list_entities(
        db, workspace_id, entity_type=entity_type, cluster_id=cluster_id, limit=limit
    )
    return [GraphEntityResponse.model_validate(e) for e in entities]


@router.get(
    "/entities/{entity_id}",
    response_model=GraphEntityResponse,
    status_code=status.HTTP_200_OK,
)
def get_entity(
    entity_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> GraphEntityResponse:
    """Retrieve an entity by ID per CONTRACT §9.2."""
    entity = graph_service.get_entity(db, entity_id)
    return GraphEntityResponse.model_validate(entity)


@router.patch(
    "/entities/{entity_id}",
    response_model=GraphEntityResponse,
    status_code=status.HTTP_200_OK,
)
def update_entity(
    entity_id: uuid.UUID,
    data: GraphEntityUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> GraphEntityResponse:
    """Update an entity per CONTRACT §9.2."""
    entity = graph_service.update_entity(db, entity_id, data)
    return GraphEntityResponse.model_validate(entity)


@router.delete(
    "/entities/{entity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_entity(
    entity_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    """Delete an entity per CONTRACT §9.2."""
    graph_service.delete_entity(db, entity_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/entities/{entity_id}/neighborhood",
    response_model=GraphResponse,
    status_code=status.HTTP_200_OK,
)
def get_entity_neighborhood(
    entity_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> GraphResponse:
    """Return the 1-hop graph neighborhood for an entity per CONTRACT §9.2."""
    return graph_service.get_entity_neighborhood(db, entity_id)


@router.get(
    "/entities/{entity_id}/provenance",
    response_model=EntityProvenanceResponse,
    status_code=status.HTTP_200_OK,
)
def get_entity_provenance(
    entity_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> EntityProvenanceResponse:
    """Return provenance sources for an entity per CONTRACT §9.2."""
    return graph_service.get_entity_provenance(db, entity_id)
