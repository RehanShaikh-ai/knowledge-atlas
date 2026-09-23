"""Note versioning, diff, restore, and AI-edit approval routes.

Canonical endpoints per CONTRACT v0.3.1 §11.2-§11.4, §13.1.
GET    /api/v1/notes/{note_id}/versions
GET    /api/v1/notes/{note_id}/versions/{version_id}
GET    /api/v1/notes/{note_id}/diff?from={commit_hash}&to={commit_hash}
POST   /api/v1/notes/{note_id}/restore
POST   /api/v1/notes/{note_id}/ai-edit/approve
DELETE /api/v1/notes/{note_id}/ai-edit/pending
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.exceptions import NoteNotFoundError
from app.db.session import get_db
from app.models.note import Note
from app.schemas.version import (
    AIEditApproveRequest,
    AIEditResponse,
    DiffResponse,
    NoteVersionListResponse,
    NoteVersionResponse,
    RestoreRequest,
)
from app.services import git_service, version_service

router = APIRouter()


@router.get("/notes/{note_id}/versions", response_model=NoteVersionListResponse)
def list_note_versions(
    note_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> NoteVersionListResponse:
    """List note versions in descending chronological order per CONTRACT §13.1."""
    items, total = version_service.list_versions(db, note_id)
    return NoteVersionListResponse(
        items=[NoteVersionResponse.model_validate(v) for v in items],
        total=total,
    )


@router.get("/notes/{note_id}/versions/{version_id}", response_model=NoteVersionResponse)
def get_note_version(
    note_id: uuid.UUID,
    version_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> NoteVersionResponse:
    """Get single note version by ID per CONTRACT §13.1."""
    v = version_service.get_version(db, version_id)
    if v.note_id != note_id:
        raise NoteNotFoundError("Version does not belong to note.")
    try:
        content = git_service.read_version(v.workspace_id, note_id, v.commit_hash)
    except Exception:
        content = ""
    resp = NoteVersionResponse.model_validate(v)
    resp.content = content
    return resp


@router.get("/notes/{note_id}/diff", response_model=DiffResponse)
def get_note_diff(
    note_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    from_commit: Annotated[str, Query(alias="from", min_length=1, max_length=64)],
    to_commit: Annotated[str, Query(alias="to", min_length=1, max_length=64)],
) -> DiffResponse:
    """Get unified diff between two commits for a note per CONTRACT §11.3, §13.1."""
    note = db.get(Note, note_id)
    if not note:
        raise NoteNotFoundError("Note not found.")

    diff_text = git_service.get_diff(
        workspace_id=note.workspace_id,
        note_id=note_id,
        from_commit=from_commit,
        to_commit=to_commit,
    )
    return DiffResponse(
        note_id=note_id,
        from_commit=from_commit,
        to_commit=to_commit,
        diff=diff_text,
    )


@router.post("/notes/{note_id}/restore", response_model=NoteVersionResponse)
def restore_note_version(
    note_id: uuid.UUID,
    request: RestoreRequest,
    db: Annotated[Session, Depends(get_db)],
) -> NoteVersionResponse:
    """Restore note content from a commit creating a new commit per CONTRACT §11.3, §13.1."""
    note = db.get(Note, note_id)
    if not note:
        raise NoteNotFoundError("Note not found.")

    target_commit_hash = request.commit_hash
    if not target_commit_hash and request.version_id:
        v = version_service.get_version(db, request.version_id)
        if v.note_id != note_id:
            raise NoteNotFoundError("Version does not belong to note.")
        target_commit_hash = v.commit_hash

    if not target_commit_hash:
        from app.core.exceptions import ValidationError

        raise ValidationError("Either commit_hash or version_id must be provided.")

    author_id = request.author_id or note.created_by

    restored_content = git_service.read_version(note.workspace_id, note_id, target_commit_hash)
    note.content = restored_content
    db.commit()

    # Create NoteVersion for the restore
    version = version_service.create_version(
        db=db,
        workspace_id=note.workspace_id,
        note_id=note_id,
        author_id=author_id,
        message=f"Restore version from {target_commit_hash[:7]}",
        is_ai_edit=False,
    )
    resp = NoteVersionResponse.model_validate(version)
    resp.content = restored_content
    return resp


@router.post("/notes/{note_id}/ai-edit/approve", response_model=AIEditResponse)
def approve_ai_edit(
    note_id: uuid.UUID,
    request: AIEditApproveRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AIEditResponse:
    """Approve staged AI edit and commit to Git with is_ai_edit=True per CONTRACT §11.4."""
    version = version_service.approve_ai_edit(
        db=db,
        note_id=note_id,
        author_id=request.author_id,
    )
    return AIEditResponse(
        status="approved",
        message="AI edit approved and committed.",
        commit_hash=version.commit_hash,
    )


@router.delete(
    "/notes/{note_id}/ai-edit/pending",
    status_code=status.HTTP_204_NO_CONTENT,
)
def discard_ai_edit(
    note_id: uuid.UUID,
) -> None:
    """Discard pending AI edit per CONTRACT §11.4."""
    version_service.discard_ai_edit(note_id)
