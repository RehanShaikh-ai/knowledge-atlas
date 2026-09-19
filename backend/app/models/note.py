"""Note SQLAlchemy model.

Canonical model per contract §5.1.
"""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Computed, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.note_link import NoteLink
    from app.models.tag import Tag
    from app.models.user import User
    from app.models.workspace import Workspace


@compiles(Computed, "sqlite")
def _compile_computed_sqlite(element: Computed, compiler: Any, **kw: Any) -> str:
    """Override DDL compilation for Computed columns on SQLite dialect.

    PostgreSQL full-text search functions like `to_tsvector` are not available in SQLite.
    Replacing PostgreSQL-specific functions allows SQLite in-memory unit test tables
    to compile without errors while leaving PostgreSQL DDL unchanged.
    """
    sql = str(element.sqltext)
    if "to_tsvector" in sql:
        sql = "coalesce(title, '') || ' ' || coalesce(content, '')"
    return f"GENERATED ALWAYS AS ({sql}) STORED"


class Note(Base):
    """Note database model.

    Contract §5.1:
        id: UUID primary key (SQLAlchemy-generated)
        workspace_id: UUID foreign key -> workspaces.id with ON DELETE CASCADE
        created_by: UUID foreign key -> users.id with ON DELETE RESTRICT
        title: String(255), required
        content: Text, required (raw Markdown source)
        created_at: DateTime(UTC), immutable
        updated_at: DateTime(UTC), updated on edit
        is_pinned: Boolean, default False
        is_archived: Boolean, default False
    """

    __tablename__ = "notes"

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
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
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
    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    search_vector: Mapped[str | None] = mapped_column(
        TSVECTOR().with_variant(Text(), "sqlite"),
        Computed(
            "to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))",
            persisted=True,
        ),
        nullable=True,
    )

    workspace: Mapped["Workspace"] = relationship("Workspace")
    creator: Mapped["User"] = relationship("User")
    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        secondary="note_tags",
        back_populates="notes",
    )
    outgoing_links: Mapped[list["NoteLink"]] = relationship(
        "NoteLink",
        foreign_keys="NoteLink.source_note_id",
        back_populates="source_note",
        passive_deletes=True,
    )
    incoming_links: Mapped[list["NoteLink"]] = relationship(
        "NoteLink",
        foreign_keys="NoteLink.target_note_id",
        back_populates="target_note",
        passive_deletes=True,
    )
