"""Graph indexing service.

Canonical service per CONTRACT v0.3.2 §5.3, §7, §8.1-§8.4, §12.2.
Coordinates entity/relationship extraction pipeline, vector payload synchronization, and reindexing.
"""

import logging
import uuid
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.exceptions import NoteNotFoundError, WorkspaceNotFoundError
from app.models.entity_chunk import EntityChunk
from app.models.graph_entity import GraphEntity
from app.models.graph_relationship import GraphRelationship
from app.models.note import Note
from app.models.note_chunk import NoteChunk
from app.models.note_cluster_member import NoteClusterMember
from app.models.workspace import Workspace
from app.services import (
    cluster_service,
    entity_extraction_service,
    link_suggestion_service,
    relationship_extraction_service,
    vector_service,
)

logger = logging.getLogger("app.services.graph_index_service")


def index_note_graph(db: Session, note_id: uuid.UUID) -> None:
    """Run full graph extraction and indexing pipeline for a note per CONTRACT §8.1."""
    note = db.get(Note, note_id)
    if not note:
        raise NoteNotFoundError("Note not found.")

    # Step 1: Extract entities
    entities = entity_extraction_service.extract_entities_for_note(db, note_id)

    # Step 2: Extract relationships
    relationships = relationship_extraction_service.extract_relationships_for_note(db, note_id)

    # Step 3: Update link suggestions for workspace
    link_suggestion_service.generate_link_suggestions(db, note.workspace_id)

    # Step 4: Update Qdrant chunk payloads with entity_ids and cluster_id (§7)
    chunks = db.scalars(select(NoteChunk).where(NoteChunk.note_id == note_id)).all()
    if chunks:
        # Find cluster_id for note if any
        cluster_member = db.scalars(
            select(NoteClusterMember).where(NoteClusterMember.note_id == note_id)
        ).first()
        cluster_id_str = str(cluster_member.cluster_id) if cluster_member else None

        # Map each chunk to its associated entity_ids
        entity_chunks = db.scalars(select(EntityChunk).where(EntityChunk.note_id == note_id)).all()
        chunk_entities: dict[uuid.UUID, list[str]] = {c.id: [] for c in chunks}
        for ec in entity_chunks:
            if ec.chunk_id in chunk_entities:
                chunk_entities[ec.chunk_id].append(str(ec.entity_id))

        payload_updates: dict[uuid.UUID, dict[str, Any]] = {}
        for chunk in chunks:
            payload_updates[chunk.id] = {
                "entity_ids": chunk_entities.get(chunk.id, []),
                "cluster_id": cluster_id_str,
            }

        vector_service.update_chunk_payloads(note.workspace_id, payload_updates)

    logger.info(
        "Indexed note graph for %s: %d entities, %d relationships",
        note_id,
        len(entities),
        len(relationships),
    )


def reindex_workspace_graph(db: Session, workspace_id: uuid.UUID) -> dict[str, Any]:
    """Reindex knowledge graph for an entire workspace per CONTRACT §8.4, §12.2.

    Deletes only AI-extracted entities and relationships, preserves manual ones,
    re-extracts all notes, re-generates link suggestions, and runs clustering.
    """
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError("Workspace not found.")

    # 1. Delete all provenance rows for workspace
    db.execute(delete(EntityChunk).where(EntityChunk.workspace_id == workspace_id))

    # 2. Delete all AI-extracted relationships (is_manual == False)
    db.execute(
        delete(GraphRelationship).where(
            GraphRelationship.workspace_id == workspace_id,
            GraphRelationship.is_manual.is_(False),
        )
    )

    # 3. Delete all AI-extracted entities (is_manual == False)
    db.execute(
        delete(GraphEntity).where(
            GraphEntity.workspace_id == workspace_id,
            GraphEntity.is_manual.is_(False),
        )
    )
    db.commit()

    # 4. Fetch all workspace notes
    notes = db.scalars(
        select(Note).where(Note.workspace_id == workspace_id, Note.is_archived.is_(False))
    ).all()

    total_entities_count = 0
    total_relationships_count = 0

    for note in notes:
        ents = entity_extraction_service.extract_entities_for_note(db, note.id)
        rels = relationship_extraction_service.extract_relationships_for_note(db, note.id)
        total_entities_count += len(ents)
        total_relationships_count += len(rels)

    # 5. Re-generate link suggestions
    link_suggestion_service.generate_link_suggestions(db, workspace_id)

    # 6. Re-cluster workspace
    cluster_service.cluster_workspace(db, workspace_id)

    # 7. Update vector store chunk payloads
    for note in notes:
        chunks = db.scalars(select(NoteChunk).where(NoteChunk.note_id == note.id)).all()
        if chunks:
            cluster_member = db.scalars(
                select(NoteClusterMember).where(NoteClusterMember.note_id == note.id)
            ).first()
            cluster_id_str = str(cluster_member.cluster_id) if cluster_member else None

            entity_chunks = db.scalars(
                select(EntityChunk).where(EntityChunk.note_id == note.id)
            ).all()
            chunk_entities: dict[uuid.UUID, list[str]] = {c.id: [] for c in chunks}
            for ec in entity_chunks:
                if ec.chunk_id in chunk_entities:
                    chunk_entities[ec.chunk_id].append(str(ec.entity_id))

            payload_updates = {}
            for chunk in chunks:
                payload_updates[chunk.id] = {
                    "entity_ids": chunk_entities.get(chunk.id, []),
                    "cluster_id": cluster_id_str,
                }
            vector_service.update_chunk_payloads(workspace_id, payload_updates)

    summary = {
        "extracted_entities": total_entities_count,
        "extracted_relationships": total_relationships_count,
        "notes_processed": len(notes),
    }
    logger.info("Reindexed graph for workspace %s: %s", workspace_id, summary)
    return summary


def delete_note_graph(db: Session, note_id: uuid.UUID) -> None:
    """Remove provenance and update vector payload when a note is deleted per CONTRACT §14.1."""
    note = db.get(Note, note_id)
    if not note:
        return

    # Delete entity_chunk provenance rows
    db.execute(delete(EntityChunk).where(EntityChunk.note_id == note_id))
    db.commit()

    # Note vectors are deleted via vector_service.delete_note_vectors in note_service
