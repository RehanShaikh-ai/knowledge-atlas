"""Link suggestion service.

Canonical service per CONTRACT v0.3.2 §5.3, §9.5.
Generates note-to-note link suggestions based on shared extracted entities and handles decisions.
"""

import uuid
from collections import defaultdict
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    SuggestionAlreadyDecidedError,
    SuggestionNotFoundError,
)
from app.models.entity_chunk import EntityChunk
from app.models.graph_entity import GraphEntity
from app.models.link_suggestion import LinkSuggestion
from app.models.note_link import NoteLink

logger = logging = __import__("logging").getLogger("app.services.link_suggestion_service")


def generate_link_suggestions(
    db: Session,
    workspace_id: uuid.UUID,
) -> list[LinkSuggestion]:
    """Generate link suggestions between notes sharing entities per CONTRACT §8.1, §9.5."""
    # Find all (entity_id, note_id) mappings in workspace
    entity_chunks = db.scalars(
        select(EntityChunk).where(EntityChunk.workspace_id == workspace_id)
    ).all()

    if not entity_chunks:
        return []

    # Map entity_id -> set of note_ids
    entity_to_notes: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    for ec in entity_chunks:
        entity_to_notes[ec.entity_id].add(ec.note_id)

    # Map note pairs -> set of shared entity_ids
    pair_shared_entities: dict[tuple[uuid.UUID, uuid.UUID], set[uuid.UUID]] = defaultdict(set)
    for entity_id, note_ids in entity_to_notes.items():
        note_list = sorted(note_ids)
        for i in range(len(note_list)):
            for j in range(i + 1, len(note_list)):
                pair = (note_list[i], note_list[j])
                pair_shared_entities[pair].add(entity_id)

    if not pair_shared_entities:
        return []

    # Get entity names for reasoning
    all_entity_ids = list(entity_to_notes.keys())
    entities = db.scalars(select(GraphEntity).where(GraphEntity.id.in_(all_entity_ids))).all()
    entity_id_to_name = {e.id: e.name for e in entities}

    # Fetch existing note links to avoid suggesting already-linked notes
    existing_links = db.scalars(select(NoteLink)).all()
    linked_pairs = {(nl.source_note_id, nl.target_note_id) for nl in existing_links}
    linked_pairs.update({(nl.target_note_id, nl.source_note_id) for nl in existing_links})

    generated_suggestions: list[LinkSuggestion] = []

    for (note_a, note_b), shared_eids in pair_shared_entities.items():
        if (note_a, note_b) in linked_pairs:
            continue

        shared_names = [entity_id_to_name[eid] for eid in shared_eids if eid in entity_id_to_name]
        confidence = min(1.0, 0.5 + 0.15 * len(shared_eids))
        reason = f"Both notes share entities: {', '.join(shared_names[:4])}"
        shared_eids_str = [str(eid) for eid in shared_eids]

        # Check existing suggestion
        existing_sug = db.scalars(
            select(LinkSuggestion).where(
                LinkSuggestion.workspace_id == workspace_id,
                LinkSuggestion.source_note_id == note_a,
                LinkSuggestion.target_note_id == note_b,
            )
        ).first()

        if existing_sug:
            if existing_sug.status == "pending":
                existing_sug.confidence = confidence
                existing_sug.reason = reason
                existing_sug.shared_entity_ids = shared_eids_str
            generated_suggestions.append(existing_sug)
        else:
            sug = LinkSuggestion(
                workspace_id=workspace_id,
                source_note_id=note_a,
                target_note_id=note_b,
                confidence=confidence,
                reason=reason,
                status="pending",
                shared_entity_ids=shared_eids_str,
            )
            db.add(sug)
            generated_suggestions.append(sug)

    db.commit()
    for s in generated_suggestions:
        db.refresh(s)
    return generated_suggestions


def accept_suggestion(db: Session, suggestion_id: uuid.UUID) -> NoteLink:
    """Accept a link suggestion and create a NoteLink per CONTRACT §9.5."""
    sug = db.get(LinkSuggestion, suggestion_id)
    if not sug:
        raise SuggestionNotFoundError("Link suggestion not found.")

    if sug.status != "pending":
        raise SuggestionAlreadyDecidedError(f"Suggestion is already {sug.status}.")

    # Check if NoteLink already exists
    existing_link = db.get(NoteLink, (sug.source_note_id, sug.target_note_id))
    if not existing_link:
        # Also check reverse link
        reverse_link = db.get(NoteLink, (sug.target_note_id, sug.source_note_id))
        if reverse_link:
            link = reverse_link
        else:
            link = NoteLink(
                source_note_id=sug.source_note_id,
                target_note_id=sug.target_note_id,
            )
            db.add(link)
    else:
        link = existing_link

    sug.status = "accepted"
    sug.decided_at = datetime.now(UTC)
    db.commit()
    db.refresh(link)
    return link


def reject_suggestion(db: Session, suggestion_id: uuid.UUID) -> LinkSuggestion:
    """Reject a link suggestion per CONTRACT §9.5."""
    sug = db.get(LinkSuggestion, suggestion_id)
    if not sug:
        raise SuggestionNotFoundError("Link suggestion not found.")

    if sug.status != "pending":
        raise SuggestionAlreadyDecidedError(f"Suggestion is already {sug.status}.")

    sug.status = "rejected"
    sug.decided_at = datetime.now(UTC)
    db.commit()
    db.refresh(sug)
    return sug


def list_suggestions(
    db: Session,
    workspace_id: uuid.UUID,
    status: str | None = "pending",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[LinkSuggestion], int]:
    """List suggestions for a workspace with pagination per CONTRACT §9.5."""
    filters = [LinkSuggestion.workspace_id == workspace_id]
    if status is not None and status != "":
        filters.append(LinkSuggestion.status == status)

    total = db.scalar(select(func.count(LinkSuggestion.id)).where(*filters)) or 0
    items = db.scalars(
        select(LinkSuggestion)
        .where(*filters)
        .order_by(LinkSuggestion.confidence.desc(), LinkSuggestion.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return list(items), total
