"""Link Suggestion endpoints.

Canonical endpoints per CONTRACT v0.3.2 §9.5.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.note import Note
from app.schemas.link_suggestion import (
    LinkSuggestionListResponse,
    LinkSuggestionResponse,
)
from app.schemas.note_link import NoteLinkResponse
from app.services import link_suggestion_service

router = APIRouter(tags=["suggestions"])


def _format_suggestion(db: Session, sug) -> LinkSuggestionResponse:
    source_note = db.get(Note, sug.source_note_id)
    target_note = db.get(Note, sug.target_note_id)
    return LinkSuggestionResponse(
        id=sug.id,
        source_note_id=sug.source_note_id,
        source_note_title=source_note.title if source_note else "Untitled Note",
        target_note_id=sug.target_note_id,
        target_note_title=target_note.title if target_note else "Untitled Note",
        confidence=sug.confidence,
        reason=sug.reason,
        status=sug.status,
        shared_entity_ids=sug.shared_entity_ids,
        created_at=sug.created_at,
        decided_at=sug.decided_at,
    )


@router.get(
    "/workspaces/{workspace_id}/suggestions",
    response_model=LinkSuggestionListResponse,
    status_code=status.HTTP_200_OK,
)
def list_suggestions(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    status_filter: Annotated[
        str | None,
        Query(alias="status", description="Filter by status (pending, accepted, rejected)"),
    ] = "pending",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> LinkSuggestionListResponse:
    """List AI link suggestions for a workspace per CONTRACT §9.5."""
    items, total = link_suggestion_service.list_suggestions(
        db=db,
        workspace_id=workspace_id,
        status=status_filter,
        page=page,
        page_size=page_size,
    )
    return LinkSuggestionListResponse(
        items=[_format_suggestion(db, s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/suggestions/{suggestion_id}/accept",
    response_model=NoteLinkResponse,
    status_code=status.HTTP_200_OK,
)
def accept_suggestion(
    suggestion_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> NoteLinkResponse:
    """Accept a link suggestion and create a real NoteLink per CONTRACT §9.5."""
    link = link_suggestion_service.accept_suggestion(db, suggestion_id)
    return NoteLinkResponse.model_validate(link)


@router.post(
    "/suggestions/{suggestion_id}/reject",
    response_model=LinkSuggestionResponse,
    status_code=status.HTTP_200_OK,
)
def reject_suggestion(
    suggestion_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> LinkSuggestionResponse:
    """Reject a link suggestion per CONTRACT §9.5."""
    sug = link_suggestion_service.reject_suggestion(db, suggestion_id)
    return _format_suggestion(db, sug)
