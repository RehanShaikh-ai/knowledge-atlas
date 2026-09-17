"""create users and workspaces tables

Revision ID: 0001
Revises:
Create Date: 2026-09-17 00:00:00.000000

Contract references:
    §7.1  — User model fields
    §8.1  — Workspace model fields
    §9.1  — workspaces.owner_id FK → users.id ON DELETE RESTRICT
    §19   — Migration requirements
    §19.1 — Migration must be reversible
"""

import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Create users and workspaces tables.

    Order matters: users must exist before the FK in workspaces can be created.
    """
    # ── users ──────────────────────────────────────────────────────────────────
    # Contract §7.1: id (UUID PK, SQLAlchemy-generated), display_name (String),
    # created_at (DateTime), updated_at (DateTime)
    op.create_table(
        "users",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column("display_name", sa.String(length=100), nullable=False),
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

    # ── workspaces ─────────────────────────────────────────────────────────────
    # Contract §8.1: id, name (String), description (String, nullable),
    # owner_id (FK → users.id ON DELETE RESTRICT), created_at, updated_at
    op.create_table(
        "workspaces",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column(
            "owner_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
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
    )


def downgrade() -> None:
    """Drop workspaces and users tables in reverse dependency order.

    Contract §19.1: downgrade() must fully reverse upgrade().
    workspaces must be dropped before users due to the FK constraint.
    """
    op.drop_table("workspaces")
    op.drop_table("users")
