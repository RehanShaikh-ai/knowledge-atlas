"""Business logic for notes and note links."""

import uuid
from collections.abc import Sequence

from sqlalchemy import Select, asc, desc, func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import (
    ConflictError,
    NoteNotFoundError,
    UserNotFoundError,
    ValidationError,
    WorkspaceNotFoundError,
)
from app.models.note import Note
from app.models.note_link import NoteLink
from app.models.tag import Tag
from app.schemas.note import NoteCreate, NoteUpdate
from app.schemas.note_link import NoteLinkCreate
from app.services import user_service, workspace_service


def _note_statement() -> Select[tuple[Note]]:
    return select(Note).options(selectinload(Note.tags), selectinload(Note.source))


def get_workspace_or_raise(db: Session, workspace_id: uuid.UUID) -> None:
    if not workspace_service.get_workspace(db, workspace_id):
        raise WorkspaceNotFoundError()


def create_note(db: Session, workspace_id: uuid.UUID, note_in: NoteCreate) -> Note:
    """Create a note after validating its workspace and creator."""
    get_workspace_or_raise(db, workspace_id)
    if not user_service.get_user(db, note_in.created_by):
        raise UserNotFoundError("Note creator does not exist.")

    note = Note(workspace_id=workspace_id, **note_in.model_dump())
    db.add(note)
    db.commit()
    return get_note(db, note.id)


def get_note(db: Session, note_id: uuid.UUID) -> Note | None:
    """Return one note and its tags, if it exists."""
    return db.scalars(_note_statement().where(Note.id == note_id)).first()


def get_note_or_raise(db: Session, note_id: uuid.UUID) -> Note:
    """Return one note or raise the canonical not-found exception."""
    note = get_note(db, note_id)
    if not note:
        raise NoteNotFoundError()
    return note


def list_notes(
    db: Session,
    workspace_id: uuid.UUID,
    *,
    page: int,
    page_size: int,
    tag: str | None,
    is_pinned: bool | None,
    is_archived: bool,
    sort: str,
) -> tuple[Sequence[Note], int]:
    """List workspace notes with contract-defined filters and pagination."""
    get_workspace_or_raise(db, workspace_id)
    filters = [Note.workspace_id == workspace_id, Note.is_archived == is_archived]
    if tag is not None:
        filters.append(Note.tags.any(Tag.name == tag.strip().lower()))
    if is_pinned is not None:
        filters.append(Note.is_pinned == is_pinned)

    ordering = {
        "updated_at_desc": desc(Note.updated_at),
        "updated_at_asc": asc(Note.updated_at),
        "created_at_desc": desc(Note.created_at),
        "created_at_asc": asc(Note.created_at),
    }[sort]
    total = db.scalar(select(func.count(Note.id)).where(*filters)) or 0
    statement = (
        _note_statement()
        .where(*filters)
        .order_by(ordering)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return db.scalars(statement).all(), total


def update_note(db: Session, note_id: uuid.UUID, note_in: NoteUpdate) -> Note:
    """Apply only explicitly supplied editable fields to a note."""
    note = get_note_or_raise(db, note_id)
    for field, value in note_in.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    db.commit()
    return get_note_or_raise(db, note_id)


def delete_note(db: Session, note_id: uuid.UUID) -> None:
    """Delete a note; database foreign-key cascades remove related links."""
    db.delete(get_note_or_raise(db, note_id))
    db.commit()


def create_note_link(db: Session, note_id: uuid.UUID, link_in: NoteLinkCreate) -> NoteLink:
    """Create a directed link between two notes in the same workspace."""
    source_note = get_note_or_raise(db, note_id)
    target_note = get_note_or_raise(db, link_in.target_note_id)
    if source_note.id == target_note.id:
        raise ValidationError("Self-links are not allowed.")
    if source_note.workspace_id != target_note.workspace_id:
        raise ValidationError("Notes from different workspaces cannot be linked.")
    if db.get(NoteLink, (source_note.id, target_note.id)):
        raise ConflictError()

    note_link = NoteLink(source_note_id=source_note.id, target_note_id=target_note.id)
    db.add(note_link)
    db.commit()
    db.refresh(note_link)
    return note_link


def delete_note_link(db: Session, note_id: uuid.UUID, target_note_id: uuid.UUID) -> None:
    """Delete a note link after confirming the source note exists."""
    get_note_or_raise(db, note_id)
    note_link = db.get(NoteLink, (note_id, target_note_id))
    if note_link:
        db.delete(note_link)
        db.commit()


def list_note_links(
    db: Session, note_id: uuid.UUID
) -> tuple[Sequence[NoteLink], Sequence[NoteLink]]:
    """Return outgoing and incoming links for a note."""
    get_note_or_raise(db, note_id)
    outgoing = db.scalars(select(NoteLink).where(NoteLink.source_note_id == note_id)).all()
    incoming = db.scalars(select(NoteLink).where(NoteLink.target_note_id == note_id)).all()
    return outgoing, incoming
