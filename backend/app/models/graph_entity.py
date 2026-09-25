"""GraphEntity SQLAlchemy model.

Canonical model per CONTRACT v0.3.2 §5.1, §6.1.
Represents an entity/concept extracted from notes or created manually by a user.
"""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.entity_chunk import EntityChunk
    from app.models.graph_relationship import GraphRelationship
    from app.models.note_cluster import NoteCluster
    from app.models.workspace import Workspace

VALID_ENTITY_TYPES = (
    "concept",
    "person",
    "technology",
    "project",
    "place",
    "event",
    "unknown",
)


class GraphEntity(Base):
    """A named entity or concept in the workspace knowledge graph."""

    __tablename__ = "graph_entities"
    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_graph_entities_workspace_name"),
        CheckConstraint(
            "entity_type IN ('concept', 'person', 'technology', 'project', "
            "'place', 'event', 'unknown')",
            name="ck_graph_entities_entity_type",
        ),
        Index("idx_entities_workspace_name", "workspace_id", "name"),
        Index("idx_entities_workspace_type", "workspace_id", "entity_type"),
        Index("idx_entities_cluster", "cluster_id"),
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
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="concept",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    is_manual: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    cluster_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("note_clusters.id", ondelete="SET NULL"),
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
    cluster: Mapped["NoteCluster | None"] = relationship("NoteCluster", back_populates="entities")
    outgoing_relationships: Mapped[list["GraphRelationship"]] = relationship(
        "GraphRelationship",
        foreign_keys="[GraphRelationship.source_entity_id]",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    incoming_relationships: Mapped[list["GraphRelationship"]] = relationship(
        "GraphRelationship",
        foreign_keys="[GraphRelationship.target_entity_id]",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    chunks: Mapped[list["EntityChunk"]] = relationship(
        "EntityChunk",
        back_populates="entity",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
