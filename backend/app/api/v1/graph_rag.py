"""GraphRAG endpoint.

Canonical endpoint per CONTRACT v0.3.2 §9.7.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.graph_rag import GraphRAGRequest, GraphRAGResponse
from app.services import graph_rag_service

router = APIRouter(tags=["graph-rag"])


@router.post(
    "/workspaces/{workspace_id}/graph-rag",
    response_model=GraphRAGResponse,
    status_code=status.HTTP_200_OK,
)
def run_graph_rag(
    workspace_id: uuid.UUID,
    request: GraphRAGRequest,
    db: Annotated[Session, Depends(get_db)],
) -> GraphRAGResponse:
    """Execute GraphRAG grounded query with graph context expansion per CONTRACT §9.7, §10."""
    return graph_rag_service.run_graph_rag(
        db=db,
        workspace_id=workspace_id,
        request=request,
    )
