"""Note search API route."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError
from app.db.session import get_db
from app.schemas.note import NoteResponse, NoteSearchResponse
from app.schemas.search import SearchRequest, SearchResponse
from app.services import reranking_service, retrieval_service, search_service

router = APIRouter()


@router.get("/workspaces/{workspace_id}/notes/search", response_model=NoteSearchResponse)
def search_notes(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    q: Annotated[str, Query(min_length=1, max_length=200)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> NoteSearchResponse:
    query = q.strip()
    if not query:
        raise ValidationError("Search query must not be empty or whitespace only.")
    notes, total = search_service.search_notes(
        db,
        workspace_id,
        query=query,
        page=page,
        page_size=page_size,
    )
    return NoteSearchResponse(
        items=[NoteResponse.model_validate(note) for note in notes],
        total=total,
        page=page,
        page_size=page_size,
        query=query,
    )


@router.post("/workspaces/{workspace_id}/search", response_model=SearchResponse)
def execute_search(
    workspace_id: uuid.UUID,
    request: SearchRequest,
    db: Annotated[Session, Depends(get_db)],
) -> SearchResponse:
    """Execute semantic, lexical, or hybrid search per CONTRACT v0.3.1 §9.1-§9.3, §13.1."""
    query = request.query.strip()
    if not query:
        raise ValidationError("Search query must not be empty or whitespace only.")

    if request.mode == "semantic":
        results = retrieval_service.search_semantic(
            db, workspace_id, query, limit=request.limit, include_archived=request.include_archived
        )
    elif request.mode == "lexical":
        results = retrieval_service.search_lexical(
            db, workspace_id, query, limit=request.limit, include_archived=request.include_archived
        )
    elif request.mode == "hybrid":
        results = retrieval_service.search_hybrid(
            db, workspace_id, query, limit=request.limit, include_archived=request.include_archived
        )
    else:
        raise ValidationError(f"Unsupported search mode '{request.mode}'.")

    reranked = False
    if request.rerank:
        results = reranking_service.rerank(query, results)
        reranked = True

    return SearchResponse(
        query=query,
        mode=request.mode,
        total=len(results),
        items=results,
        reranking_applied=reranked,
    )
