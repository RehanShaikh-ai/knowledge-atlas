"""GraphRelationship SQLAlchemy model.

Canonical model per CONTRACT v0.3.2 §5.1, §6.2.
Represents a directed relationship between two entities.
"""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.entity_chunk import EntityChunk
    from app.models.graph_entity import GraphEntity
    from app.models.workspace import Workspace


class GraphRelationship(Base):
    """A directed edge between two GraphEntity nodes."""

    __tablename__ = "graph_relationships"
    __table_args__ = (
        UniqueConstraint(
            "workspace_id",
            "source_entity_id",
            "target_entity_id",
            "relationship_type",
            name="uq_graph_relationships_workspace_src_tgt_type",
        ),
        Index("idx_relationships_workspace", "workspace_id"),
        Index("idx_relationships_source", "source_entity_id"),
        Index("idx_relationships_target", "target_entity_id"),
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
    source_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("graph_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("graph_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    relationship_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )
    is_manual: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
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
    source_entity: Mapped["GraphEntity"] = relationship(
        "GraphEntity",
        foreign_keys=[source_entity_id],
        back_populates="outgoing_relationships",
    )
    target_entity: Mapped["GraphEntity"] = relationship(
        "GraphEntity",
        foreign_keys=[target_entity_id],
        back_populates="incoming_relationships",
    )
    provenance_chunks: Mapped[list["EntityChunk"]] = relationship(
        "EntityChunk",
        back_populates="relationship",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
