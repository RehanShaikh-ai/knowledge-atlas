"""Add progress to index_jobs.

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-25
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "index_jobs",
        sa.Column(
            "progress",
            JSONB().with_variant(SQLITE_JSON(), "sqlite"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("index_jobs", "progress")
