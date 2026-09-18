"""Notes and note-link API routes."""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.note import NoteCreate, NoteListResponse, NoteResponse, NoteUpdate
from app.schemas.note_link import NoteLinkCreate, NoteLinkResponse, NoteLinksResponse
from app.services import note_service

router = APIRouter()


@router.post(
    "/workspaces/{workspace_id}/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_note(
    workspace_id: uuid.UUID,
    note_in: NoteCreate,
    db: Annotated[Session, Depends(get_db)],
) -> NoteResponse:
    return NoteResponse.model_validate(note_service.create_note(db, workspace_id, note_in))


@router.get("/workspaces/{workspace_id}/notes", response_model=NoteListResponse)
def list_notes(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    tag: str | None = None,
    is_pinned: bool | None = None,
    is_archived: bool = False,
    sort: Literal[
        "updated_at_desc", "updated_at_asc", "created_at_desc", "created_at_asc"
    ] = "updated_at_desc",
) -> NoteListResponse:
    notes, total = note_service.list_notes(
        db,
        workspace_id,
        page=page,
        page_size=page_size,
        tag=tag,
        is_pinned=is_pinned,
        is_archived=is_archived,
        sort=sort,
    )
    return NoteListResponse(
        items=[NoteResponse.model_validate(note) for note in notes],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/notes/{note_id}", response_model=NoteResponse)
def get_note(note_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> NoteResponse:
    return NoteResponse.model_validate(note_service.get_note_or_raise(db, note_id))


@router.patch("/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: uuid.UUID,
    note_in: NoteUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> NoteResponse:
    return NoteResponse.model_validate(note_service.update_note(db, note_id, note_in))


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> Response:
    note_service.delete_note(db, note_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/notes/{note_id}/links",
    response_model=NoteLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_note_link(
    note_id: uuid.UUID,
    link_in: NoteLinkCreate,
    db: Annotated[Session, Depends(get_db)],
) -> NoteLinkResponse:
    return NoteLinkResponse.model_validate(note_service.create_note_link(db, note_id, link_in))


@router.delete("/notes/{note_id}/links/{target_note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note_link(
    note_id: uuid.UUID,
    target_note_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    note_service.delete_note_link(db, note_id, target_note_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/notes/{note_id}/links", response_model=NoteLinksResponse)
def list_note_links(
    note_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]
) -> NoteLinksResponse:
    outgoing, incoming = note_service.list_note_links(db, note_id)
    return NoteLinksResponse(
        outgoing=[NoteLinkResponse.model_validate(link) for link in outgoing],
        incoming=[NoteLinkResponse.model_validate(link) for link in incoming],
    )
