"""NoteCluster SQLAlchemy model.

Canonical model per CONTRACT v0.3.2 §5.1, §6.4.
Represents an automatic or manually curated cluster of conceptually related notes and entities.
"""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.graph_entity import GraphEntity
    from app.models.note_cluster_member import NoteClusterMember
    from app.models.workspace import Workspace


class NoteCluster(Base):
    """A cluster grouping conceptually related notes and entities."""

    __tablename__ = "note_clusters"

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
    label: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace")
    members: Mapped[list["NoteClusterMember"]] = relationship(
        "NoteClusterMember",
        back_populates="cluster",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    entities: Mapped[list["GraphEntity"]] = relationship(
        "GraphEntity",
        back_populates="cluster",
    )
