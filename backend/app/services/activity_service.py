"""Workspace activity service.

Canonical service per CONTRACT v0.3.1 §5.3, §13.2.
Provides get_workspace_activity.
"""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import WorkspaceNotFoundError
from app.models.index_job import IndexJob
from app.models.note import Note
from app.models.note_version import NoteVersion
from app.models.source import Source
from app.models.workspace import Workspace
from app.schemas.activity import ActivityItem

logger = logging.getLogger("app.services.activity_service")


def get_workspace_activity(
    db: Session,
    workspace_id: uuid.UUID,
    limit: int = 50,
) -> tuple[list[ActivityItem], int]:
    """Assemble activity timeline for workspace per CONTRACT §13.2."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError("Workspace not found.")

    events: list[ActivityItem] = []

    # 1. Notes created / updated
    notes = list(
        db.scalars(
            select(Note)
            .where(Note.workspace_id == workspace_id)
            .order_by(Note.created_at.desc())
            .limit(limit)
        ).all()
    )
    for n in notes:
        events.append(
            ActivityItem(
                id=uuid.uuid5(uuid.NAMESPACE_DNS, f"created-{n.id}"),
                event_type="note_created",
                note_id=n.id,
                note_title=n.title,
                actor_id=n.created_by,
                metadata={"title": n.title},
                created_at=n.created_at,
            )
        )
        if n.updated_at and n.updated_at > n.created_at:
            events.append(
                ActivityItem(
                    id=uuid.uuid5(uuid.NAMESPACE_DNS, f"updated-{n.id}-{n.updated_at.isoformat()}"),
                    event_type="note_updated",
                    note_id=n.id,
                    note_title=n.title,
                    actor_id=n.created_by,
                    metadata={"title": n.title},
                    created_at=n.updated_at,
                )
            )

    # 2. Versions (snapshots / restores)
    versions = list(
        db.scalars(
            select(NoteVersion)
            .where(NoteVersion.workspace_id == workspace_id)
            .order_by(NoteVersion.created_at.desc())
            .limit(limit)
        ).all()
    )
    for v in versions:
        msg = v.message or ""
        event_type = "note_restored" if "Restore" in msg else "note_updated"
        events.append(
            ActivityItem(
                id=v.id,
                event_type=event_type,
                note_id=v.note_id,
                note_title=v.note.title if v.note else None,
                actor_id=v.author_id,
                metadata={
                    "commit_hash": v.commit_hash,
                    "is_ai_edit": v.is_ai_edit,
                    "message": v.message,
                },
                created_at=v.created_at,
            )
        )

    # 3. Sources imported
    sources = list(
        db.scalars(
            select(Source)
            .where(Source.workspace_id == workspace_id)
            .order_by(Source.imported_at.desc())
            .limit(limit)
        ).all()
    )
    for s in sources:
        events.append(
            ActivityItem(
                id=s.id,
                event_type="import_completed",
                note_id=s.note_id,
                note_title=s.original_path,
                actor_id=None,
                metadata={"source_type": s.source_type, "original_path": s.original_path},
                created_at=s.imported_at,
            )
        )

    # 4. Completed index jobs
    jobs = list(
        db.scalars(
            select(IndexJob)
            .where(IndexJob.workspace_id == workspace_id, IndexJob.status == "completed")
            .order_by(IndexJob.enqueued_at.desc())
            .limit(limit)
        ).all()
    )
    for j in jobs:
        events.append(
            ActivityItem(
                id=j.id,
                event_type="note_indexed",
                note_id=None,
                note_title=None,
                actor_id=None,
                metadata={"job_type": j.job_type, "status": j.status},
                created_at=j.completed_at or j.enqueued_at,
            )
        )

    # Sort descending by created_at
    events.sort(key=lambda e: e.created_at, reverse=True)
    return events[:limit], len(events)
