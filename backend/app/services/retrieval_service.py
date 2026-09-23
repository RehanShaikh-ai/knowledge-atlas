"""Retrieval service supporting semantic, lexical, and hybrid search.

Canonical service per CONTRACT v0.3.1 §5.3, §9.1, §9.2.
Provides search_semantic, search_lexical, search_hybrid.
"""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note
from app.models.note_chunk import NoteChunk
from app.schemas.search import SearchResultItem
from app.services import embedding_service, search_service, vector_service

logger = logging.getLogger("app.services.retrieval_service")


def search_semantic(
    db: Session,
    workspace_id: uuid.UUID,
    query: str,
    limit: int = 10,
    include_archived: bool = False,
) -> list[SearchResultItem]:
    """Semantic vector search against Qdrant per CONTRACT §9.1, §9.2."""
    if not query.strip():
        return []

    # Get query embedding
    query_vector = embedding_service.get_embedding(query)

    # Note exclusion filters if archived are excluded
    excluded_note_ids: list[uuid.UUID] = []
    if not include_archived:
        archived_ids = db.scalars(
            select(Note.id).where(Note.workspace_id == workspace_id, Note.is_archived.is_(True))
        ).all()
        excluded_note_ids = list(archived_ids)

    # Search vectors
    points = vector_service.search_vectors(
        workspace_id=workspace_id,
        query_vector=query_vector,
        limit=max(limit * 3, 20),
        excluded_note_ids=excluded_note_ids,
    )

    seen_notes: set[uuid.UUID] = set()
    results: list[SearchResultItem] = []
    for pt in points:
        payload = pt.get("payload", {})
        note_id_str = payload.get("note_id")
        chunk_id_str = payload.get("chunk_id")
        if not note_id_str:
            continue

        n_id = uuid.UUID(note_id_str)
        if n_id in seen_notes:
            continue

        note = db.get(Note, n_id)
        if not note or (note.is_archived and not include_archived):
            continue

        seen_notes.add(n_id)

        excerpt = ""
        c_id: uuid.UUID | None = None
        if chunk_id_str:
            try:
                c_id = uuid.UUID(chunk_id_str)
                chunk = db.get(NoteChunk, c_id)
                if chunk:
                    excerpt = chunk.content[:500]
            except Exception:
                pass

        if not excerpt:
            excerpt = (note.content or "")[:500]

        results.append(
            SearchResultItem(
                note_id=note.id,
                chunk_id=c_id,
                title=note.title,
                excerpt=excerpt,
                score=round(float(pt.get("score", 0.0)), 4),
                score_meaning="cosine_similarity",
                search_mode="semantic",
                is_archived=note.is_archived,
            )
        )
        if len(results) >= limit:
            break

    return results


def search_lexical(
    db: Session,
    workspace_id: uuid.UUID,
    query: str,
    limit: int = 10,
    include_archived: bool = False,
) -> list[SearchResultItem]:
    """Lexical text search per CONTRACT §9.1, §9.2."""
    notes, _ = search_service.search_notes(
        db,
        workspace_id,
        query=query,
        page=1,
        page_size=limit,
    )

    results: list[SearchResultItem] = []
    for rank, note in enumerate(notes):
        if note.is_archived and not include_archived:
            continue
        # Lexical score normalized from position
        rank_score = round(1.0 / (rank + 1), 4)
        results.append(
            SearchResultItem(
                note_id=note.id,
                chunk_id=None,
                title=note.title,
                excerpt=(note.content or "")[:500],
                score=rank_score,
                score_meaning="bm25",
                search_mode="lexical",
                is_archived=note.is_archived,
            )
        )
    return results[:limit]


def search_hybrid(
    db: Session,
    workspace_id: uuid.UUID,
    query: str,
    limit: int = 10,
    include_archived: bool = False,
) -> list[SearchResultItem]:
    """Hybrid search combining semantic and lexical via Reciprocal Rank Fusion (RRF)."""
    # Fetch top candidates from both modes
    semantic_results = search_semantic(
        db, workspace_id, query, limit=limit * 2, include_archived=include_archived
    )
    lexical_results = search_lexical(
        db, workspace_id, query, limit=limit * 2, include_archived=include_archived
    )

    # RRF with standard constant k = 60
    k = 60
    rrf_scores: dict[uuid.UUID, float] = {}
    items_by_note: dict[uuid.UUID, SearchResultItem] = {}

    for rank, item in enumerate(semantic_results):
        score = 1.0 / (k + rank + 1)
        rrf_scores[item.note_id] = rrf_scores.get(item.note_id, 0.0) + score
        items_by_note[item.note_id] = item

    for rank, item in enumerate(lexical_results):
        score = 1.0 / (k + rank + 1)
        rrf_scores[item.note_id] = rrf_scores.get(item.note_id, 0.0) + score
        if item.note_id not in items_by_note:
            items_by_note[item.note_id] = item

    sorted_notes = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

    final_results: list[SearchResultItem] = []
    for n_id, combined_score in sorted_notes[:limit]:
        orig = items_by_note[n_id]
        final_results.append(
            SearchResultItem(
                note_id=orig.note_id,
                chunk_id=orig.chunk_id,
                title=orig.title,
                excerpt=orig.excerpt,
                score=round(combined_score, 4),
                score_meaning="rrf_combined",
                search_mode="hybrid",
                is_archived=orig.is_archived,
            )
        )

    return final_results
