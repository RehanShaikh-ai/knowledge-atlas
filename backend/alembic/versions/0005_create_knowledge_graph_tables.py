"""Create knowledge graph and GraphRAG tables.

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-24

Contract references:
    CONTRACT_v0.3.2.md:
    §6.1  — graph_entities model: fields, FK behavior, entity_type check constraint
    §6.2  — graph_relationships model: fields, FK behavior, unique constraint
    §6.3  — entity_chunks model (provenance): fields, FK behavior, unique constraint
    §6.4  — note_clusters model: fields, FK behavior
    §6.5  — note_cluster_members model: composite PK, FK behavior
    §6.6  — link_suggestions model: fields, status check constraint, unique constraint
    §6.7  — Required indexes (all twelve BTree indexes)
    §6.8  — Migration requirements: additive, reversible, no existing tables modified
    §7    — Qdrant payload extension: handled at service layer

This migration:
    - Creates six new tables in FK dependency order
    - Creates all twelve required indexes (§6.7)
    - Does NOT modify any table from v0.1.x–v0.3.1
    - Is fully reversible: downgrade() drops all six tables in FK-safe order
"""

import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Create knowledge graph tables, constraints, and indexes.

    Creation order respects FK dependencies:
        1. note_clusters         → (workspaces)
        2. graph_entities        → (workspaces, note_clusters [SET NULL])
        3. graph_relationships   → (workspaces, graph_entities)
        4. entity_chunks         → (graph_entities, note_chunks, graph_relationships,
                                    notes, workspaces)
        5. note_cluster_members  → (note_clusters, notes)
        6. link_suggestions      → (workspaces, notes)
    """

    # ── 1. note_clusters ───────────────────────────────────────────────────────
    # Contract §6.4: semantic clusters of notes and entities.
    op.create_table(
        "note_clusters",
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
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
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
    )

    # ── 2. graph_entities ──────────────────────────────────────────────────────
    # Contract §6.1: extracted concepts, people, tech, etc.
    op.create_table(
        "graph_entities",
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
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "is_manual",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "cluster_id",
            UUID(as_uuid=True),
            sa.ForeignKey("note_clusters.id", ondelete="SET NULL"),
            nullable=True,
        ),
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
        # Contract §6.1: unique entity name per workspace
        sa.UniqueConstraint("workspace_id", "name", name="uq_graph_entities_workspace_name"),
        # Contract §6.1: entity_type check constraint
        sa.CheckConstraint(
            "entity_type IN ("
            "'concept', 'person', 'technology', 'project', 'place', 'event', 'unknown'"
            ")",
            name="ck_graph_entities_entity_type",
        ),
    )

    # ── 3. graph_relationships ─────────────────────────────────────────────────
    # Contract §6.2: typed relationships between entities.
    op.create_table(
        "graph_relationships",
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
            "source_entity_id",
            UUID(as_uuid=True),
            sa.ForeignKey("graph_entities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "target_entity_id",
            UUID(as_uuid=True),
            sa.ForeignKey("graph_entities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("relationship_type", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "confidence",
            sa.Float(),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
        sa.Column(
            "is_manual",
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
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        # Contract §6.2: unique (workspace_id, source, target, relationship_type)
        sa.UniqueConstraint(
            "workspace_id",
            "source_entity_id",
            "target_entity_id",
            "relationship_type",
            name="uq_graph_relationships_workspace_src_tgt_type",
        ),
    )

    # ── 4. entity_chunks (Provenance) ──────────────────────────────────────────
    # Contract §6.3: maps extracted entities & relationships back to source chunks/notes.
    op.create_table(
        "entity_chunks",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "entity_id",
            UUID(as_uuid=True),
            sa.ForeignKey("graph_entities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "chunk_id",
            UUID(as_uuid=True),
            sa.ForeignKey("note_chunks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "relationship_id",
            UUID(as_uuid=True),
            sa.ForeignKey("graph_relationships.id", ondelete="CASCADE"),
            nullable=True,
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
        sa.Column("extraction_model", sa.String(length=100), nullable=False),
        sa.Column(
            "confidence",
            sa.Float(),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        # Contract §6.3: unique on (entity_id, chunk_id)
        sa.UniqueConstraint("entity_id", "chunk_id", name="uq_entity_chunks_entity_chunk"),
    )

    # ── 5. note_cluster_members (Association) ──────────────────────────────────
    # Contract §6.5: membership association table with composite PK.
    op.create_table(
        "note_cluster_members",
        sa.Column(
            "cluster_id",
            UUID(as_uuid=True),
            sa.ForeignKey("note_clusters.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "score",
            sa.Float(),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
    )

    # ── 6. link_suggestions ───────────────────────────────────────────────────
    # Contract §6.6: suggested note-to-note links awaiting user approval.
    op.create_table(
        "link_suggestions",
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
            "source_note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "target_note_id",
            UUID(as_uuid=True),
            sa.ForeignKey("notes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "confidence",
            sa.Float(),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            server_default=sa.text("'pending'"),
            nullable=False,
        ),
        sa.Column("shared_entity_ids", JSONB, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        # Contract §6.6: unique per (workspace_id, source_note_id, target_note_id)
        sa.UniqueConstraint(
            "workspace_id",
            "source_note_id",
            "target_note_id",
            name="uq_link_suggestions_workspace_source_target",
        ),
        # Contract §6.6: status check constraint
        sa.CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name="ck_link_suggestions_status",
        ),
    )

    # ── Required Indexes (§6.7) ────────────────────────────────────────────────
    op.create_index(
        "idx_entities_workspace_name",
        "graph_entities",
        ["workspace_id", "name"],
        unique=False,
    )
    op.create_index(
        "idx_entities_workspace_type",
        "graph_entities",
        ["workspace_id", "entity_type"],
        unique=False,
    )
    op.create_index(
        "idx_entities_cluster",
        "graph_entities",
        ["cluster_id"],
        unique=False,
    )
    op.create_index(
        "idx_relationships_workspace",
        "graph_relationships",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "idx_relationships_source",
        "graph_relationships",
        ["source_entity_id"],
        unique=False,
    )
    op.create_index(
        "idx_relationships_target",
        "graph_relationships",
        ["target_entity_id"],
        unique=False,
    )
    op.create_index(
        "idx_entity_chunks_entity",
        "entity_chunks",
        ["entity_id"],
        unique=False,
    )
    op.create_index(
        "idx_entity_chunks_chunk",
        "entity_chunks",
        ["chunk_id"],
        unique=False,
    )
    op.create_index(
        "idx_entity_chunks_note",
        "entity_chunks",
        ["note_id"],
        unique=False,
    )
    op.create_index(
        "idx_cluster_members_note",
        "note_cluster_members",
        ["note_id"],
        unique=False,
    )
    op.create_index(
        "idx_link_suggestions_workspace_status",
        "link_suggestions",
        ["workspace_id", "status"],
        unique=False,
    )
    op.create_index(
        "idx_link_suggestions_source",
        "link_suggestions",
        ["source_note_id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop all six knowledge graph tables in reverse FK dependency order."""
    op.drop_index("idx_link_suggestions_source", table_name="link_suggestions")
    op.drop_index("idx_link_suggestions_workspace_status", table_name="link_suggestions")
    op.drop_table("link_suggestions")

    op.drop_index("idx_cluster_members_note", table_name="note_cluster_members")
    op.drop_table("note_cluster_members")

    op.drop_index("idx_entity_chunks_note", table_name="entity_chunks")
    op.drop_index("idx_entity_chunks_chunk", table_name="entity_chunks")
    op.drop_index("idx_entity_chunks_entity", table_name="entity_chunks")
    op.drop_table("entity_chunks")

    op.drop_index("idx_relationships_target", table_name="graph_relationships")
    op.drop_index("idx_relationships_source", table_name="graph_relationships")
    op.drop_index("idx_relationships_workspace", table_name="graph_relationships")
    op.drop_table("graph_relationships")

    op.drop_index("idx_entities_cluster", table_name="graph_entities")
    op.drop_index("idx_entities_workspace_type", table_name="graph_entities")
    op.drop_index("idx_entities_workspace_name", table_name="graph_entities")
    op.drop_table("graph_entities")

    op.drop_table("note_clusters")
