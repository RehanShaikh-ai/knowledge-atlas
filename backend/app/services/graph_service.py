"""Knowledge Graph service.

Canonical service per contract §4.3 and §8.
Provides:
    - get_workspace_graph
    - get_note_neighborhood
"""

import uuid
from collections import defaultdict

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import NoteNotFoundError, WorkspaceNotFoundError
from app.models.note import Note
from app.models.note_link import NoteLink
from app.models.tag import Tag
from app.models.workspace import Workspace
from app.schemas.graph import GraphEdge, GraphNode, GraphResponse, GraphStats


def get_workspace_graph(
    db: Session,
    workspace_id: uuid.UUID,
    tag: str | None = None,
    limit: int = 500,
) -> GraphResponse:
    """Return the knowledge graph for a workspace per contract §8.1."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError()

    clamped_limit = max(1, min(limit, 1000))

    # Base query for notes
    base_query = (
        select(Note)
        .where(Note.workspace_id == workspace_id, Note.is_archived.is_(False))
        .options(selectinload(Note.tags))
    )

    if tag:
        normalized_tag = tag.strip().lower()
        base_query = base_query.join(Note.tags).where(Tag.name == normalized_tag)

    # Count total matching notes
    count_query = select(func.count()).select_from(base_query.subquery())
    total_matching_notes = db.scalar(count_query) or 0
    is_truncated = total_matching_notes > clamped_limit

    # Fetch notes up to limit
    notes = db.scalars(base_query.order_by(Note.updated_at.desc()).limit(clamped_limit)).all()

    node_ids = {n.id for n in notes}

    # Fetch edges between the returned nodes
    edges_query = select(NoteLink).where(
        NoteLink.source_note_id.in_(node_ids),
        NoteLink.target_note_id.in_(node_ids),
    )
    raw_edges = db.scalars(edges_query).all() if node_ids else []

    # Calculate degrees
    degrees: dict[uuid.UUID, int] = defaultdict(int)
    for edge in raw_edges:
        degrees[edge.source_note_id] += 1
        degrees[edge.target_note_id] += 1

    # Isolated notes are notes with degree == 0
    isolated_count = sum(1 for n in notes if degrees[n.id] == 0)

    nodes = [
        GraphNode(
            id=n.id,
            title=n.title,
            is_pinned=n.is_pinned,
            tag_names=[t.name for t in n.tags],
            degree=degrees[n.id],
        )
        for n in notes
    ]

    edges = [
        GraphEdge(
            source_note_id=edge.source_note_id,
            target_note_id=edge.target_note_id,
        )
        for edge in raw_edges
    ]

    stats = GraphStats(
        node_count=len(nodes),
        edge_count=len(edges),
        isolated_count=isolated_count,
        truncated=is_truncated,
    )

    return GraphResponse(nodes=nodes, edges=edges, stats=stats)


def get_note_neighborhood(
    db: Session,
    note_id: uuid.UUID,
) -> GraphResponse:
    """Return the 1-hop connected graph neighborhood of a note per contract §8.2."""
    center_note = db.get(Note, note_id)
    if not center_note or center_note.is_archived:
        raise NoteNotFoundError()

    # Find connected note IDs
    links = db.scalars(
        select(NoteLink).where(
            or_(
                NoteLink.source_note_id == note_id,
                NoteLink.target_note_id == note_id,
            )
        )
    ).all()

    neighbor_ids = {note_id}
    for link in links:
        neighbor_ids.add(link.source_note_id)
        neighbor_ids.add(link.target_note_id)

    # Fetch all notes in the neighborhood
    notes = db.scalars(
        select(Note)
        .where(Note.id.in_(neighbor_ids), Note.is_archived.is_(False))
        .options(selectinload(Note.tags))
    ).all()

    active_note_ids = {n.id for n in notes}

    # Fetch all edges among active notes in neighborhood
    raw_edges = db.scalars(
        select(NoteLink).where(
            NoteLink.source_note_id.in_(active_note_ids),
            NoteLink.target_note_id.in_(active_note_ids),
        )
    ).all()

    degrees: dict[uuid.UUID, int] = defaultdict(int)
    for edge in raw_edges:
        degrees[edge.source_note_id] += 1
        degrees[edge.target_note_id] += 1

    nodes = [
        GraphNode(
            id=n.id,
            title=n.title,
            is_pinned=n.is_pinned,
            tag_names=[t.name for t in n.tags],
            degree=degrees[n.id],
        )
        for n in notes
    ]

    edges = [
        GraphEdge(
            source_note_id=edge.source_note_id,
            target_note_id=edge.target_note_id,
        )
        for edge in raw_edges
    ]

    isolated_count = sum(1 for n in nodes if degrees[n.id] == 0)

    stats = GraphStats(
        node_count=len(nodes),
        edge_count=len(edges),
        isolated_count=isolated_count,
        truncated=False,
    )

    return GraphResponse(nodes=nodes, edges=edges, stats=stats)
