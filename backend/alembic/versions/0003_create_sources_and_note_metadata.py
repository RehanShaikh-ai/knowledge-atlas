"""Create source provenance storage and add nullable note metadata.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add v0.2.2 source provenance without altering existing data."""
    op.add_column("notes", sa.Column("metadata", JSONB(), nullable=True))

    op.create_table(
        "sources",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "workspace_id",
            UUID(as_uuid=True),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("source_type", sa.String(length=30), nullable=False),
        sa.Column("original_path", sa.String(length=500), nullable=False),
        sa.Column("source_identifier", sa.String(length=500), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("import_batch_id", UUID(as_uuid=True), nullable=False),
        sa.Column("import_status", sa.String(length=20), nullable=False),
        sa.Column("raw_metadata", JSONB(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "imported_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "source_type IN ('markdown', 'text', 'pdf', 'obsidian_vault', 'obsidian_note')",
            name="ck_sources_source_type",
        ),
        sa.CheckConstraint(
            "import_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')",
            name="ck_sources_import_status",
        ),
    )
    op.create_index(
        "idx_sources_workspace_identifier",
        "sources",
        ["workspace_id", "source_identifier"],
        unique=True,
    )
    op.create_index("idx_sources_workspace_batch", "sources", ["workspace_id", "import_batch_id"])
    op.create_index("idx_sources_note_id", "sources", ["note_id"])


def downgrade() -> None:
    """Remove only the additive v0.2.2 schema objects."""
    op.drop_index("idx_sources_note_id", table_name="sources")
    op.drop_index("idx_sources_workspace_batch", table_name="sources")
    op.drop_index("idx_sources_workspace_identifier", table_name="sources")
    op.drop_table("sources")
    op.drop_column("notes", "metadata")
