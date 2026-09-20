"""PostgreSQL full-text search for workspace notes."""

import uuid
from collections.abc import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.note import Note
from app.models.tag import Tag
from app.services import note_service


def search_notes(
    db: Session,
    workspace_id: uuid.UUID,
    *,
    query: str,
    page: int,
    page_size: int,
) -> tuple[Sequence[Note], int]:
    """Search title, content, and tag names with PostgreSQL full-text search."""
    note_service.get_workspace_or_raise(db, workspace_id)
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        tsquery = func.plainto_tsquery("english", query)
        matches = or_(
            Note.search_vector.op("@@")(tsquery),
            Note.tags.any(func.to_tsvector("english", Tag.name).op("@@")(tsquery)),
        )
        ordering = func.ts_rank(Note.search_vector, tsquery).desc()
    else:
        normalized_query = query.lower()
        matches = or_(
            func.lower(Note.title).contains(normalized_query),
            func.lower(Note.content).contains(normalized_query),
            Note.tags.any(func.lower(Tag.name).contains(normalized_query)),
        )
        ordering = Note.updated_at.desc()

    filters = [
        Note.workspace_id == workspace_id,
        Note.is_archived.is_(False),
        matches,
    ]
    total = db.scalar(select(func.count(Note.id)).where(*filters)) or 0
    statement = (
        select(Note)
        .options(selectinload(Note.tags))
        .where(*filters)
        .order_by(ordering)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return db.scalars(statement).all(), total
