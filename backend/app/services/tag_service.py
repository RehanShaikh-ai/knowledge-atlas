"""Business logic for workspace-scoped tags."""

import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateTagError, TagNotFoundError
from app.models.note_tag import NoteTag
from app.models.tag import Tag
from app.services import note_service


def add_tag_to_note(db: Session, note_id: uuid.UUID, name: str) -> Tag:
    """Find or create a workspace tag, then assign it to the note."""
    note = note_service.get_note_or_raise(db, note_id)
    normalized_name = name.strip().lower()
    tag = db.scalars(
        select(Tag).where(Tag.workspace_id == note.workspace_id, Tag.name == normalized_name)
    ).first()
    if tag is None:
        tag = Tag(workspace_id=note.workspace_id, name=normalized_name)
        db.add(tag)
        db.flush()

    if db.get(NoteTag, (note.id, tag.id)):
        raise DuplicateTagError()
    db.add(NoteTag(note_id=note.id, tag_id=tag.id))
    db.commit()
    db.refresh(tag)
    return tag


def remove_tag_from_note(db: Session, note_id: uuid.UUID, tag_id: uuid.UUID) -> None:
    """Remove a tag assignment from a note."""
    note = note_service.get_note_or_raise(db, note_id)
    tag = db.scalars(
        select(Tag).where(Tag.id == tag_id, Tag.workspace_id == note.workspace_id)
    ).first()
    if not tag:
        raise TagNotFoundError()
    note_tag = db.get(NoteTag, (note.id, tag.id))
    if not note_tag:
        raise TagNotFoundError("Tag is not assigned to this note.")
    db.delete(note_tag)
    db.commit()


def list_workspace_tags(db: Session, workspace_id: uuid.UUID) -> tuple[Sequence[Tag], int]:
    """List all tags in a workspace alphabetically."""
    note_service.get_workspace_or_raise(db, workspace_id)
    total = db.scalar(select(func.count(Tag.id)).where(Tag.workspace_id == workspace_id)) or 0
    tags = db.scalars(select(Tag).where(Tag.workspace_id == workspace_id).order_by(Tag.name)).all()
    return tags, total
