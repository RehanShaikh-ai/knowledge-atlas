"""LinkSuggestion SQLAlchemy model.

Canonical model per CONTRACT v0.3.2 §5.1, §6.6.
Represents an AI-suggested link between two notes awaiting user approval.
"""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.note import Note
    from app.models.workspace import Workspace


class LinkSuggestion(Base):
    """An AI-suggested note-to-note link."""

    __tablename__ = "link_suggestions"
    __table_args__ = (
        UniqueConstraint(
            "workspace_id",
            "source_note_id",
            "target_note_id",
            name="uq_link_suggestions_workspace_source_target",
        ),
        Index("idx_link_suggestions_workspace_status", "workspace_id", "status"),
        Index("idx_link_suggestions_source", "source_note_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )
    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    # "pending", "accepted", "rejected"
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
    )
    shared_entity_ids: Mapped[list[Any] | None] = mapped_column(
        JSONB().with_variant(SQLITE_JSON(), "sqlite"),
        nullable=True,
        default=None,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace")
    source_note: Mapped["Note"] = relationship("Note", foreign_keys=[source_note_id])
    target_note: Mapped["Note"] = relationship("Note", foreign_keys=[target_note_id])
