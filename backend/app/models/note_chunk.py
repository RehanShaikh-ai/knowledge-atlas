"""NoteChunk SQLAlchemy model.

Canonical model per CONTRACT v0.3.1 §5.1, §6.2.

Each row represents one chunk of a note at a specific version.
The chunk's UUID (id) is also used as chunk_id in the Qdrant payload (§7.2),
creating a stable join key between PostgreSQL metadata and Qdrant vectors.
"""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.note import Note
    from app.models.note_version import NoteVersion
    from app.models.workspace import Workspace


class NoteChunk(Base):
    """A single text chunk of a versioned note, with embedding metadata.

    Contract §6.2 fields:
        id: UUID primary key; also used as chunk_id in Qdrant payload (§7.2)
        note_id: FK → notes.id ON DELETE CASCADE
        version_id: FK → note_versions.id ON DELETE CASCADE
        workspace_id: UUID, denormalized; FK → workspaces.id ON DELETE CASCADE
        chunk_index: Integer, 0-based position within the note
        content: Text, raw chunk text
        content_hash: String(64), SHA-256 hex digest of content (used for idempotent reindex §7.5)
        token_count: Integer, tokens at time of chunking
        embedding_model: String(100), model identifier e.g. "BAAI/bge-small-en-v1.5"
        embedding_dimension: Integer, must match vector dimension in Qdrant (§7.4)
        created_at: DateTime(UTC), immutable

    Constraint: unique on (version_id, chunk_index).
    """

    __tablename__ = "note_chunks"
    __table_args__ = (
        UniqueConstraint("version_id", "chunk_index", name="uq_note_chunks_version_index"),
    )

    # This UUID doubles as the Qdrant point ID — never generate a separate identifier.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("note_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    # 0-based ordering within the note (contract §8.1 order-preserving requirement).
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    # Raw chunk text (not stored in Qdrant, only metadata there per §7.2).
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    # SHA-256 hex digest used for idempotent reindexing (§7.5): skip re-embedding
    # if hash matches what is already indexed.
    content_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    token_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    # Must match EMBEDDING_MODEL env var and the model field in Qdrant payload (§7.2).
    embedding_model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    # Must match EMBEDDING_DIMENSION and the actual vector dimension in Qdrant (§7.4).
    embedding_dimension: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    note: Mapped["Note"] = relationship("Note")
    version: Mapped["NoteVersion"] = relationship("NoteVersion", back_populates="chunks")
    workspace: Mapped["Workspace"] = relationship("Workspace")
