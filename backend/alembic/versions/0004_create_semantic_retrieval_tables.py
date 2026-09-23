"""Create note_versions, note_chunks, index_jobs, and saved_searches tables.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-21

Contract references:
    CONTRACT_v0.3.1.md:
    §6.1  — note_versions model: fields, FK behavior, unique constraint
    §6.2  — note_chunks model: fields, FK behavior, Qdrant payload link
    §6.3  — index_jobs model: fields, status lifecycle, JSONB note_ids
    §6.4  — saved_searches model: fields
    §6.5  — Migration requirements: additive, reversible, no existing tables modified
    §6.6  — Required indexes (all five BTree indexes)
    §7.2  — note_chunks.id is used as chunk_id in Qdrant payloads
    §11.2 — Git versioning; note_versions.commit_hash = Git SHA-1

This migration:
    - Creates four new tables in dependency order
    - Creates all five required indexes (§6.6)
    - Does NOT modify any table from v0.1.x–v0.2.x (users, workspaces, notes,
      tags, note_tags, note_links, sources)
    - Is fully reversible: downgrade() drops all four tables in FK-safe order
"""

import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Create note_versions, note_chunks, index_jobs, and saved_searches tables.

    Creation order respects FK dependencies:
        note_versions → (notes, workspaces, users) — all pre-existing
        note_chunks   → (notes, note_versions, workspaces) — note_versions must exist first
        index_jobs    → (workspaces) — independent of versions/chunks
        saved_searches → (workspaces) — independent
    """

    # ── note_versions ──────────────────────────────────────────────────────────
    # Contract §6.1: snapshot of a note at a Git commit.
    # commit_hash is the Git SHA-1 (always 40 hex chars).
    # is_ai_edit distinguishes human vs AI-originated commits (§11.4).
    op.create_table(
        "note_versions",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "workspace_id",
            UUID(as_uuid=True),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("commit_hash", sa.String(length=40), nullable=False),
        sa.Column(
            "author_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column(
            "is_ai_edit",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        # Contract §6.1 constraint: a note cannot have two rows for the same commit.
        sa.UniqueConstraint("note_id", "commit_hash", name="uq_note_versions_note_commit"),
    )

    # ── note_chunks ────────────────────────────────────────────────────────────
    # Contract §6.2: a single text chunk of a versioned note.
    # id == chunk_id in the Qdrant payload (§7.2) — never a separate field.
    # content_hash enables idempotent reindexing: skip re-embedding if unchanged (§7.5).
    op.create_table(
        "note_chunks",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "version_id",
            UUID(as_uuid=True),
            sa.ForeignKey("note_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "workspace_id",
            UUID(as_uuid=True),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        # SHA-256 hex digest (64 chars) of content.
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=False),
        # Must match the model used when the embedding was generated.
        sa.Column("embedding_model", sa.String(length=100), nullable=False),
        # Must match the actual vector dimension stored in Qdrant (§7.4).
        sa.Column("embedding_dimension", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        # Contract §6.2 constraint: one chunk per index position per version.
        sa.UniqueConstraint("version_id", "chunk_index", name="uq_note_chunks_version_index"),
    )

    # ── index_jobs ─────────────────────────────────────────────────────────────
    # Contract §6.3: ARQ background job state persisted in PostgreSQL.
    # id also serves as the ARQ job key (§12.1).
    # note_ids JSONB is null for full-workspace reindex; list of UUIDs for targeted.
    # error_message must be sanitized — no paths or stack traces (§12.4).
    op.create_table(
        "index_jobs",
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
        sa.Column("job_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("note_ids", JSONB(), nullable=True),
        sa.Column(
            "retry_count",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "max_retries",
            sa.Integer(),
            server_default=sa.text("3"),
            nullable=False,
        ),
        sa.Column(
            "enqueued_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
    )

    # ── saved_searches ─────────────────────────────────────────────────────────
    # Contract §6.4: named search query belonging to a workspace.
    op.create_table(
        "saved_searches",
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
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("query", sa.String(length=500), nullable=False),
        sa.Column("search_mode", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # ── Indexes (Contract §6.6) ────────────────────────────────────────────────

    # idx_note_versions_note_id — version history listing ordered by creation time.
    # The DESC sort direction is expressed via sa.text() to pass through to DDL.
    op.create_index(
        "idx_note_versions_note_id",
        "note_versions",
        ["note_id", sa.text("created_at DESC")],
    )

    # idx_note_chunks_version_id — chunk lookup by version.
    op.create_index(
        "idx_note_chunks_version_id",
        "note_chunks",
        ["version_id"],
    )

    # idx_note_chunks_note_id — all chunks for a note (across all versions).
    op.create_index(
        "idx_note_chunks_note_id",
        "note_chunks",
        ["note_id"],
    )

    # idx_index_jobs_workspace_status — active job queries filtered by workspace + status.
    op.create_index(
        "idx_index_jobs_workspace_status",
        "index_jobs",
        ["workspace_id", "status"],
    )

    # idx_saved_searches_workspace — workspace listing of saved searches.
    op.create_index(
        "idx_saved_searches_workspace",
        "saved_searches",
        ["workspace_id"],
    )


def downgrade() -> None:
    """Drop all four v0.3.1 tables and their indexes in reverse FK-safe order.

    Order: note_chunks first (depends on note_versions), then note_versions,
    then index_jobs and saved_searches (both only depend on workspaces).

    Does NOT touch any v0.1.x–v0.2.x table.
    """
    # Drop note_chunks and its indexes first (depends on note_versions)
    op.drop_index("idx_note_chunks_note_id", table_name="note_chunks")
    op.drop_index("idx_note_chunks_version_id", table_name="note_chunks")
    op.drop_table("note_chunks")

    # Drop note_versions and its indexes
    op.drop_index("idx_note_versions_note_id", table_name="note_versions")
    op.drop_table("note_versions")

    # Drop index_jobs and its indexes
    op.drop_index("idx_index_jobs_workspace_status", table_name="index_jobs")
    op.drop_table("index_jobs")

    # Drop saved_searches and its indexes
    op.drop_index("idx_saved_searches_workspace", table_name="saved_searches")
    op.drop_table("saved_searches")
