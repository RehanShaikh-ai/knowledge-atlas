"""NoteClusterMember SQLAlchemy model.

Canonical model per CONTRACT v0.3.2 §5.1, §6.5.
Association model linking notes to clusters with a membership score.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.note import Note
    from app.models.note_cluster import NoteCluster


class NoteClusterMember(Base):
    """Association table linking a note to a NoteCluster."""

    __tablename__ = "note_cluster_members"
    __table_args__ = (Index("idx_cluster_members_note", "note_id"),)

    cluster_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("note_clusters.id", ondelete="CASCADE"),
        primary_key=True,
    )
    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        primary_key=True,
    )
    score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )

    # Relationships
    cluster: Mapped["NoteCluster"] = relationship("NoteCluster", back_populates="members")
    note: Mapped["Note"] = relationship("Note")
