"""PostgreSQL full-text search for workspace notes."""

import uuid
from collections.abc import Sequence

from sqlalchemy import case, func, or_, select
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
    normalized_query = query.lower()
    substring_matches = or_(
        func.lower(Note.title).contains(normalized_query),
        func.lower(Note.content).contains(normalized_query),
        Note.tags.any(func.lower(Tag.name).contains(normalized_query)),
    )

    title_rank = case(
        (func.lower(Note.title) == normalized_query, 3),
        (func.lower(Note.title).startswith(normalized_query), 2),
        (func.lower(Note.title).contains(normalized_query), 1),
        else_=0,
    )

    if db.bind is not None and db.bind.dialect.name == "postgresql":
        tsquery = func.plainto_tsquery("english", query)
        matches = or_(
            substring_matches,
            Note.search_vector.op("@@")(tsquery),
            Note.tags.any(func.to_tsvector("english", Tag.name).op("@@")(tsquery)),
        )
        ts_rank_score = func.coalesce(func.ts_rank(Note.search_vector, tsquery), 0.0)
        order_clauses = [
            title_rank.desc(),
            ts_rank_score.desc(),
            Note.updated_at.desc(),
        ]
    else:
        matches = substring_matches
        order_clauses = [
            title_rank.desc(),
            Note.updated_at.desc(),
        ]

    filters = [
        Note.workspace_id == workspace_id,
        Note.is_archived.is_(False),
        matches,
    ]
    total = db.scalar(select(func.count(Note.id)).where(*filters)) or 0
    statement = (
        select(Note)
        .options(selectinload(Note.tags), selectinload(Note.source))
        .where(*filters)
        .order_by(*order_clauses)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return db.scalars(statement).all(), total
