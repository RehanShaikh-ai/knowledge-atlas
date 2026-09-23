"""Version service for note snapshots and AI-edit approval flow.

Canonical service per CONTRACT v0.3.1 §5.3, §11.4.
Provides versioning, diff, restore, and AI-edit approval.
"""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    ConflictError,
    NoteNotFoundError,
    ValidationError,
    VersionNotFoundError,
)
from app.models.note import Note
from app.models.note_version import NoteVersion
from app.services import git_service

logger = logging.getLogger("app.services.version_service")

# Pending AI edits store: note_id -> pending_content
_pending_ai_edits: dict[uuid.UUID, str] = {}


def create_version(
    db: Session,
    workspace_id: uuid.UUID,
    note_id: uuid.UUID,
    author_id: uuid.UUID,
    message: str | None = None,
    is_ai_edit: bool = False,
) -> NoteVersion:
    """Create a Git snapshot and persist NoteVersion record."""
    note = db.get(Note, note_id)
    if not note or note.workspace_id != workspace_id:
        raise NoteNotFoundError("Note not found in workspace.")

    # Write live note content to git repository
    git_service.write_note(workspace_id, note_id, note.content or "")

    commit_msg = message or f"Snapshot note {note.title}"
    commit_hash = git_service.snapshot(
        workspace_id=workspace_id,
        note_id=note_id,
        message=commit_msg,
        author_id=author_id,
        is_ai_edit=is_ai_edit,
    )

    version = NoteVersion(
        note_id=note_id,
        workspace_id=workspace_id,
        commit_hash=commit_hash,
        author_id=author_id,
        message=commit_msg,
        is_ai_edit=is_ai_edit,
        created_at=datetime.now(UTC),
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def get_version(db: Session, version_id: uuid.UUID) -> NoteVersion:
    """Fetch NoteVersion by ID."""
    version = db.get(NoteVersion, version_id)
    if not version:
        raise VersionNotFoundError(f"Version {version_id} not found.")
    return version


def list_versions(
    db: Session,
    note_id: uuid.UUID,
) -> tuple[list[NoteVersion], int]:
    """List all versions for a note in descending chronological order."""
    note = db.get(Note, note_id)
    if not note:
        raise NoteNotFoundError("Note not found.")

    stmt = (
        select(NoteVersion)
        .where(NoteVersion.note_id == note_id)
        .order_by(NoteVersion.created_at.desc())
    )
    items = list(db.scalars(stmt).all())
    return items, len(items)


def stage_ai_edit(note_id: uuid.UUID, proposed_content: str) -> None:
    """Stage pending AI edit. Only 1 pending edit per note; raises ConflictError if pending."""
    if note_id in _pending_ai_edits:
        raise ConflictError("An AI edit is already pending approval for this note.")
    _pending_ai_edits[note_id] = proposed_content


def get_pending_ai_edit(note_id: uuid.UUID) -> str | None:
    """Retrieve pending AI edit content for note."""
    return _pending_ai_edits.get(note_id)


def approve_ai_edit(
    db: Session,
    note_id: uuid.UUID,
    author_id: uuid.UUID,
) -> NoteVersion:
    """Approve pending AI edit, update note content, create Git commit and NoteVersion row."""
    if note_id not in _pending_ai_edits:
        raise ValidationError("No pending AI edit found for this note.")

    new_content = _pending_ai_edits.pop(note_id)
    note = db.get(Note, note_id)
    if not note:
        raise NoteNotFoundError("Note not found.")

    note.content = new_content
    db.commit()

    # Create version marked as is_ai_edit=True
    version = create_version(
        db=db,
        workspace_id=note.workspace_id,
        note_id=note_id,
        author_id=author_id,
        message="AI generated edit approved by user",
        is_ai_edit=True,
    )
    return version


def discard_ai_edit(note_id: uuid.UUID) -> None:
    """Discard pending AI edit."""
    if note_id not in _pending_ai_edits:
        raise ValidationError("No pending AI edit found for this note.")
    del _pending_ai_edits[note_id]
