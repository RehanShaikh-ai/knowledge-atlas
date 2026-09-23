"""Business logic for workspace-scoped tags."""

import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateTagError, TagNotFoundError
from app.models.note import Note
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
    """Remove a tag assignment from a note, and clean up the tag if unused."""
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
    db.flush()

    # If no other note uses this tag, delete it
    remaining = db.scalar(select(func.count(NoteTag.note_id)).where(NoteTag.tag_id == tag.id)) or 0
    if remaining == 0:
        db.delete(tag)

    db.commit()


def list_workspace_tags(db: Session, workspace_id: uuid.UUID) -> tuple[Sequence[Tag], int]:
    """List active tags (associated with non-archived notes) in a workspace."""
    note_service.get_workspace_or_raise(db, workspace_id)

    # Clean up orphan tags in workspace
    orphan_tags = db.scalars(
        select(Tag).where(
            Tag.workspace_id == workspace_id,
            ~select(NoteTag.tag_id).where(NoteTag.tag_id == Tag.id).exists(),
        )
    ).all()
    for tag in orphan_tags:
        db.delete(tag)
    if orphan_tags:
        db.commit()

    stmt = (
        select(Tag)
        .join(NoteTag, Tag.id == NoteTag.tag_id)
        .join(Note, NoteTag.note_id == Note.id)
        .where(Tag.workspace_id == workspace_id, Note.is_archived.is_(False))
        .distinct()
        .order_by(Tag.name)
    )
    tags = db.scalars(stmt).all()
    return tags, len(tags)
