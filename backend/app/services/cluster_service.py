"""Cluster management service.

Canonical service per CONTRACT v0.3.2 §5.3, §9.6.
Clusters workspace notes and entities automatically into thematic groups.
"""

import logging
import uuid
from collections import defaultdict
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ClusterNotFoundError, WorkspaceNotFoundError
from app.models.entity_chunk import EntityChunk
from app.models.graph_entity import GraphEntity
from app.models.note import Note
from app.models.note_cluster import NoteCluster
from app.models.note_cluster_member import NoteClusterMember
from app.models.workspace import Workspace

logger = logging.getLogger("app.services.cluster_service")


def cluster_workspace(db: Session, workspace_id: uuid.UUID) -> list[NoteCluster]:
    """Perform automatic clustering of workspace notes and entities per CONTRACT §8.1, §9.6."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError("Workspace not found.")

    notes = db.scalars(select(Note).where(Note.workspace_id == workspace_id)).all()
    if not notes:
        return []

    # Get entities for notes
    entity_chunks = db.scalars(
        select(EntityChunk).where(EntityChunk.workspace_id == workspace_id)
    ).all()

    note_entities: dict[uuid.UUID, set[uuid.UUID]] = defaultdict(set)
    for ec in entity_chunks:
        note_entities[ec.note_id].add(ec.entity_id)

    # Fetch all entities
    all_entities = db.scalars(
        select(GraphEntity).where(GraphEntity.workspace_id == workspace_id)
    ).all()
    entity_map = {e.id: e for e in all_entities}

    # If notes have tags, also use tags for grouping
    # Simple semantic grouping based on top entities or tags
    entity_frequency: dict[uuid.UUID, int] = defaultdict(int)
    for eids in note_entities.values():
        for eid in eids:
            entity_frequency[eid] += 1

    # Top entities by note co-occurrence become cluster centroids / themes
    sorted_top_entities = sorted(entity_frequency.items(), key=lambda x: x[1], reverse=True)

    created_clusters: list[NoteCluster] = []

    if sorted_top_entities:
        # Take up to 5 top entities as cluster themes
        top_k = min(5, len(sorted_top_entities))
        for i in range(top_k):
            centroid_eid = sorted_top_entities[i][0]
            centroid_entity = entity_map.get(centroid_eid)
            if not centroid_entity:
                continue

            label = centroid_entity.name
            desc = centroid_entity.description or f"Cluster centered around {label}"

            cluster = NoteCluster(
                workspace_id=workspace_id,
                label=label,
                description=desc,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
            db.add(cluster)
            db.flush()

            # Assign member notes that have this entity or related entities
            member_count = 0
            for note in notes:
                eids = note_entities.get(note.id, set())
                if centroid_eid in eids or not eids:
                    score = 1.0 if centroid_eid in eids else 0.5
                    member = NoteClusterMember(
                        cluster_id=cluster.id,
                        note_id=note.id,
                        score=score,
                    )
                    db.add(member)
                    member_count += 1

            # Assign cluster_id to this entity and related entities
            centroid_entity.cluster_id = cluster.id
            created_clusters.append(cluster)
    else:
        # Default cluster for general workspace notes
        cluster = NoteCluster(
            workspace_id=workspace_id,
            label="General Notes",
            description="Default cluster for unclassified workspace notes",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(cluster)
        db.flush()

        for note in notes:
            member = NoteClusterMember(
                cluster_id=cluster.id,
                note_id=note.id,
                score=1.0,
            )
            db.add(member)
        created_clusters.append(cluster)

    db.commit()
    for c in created_clusters:
        db.refresh(c)
    return created_clusters


def get_cluster(db: Session, cluster_id: uuid.UUID) -> NoteCluster:
    """Retrieve a cluster with its members per CONTRACT §9.6."""
    cluster = db.scalars(
        select(NoteCluster)
        .options(
            selectinload(NoteCluster.members).selectinload(NoteClusterMember.note),
            selectinload(NoteCluster.entities),
        )
        .where(NoteCluster.id == cluster_id)
    ).first()

    if not cluster:
        raise ClusterNotFoundError("Cluster not found.")
    return cluster


def list_clusters(db: Session, workspace_id: uuid.UUID) -> list[NoteCluster]:
    """List all clusters in a workspace per CONTRACT §9.6."""
    return db.scalars(
        select(NoteCluster)
        .options(selectinload(NoteCluster.members).selectinload(NoteClusterMember.note))
        .where(NoteCluster.workspace_id == workspace_id)
        .order_by(NoteCluster.created_at.desc())
    ).all()
