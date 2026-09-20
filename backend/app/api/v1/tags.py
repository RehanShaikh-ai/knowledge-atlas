"""Tag API routes."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.tag import TagCreate, TagListResponse, TagResponse
from app.services import tag_service

router = APIRouter()


@router.post(
    "/notes/{note_id}/tags",
    response_model=TagResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_tag_to_note(
    note_id: uuid.UUID,
    tag_in: TagCreate,
    db: Annotated[Session, Depends(get_db)],
) -> TagResponse:
    return TagResponse.model_validate(tag_service.add_tag_to_note(db, note_id, tag_in.name))


@router.delete("/notes/{note_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_note(
    note_id: uuid.UUID,
    tag_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    tag_service.remove_tag_from_note(db, note_id, tag_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/workspaces/{workspace_id}/tags", response_model=TagListResponse)
def list_workspace_tags(
    workspace_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]
) -> TagListResponse:
    tags, total = tag_service.list_workspace_tags(db, workspace_id)
    return TagListResponse(
        items=[TagResponse.model_validate(tag) for tag in tags],
        total=total,
    )
