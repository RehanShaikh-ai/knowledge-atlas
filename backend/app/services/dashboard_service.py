"""Knowledge Dashboard service.

Canonical service per contract §4.3 and §9.
Provides factual, transparent workspace statistics.
"""

import uuid
from collections import defaultdict
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import WorkspaceNotFoundError
from app.models.note import Note
from app.models.note_link import NoteLink
from app.models.note_tag import NoteTag
from app.models.source import Source
from app.models.tag import Tag
from app.models.workspace import Workspace
from app.schemas.dashboard import ConnectedNote, DashboardResponse, TagDistributionItem


def get_workspace_dashboard(
    db: Session,
    workspace_id: uuid.UUID,
) -> DashboardResponse:
    """Return dashboard metrics for a workspace per contract §9."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError()

    # 1. Total active notes
    total_notes = (
        db.scalar(
            select(func.count(Note.id)).where(
                Note.workspace_id == workspace_id, Note.is_archived.is_(False)
            )
        )
        or 0
    )

    # 2. Total relationships
    # Count note links where source is in the workspace
    total_relationships = (
        db.scalar(
            select(func.count(NoteLink.source_note_id))
            .join(Note, Note.id == NoteLink.source_note_id)
            .where(Note.workspace_id == workspace_id, Note.is_archived.is_(False))
        )
        or 0
    )

    # 3. Total tags in workspace
    total_tags = db.scalar(select(func.count(Tag.id)).where(Tag.workspace_id == workspace_id)) or 0

    # 4. Total sources
    total_sources = (
        db.scalar(select(func.count(Source.id)).where(Source.workspace_id == workspace_id)) or 0
    )

    # 5. Notes created last 7 days
    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    notes_created_last_7_days = (
        db.scalar(
            select(func.count(Note.id)).where(
                Note.workspace_id == workspace_id,
                Note.is_archived.is_(False),
                Note.created_at >= seven_days_ago,
            )
        )
        or 0
    )

    # 6. Isolated notes and connectivity
    # Fetch all active notes in workspace
    active_notes = db.scalars(
        select(Note).where(Note.workspace_id == workspace_id, Note.is_archived.is_(False))
    ).all()

    active_note_ids = {n.id for n in active_notes}

    # Edges among active notes
    edges = (
        db.scalars(
            select(NoteLink).where(
                NoteLink.source_note_id.in_(active_note_ids),
                NoteLink.target_note_id.in_(active_note_ids),
            )
        ).all()
        if active_note_ids
        else []
    )

    degrees: dict[uuid.UUID, int] = defaultdict(int)
    for edge in edges:
        degrees[edge.source_note_id] += 1
        degrees[edge.target_note_id] += 1

    # Isolated notes count identically matches graph stats logic
    isolated_notes_count = sum(1 for n in active_notes if degrees[n.id] == 0)

    # Most connected notes: top 10 by degree desc, ties broken by updated_at desc
    sorted_notes = sorted(
        active_notes,
        key=lambda n: (degrees[n.id], n.updated_at),
        reverse=True,
    )
    most_connected_notes = [
        ConnectedNote(id=n.id, title=n.title, degree=degrees[n.id]) for n in sorted_notes[:10]
    ]

    # 7. Tag distribution: top 10 tags by note count descending
    tag_counts = db.execute(
        select(Tag.name, func.count(NoteTag.note_id).label("note_count"))
        .join(NoteTag, NoteTag.tag_id == Tag.id)
        .join(Note, Note.id == NoteTag.note_id)
        .where(
            Tag.workspace_id == workspace_id,
            Note.is_archived.is_(False),
        )
        .group_by(Tag.id, Tag.name)
        .order_by(func.count(NoteTag.note_id).desc(), Tag.name.asc())
        .limit(10)
    ).all()

    tag_distribution = [TagDistributionItem(tag=row[0], note_count=row[1]) for row in tag_counts]

    # 8. Import status summary
    status_counts = db.execute(
        select(Source.import_status, func.count(Source.id))
        .where(Source.workspace_id == workspace_id)
        .group_by(Source.import_status)
    ).all()
    import_status_summary = {row[0]: row[1] for row in status_counts}

    return DashboardResponse(
        total_notes=total_notes,
        total_relationships=total_relationships,
        total_tags=total_tags,
        total_sources=total_sources,
        notes_created_last_7_days=notes_created_last_7_days,
        isolated_notes_count=isolated_notes_count,
        most_connected_notes=most_connected_notes,
        tag_distribution=tag_distribution,
        import_status_summary=import_status_summary,
    )
