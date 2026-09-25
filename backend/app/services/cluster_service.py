"""Cluster management service.

Canonical service per CONTRACT v0.3.2 §5.3, §9.6.
Clusters workspace notes and entities automatically into thematic groups.
"""

import logging
import uuid
from collections import defaultdict
from datetime import UTC, datetime

from sqlalchemy import delete, select, update
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
    """Perform automatic clustering of workspace notes and entities per CONTRACT §8.1, §9.6.

    Idempotently replaces previous clusters for this workspace.
    """
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError("Workspace not found.")

    # 1. Clean up existing clusters for workspace to guarantee idempotency & no stale duplicates
    existing_cluster_ids = list(
        db.scalars(select(NoteCluster.id).where(NoteCluster.workspace_id == workspace_id)).all()
    )
    if existing_cluster_ids:
        # Clear entity references
        db.execute(
            update(GraphEntity)
            .where(GraphEntity.workspace_id == workspace_id)
            .values(cluster_id=None)
        )
        # Delete cluster members
        db.execute(
            delete(NoteClusterMember).where(NoteClusterMember.cluster_id.in_(existing_cluster_ids))
        )
        # Delete clusters
        db.execute(delete(NoteCluster).where(NoteCluster.id.in_(existing_cluster_ids)))
        db.flush()
        db.expire_all()

    notes = db.scalars(
        select(Note).where(Note.workspace_id == workspace_id, Note.is_archived.is_(False))
    ).all()
    if not notes:
        db.commit()
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

    # Entity frequency across notes
    entity_frequency: dict[uuid.UUID, int] = defaultdict(int)
    for eids in note_entities.values():
        for eid in eids:
            entity_frequency[eid] += 1

    sorted_top_entities = sorted(entity_frequency.items(), key=lambda x: x[1], reverse=True)

    created_clusters: list[NoteCluster] = []
    clustered_note_ids: set[uuid.UUID] = set()
    used_labels: set[str] = set()

    if sorted_top_entities:
        for centroid_eid, _freq in sorted_top_entities:
            if len(created_clusters) >= 6:
                break
            centroid_entity = entity_map.get(centroid_eid)
            if not centroid_entity:
                continue

            label = centroid_entity.name.strip()
            if label.lower() in used_labels:
                continue

            # Find notes containing this entity
            member_notes = [n for n in notes if centroid_eid in note_entities.get(n.id, set())]
            if not member_notes:
                continue

            used_labels.add(label.lower())
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

            # Assign member notes
            for m_note in member_notes:
                member = NoteClusterMember(
                    cluster_id=cluster.id,
                    note_id=m_note.id,
                    score=1.0,
                )
                db.add(member)
                clustered_note_ids.add(m_note.id)

                # Assign cluster_id to entities in this member note
                for eid in note_entities.get(m_note.id, set()):
                    ent = entity_map.get(eid)
                    if ent and ent.cluster_id is None:
                        ent.cluster_id = cluster.id

            centroid_entity.cluster_id = cluster.id
            created_clusters.append(cluster)

    # If there are notes not assigned to any cluster, group into General Notes
    unclustered_notes = [n for n in notes if n.id not in clustered_note_ids]
    if unclustered_notes:
        general_cluster = NoteCluster(
            workspace_id=workspace_id,
            label="General Notes",
            description="Default cluster for unclassified workspace notes",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(general_cluster)
        db.flush()

        for u_note in unclustered_notes:
            member = NoteClusterMember(
                cluster_id=general_cluster.id,
                note_id=u_note.id,
                score=1.0,
            )
            db.add(member)
            for eid in note_entities.get(u_note.id, set()):
                ent = entity_map.get(eid)
                if ent and ent.cluster_id is None:
                    ent.cluster_id = general_cluster.id

        created_clusters.append(general_cluster)

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
