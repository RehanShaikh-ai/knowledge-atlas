"""Note search API route."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError
from app.db.session import get_db
from app.schemas.note import NoteResponse, NoteSearchResponse
from app.services import search_service

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
