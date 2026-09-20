"""create notes, tags, note_tags, and note_links tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-18 00:00:00.000000

Contract references:
    CONTRACT_v0.2.1.md:
    §5.1  — Note model fields and constraints
    §6.1  — Tag model fields and constraints
    §6.2  — NoteTag model fields and constraints
    §7.1  — NoteLink model fields and constraints
    §8    — Database relationship contract (CASCADE / RESTRICT)
    §10.1 — Search vector generated column and GIN index
    §11   — Database migration contract
    §12   — Database indexes contract
"""

import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Create notes, tags, note_tags, and note_links tables and indexes."""
    # ── notes ──────────────────────────────────────────────────────────────────
    # Contract §5.1 & §10.1: id, workspace_id, created_by, title, content,
    # created_at, updated_at, is_pinned, is_archived, search_vector (generated tsvector)
    op.create_table(
        "notes",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "workspace_id",
            UUID(as_uuid=True),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_by",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "is_pinned",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "is_archived",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "search_vector",
            TSVECTOR,
            sa.Computed(
                "to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))",
                persisted=True,
            ),
            nullable=True,
        ),
    )

    # ── tags ───────────────────────────────────────────────────────────────────
    # Contract §6.1: id, workspace_id, name, unique constraint on (workspace_id, name)
    op.create_table(
        "tags",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "workspace_id",
            UUID(as_uuid=True),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.UniqueConstraint("workspace_id", "name", name="uq_tags_workspace_name"),
    )

    # ── note_tags ──────────────────────────────────────────────────────────────
    # Contract §6.2: note_id, tag_id (composite PK)
    op.create_table(
        "note_tags",
        sa.Column(
            "note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "tag_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
    )

    # ── note_links ─────────────────────────────────────────────────────────────
    # Contract §7.1: source_note_id, target_note_id (composite PK), created_at
    op.create_table(
        "note_links",
        sa.Column(
            "source_note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "target_note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # ── Indexes ────────────────────────────────────────────────────────────────
    # Contract §12: required indexes for query patterns
    op.create_index(
        "idx_notes_workspace_updated",
        "notes",
        ["workspace_id", sa.text("updated_at DESC")],
    )
    op.create_index(
        "idx_notes_workspace_created",
        "notes",
        ["workspace_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "idx_notes_workspace_pinned",
        "notes",
        ["workspace_id", "is_pinned"],
    )
    op.create_index(
        "idx_notes_workspace_archived",
        "notes",
        ["workspace_id", "is_archived"],
    )
    op.create_index(
        "idx_notes_search",
        "notes",
        ["search_vector"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_tags_workspace_name",
        "tags",
        ["workspace_id", "name"],
        unique=True,
    )
    op.create_index(
        "idx_note_tags_tag_id",
        "note_tags",
        ["tag_id"],
    )
    op.create_index(
        "idx_note_links_target",
        "note_links",
        ["target_note_id"],
    )


def downgrade() -> None:
    """Drop note_links, note_tags, tags, and notes tables in reverse dependency order."""
    op.drop_index("idx_note_links_target", table_name="note_links")
    op.drop_table("note_links")

    op.drop_index("idx_note_tags_tag_id", table_name="note_tags")
    op.drop_table("note_tags")

    op.drop_index("idx_tags_workspace_name", table_name="tags")
    op.drop_table("tags")

    op.drop_index("idx_notes_search", table_name="notes", postgresql_using="gin")
    op.drop_index("idx_notes_workspace_archived", table_name="notes")
    op.drop_index("idx_notes_workspace_pinned", table_name="notes")
    op.drop_index("idx_notes_workspace_created", table_name="notes")
    op.drop_index("idx_notes_workspace_updated", table_name="notes")
    op.drop_table("notes")
