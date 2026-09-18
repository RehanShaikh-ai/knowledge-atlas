"""Integration tests: Alembic migrations and database schema validation.

Contract references:
    §19   — Migration requirements
    §19.1 — Migration must be reversible (working downgrade)
    §22.3 — Integration tests: PostgreSQL starts, migrations run, schema correct
    §6    — UUID identifiers
    §9.1  — workspaces.owner_id FK → users.id ON DELETE RESTRICT

These tests use Testcontainers to spin up a real PostgreSQL 16 instance so they
run identically in CI and locally without any pre-existing database.

Implementation note on alembic/env.py URL resolution
─────────────────────────────────────────────────────
env.py builds the connection URL from `settings` (a module-level singleton).
The singleton is already instantiated when pytest starts, so
cfg.set_main_option("sqlalchemy.url", ...) alone is not enough — env.py ignores
that option and calls get_database_url() which reads `settings`.

The workaround used here: patch `settings.DATABASE_URL` on the already-
instantiated object before calling alembic_command.*  This causes
get_database_url() → settings.DATABASE_URL branch to return our test URL.
"""

import os
import sys
import uuid

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError

# Ensure backend package is importable before alembic imports
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from alembic import command as alembic_command  # noqa: E402
from alembic.config import Config  # noqa: E402

try:
    from testcontainers.community.postgres import PostgresContainer  # noqa: E402
except ImportError:
    from testcontainers.postgres import PostgresContainer  # noqa: E402


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_alembic_cfg(db_url: str) -> Config:
    """Return an Alembic Config pointed at the test DB URL.

    Also patches the settings singleton so env.py's get_database_url() returns
    the test URL rather than the default 'postgres' hostname.
    """
    try:
        from app.core.config import settings

        # Temporarily override the DATABASE_URL property on the live singleton
        object.__setattr__(settings, "DATABASE_URL", db_url)
    except Exception:
        # If settings is not importable (shouldn't happen), fall back to env var
        os.environ["DATABASE_URL"] = db_url

    alembic_ini = os.path.join(BACKEND_DIR, "alembic.ini")
    cfg = Config(alembic_ini)
    cfg.set_main_option("sqlalchemy.url", db_url)
    return cfg


def _alembic_upgrade(db_url: str) -> None:
    cfg = _make_alembic_cfg(db_url)
    alembic_command.upgrade(cfg, "head")


def _alembic_downgrade(db_url: str, target: str = "base") -> None:
    cfg = _make_alembic_cfg(db_url)
    alembic_command.downgrade(cfg, target)


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture(scope="module")
def postgres_container():
    """Spin up an isolated PostgreSQL 16 container for the entire module."""
    with PostgresContainer("postgres:16-alpine") as pg:
        yield pg


@pytest.fixture(scope="module")
def db_url(postgres_container):
    """Return the psycopg-driver URL for the test container."""
    host = postgres_container.get_container_host_ip()
    port = postgres_container.get_exposed_port(5432)
    user = postgres_container.username
    password = postgres_container.password
    dbname = postgres_container.dbname
    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{dbname}"


@pytest.fixture(scope="module")
def migrated_engine(db_url):
    """Run alembic upgrade head against the test container, return engine."""
    _alembic_upgrade(db_url)
    engine = create_engine(db_url)
    yield engine
    engine.dispose()


# ── Test 1: PostgreSQL starts successfully ────────────────────────────────────


def test_postgresql_starts_successfully(db_url):
    """Contract §22.3 #1 — PostgreSQL starts and accepts connections."""
    engine = create_engine(db_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        assert result.scalar() == 1
    engine.dispose()


# ── Test 2: Migrations run successfully ───────────────────────────────────────


def test_migrations_run_successfully(migrated_engine):
    """Contract §22.3 #2 — alembic upgrade head completes without error."""
    # migrated_engine fixture already ran the migration; reaching here means success.
    with migrated_engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        assert result.scalar() == 1


# ── Test 3 & 4: Schema correctness ────────────────────────────────────────────


def test_users_table_exists_with_correct_columns(migrated_engine):
    """Contract §7.1, §19 — users table has all required columns."""
    inspector = inspect(migrated_engine)
    tables = inspector.get_table_names()
    assert "users" in tables, "users table must exist after migration"

    cols = {c["name"]: c for c in inspector.get_columns("users")}
    assert "id" in cols, "users.id must exist"
    assert "display_name" in cols, "users.display_name must exist"
    assert "created_at" in cols, "users.created_at must exist"
    assert "updated_at" in cols, "users.updated_at must exist"

    # display_name must have length constraint (contract §7.2)
    assert cols["display_name"]["type"].length == 100

    # id must be primary key
    pk = inspector.get_pk_constraint("users")
    assert "id" in pk["constrained_columns"]


def test_workspaces_table_exists_with_correct_columns(migrated_engine):
    """Contract §8.1, §19 — workspaces table has all required columns."""
    inspector = inspect(migrated_engine)
    tables = inspector.get_table_names()
    assert "workspaces" in tables, "workspaces table must exist after migration"

    cols = {c["name"]: c for c in inspector.get_columns("workspaces")}
    assert "id" in cols, "workspaces.id must exist"
    assert "name" in cols, "workspaces.name must exist"
    assert "description" in cols, "workspaces.description must exist"
    assert "owner_id" in cols, "workspaces.owner_id must exist"
    assert "created_at" in cols, "workspaces.created_at must exist"
    assert "updated_at" in cols, "workspaces.updated_at must exist"

    # name must have length constraint (contract §8.2)
    assert cols["name"]["type"].length == 150
    # description is optional/nullable (contract §8.2)
    assert cols["description"]["nullable"] is True
    # owner_id must not be nullable (contract §8.2)
    assert cols["owner_id"]["nullable"] is False


# ── Test 5: Foreign key constraint ────────────────────────────────────────────


def test_owner_id_foreign_key_references_users(migrated_engine):
    """Contract §9.1 — workspaces.owner_id FK points to users.id."""
    inspector = inspect(migrated_engine)
    fks = inspector.get_foreign_keys("workspaces")
    assert len(fks) >= 1, "workspaces must have at least one FK"
    fk = next((f for f in fks if "owner_id" in f["constrained_columns"]), None)
    assert fk is not None, "FK on owner_id must exist"
    assert fk["referred_table"] == "users"
    assert "id" in fk["referred_columns"]


def test_owner_id_fk_on_delete_restrict(migrated_engine):
    """Contract §9.1 — FK must use ON DELETE RESTRICT.

    Verified by inserting a user+workspace then attempting to delete the user;
    the database must raise an IntegrityError.
    """
    user_id = uuid.uuid4()

    with migrated_engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO users (id, display_name, created_at, updated_at) "
                "VALUES (:id, :name, now(), now())"
            ),
            {"id": str(user_id), "name": "FK Test User"},
        )
        conn.execute(
            text(
                "INSERT INTO workspaces (id, name, owner_id, created_at, updated_at) "
                "VALUES (:id, :name, :owner_id, now(), now())"
            ),
            {"id": str(uuid.uuid4()), "name": "FK Test WS", "owner_id": str(user_id)},
        )

    # Attempting to delete the user must be rejected by RESTRICT
    with pytest.raises(IntegrityError):
        with migrated_engine.begin() as conn:
            conn.execute(
                text("DELETE FROM users WHERE id = :id"),
                {"id": str(user_id)},
            )


# ── Test 6: v0.2.1 Schema & Table Validations ─────────────────────────────────


def test_notes_table_exists_with_correct_columns_and_constraints(migrated_engine):
    """CONTRACT_v0.2.1.md §5.1, §8, §10.1 — notes table columns and constraints."""
    inspector = inspect(migrated_engine)
    tables = inspector.get_table_names()
    assert "notes" in tables, "notes table must exist after migration 0002"

    cols = {c["name"]: c for c in inspector.get_columns("notes")}
    assert "id" in cols
    assert "workspace_id" in cols
    assert "created_by" in cols
    assert "title" in cols
    assert "content" in cols
    assert "created_at" in cols
    assert "updated_at" in cols
    assert "is_pinned" in cols
    assert "is_archived" in cols
    assert "search_vector" in cols

    assert cols["title"]["type"].length == 255
    assert cols["workspace_id"]["nullable"] is False
    assert cols["created_by"]["nullable"] is False

    pk = inspector.get_pk_constraint("notes")
    assert "id" in pk["constrained_columns"]

    fks = inspector.get_foreign_keys("notes")
    ws_fk = next((f for f in fks if "workspace_id" in f["constrained_columns"]), None)
    assert ws_fk is not None
    assert ws_fk["referred_table"] == "workspaces"

    user_fk = next((f for f in fks if "created_by" in f["constrained_columns"]), None)
    assert user_fk is not None
    assert user_fk["referred_table"] == "users"


def test_tags_table_exists_with_correct_columns_and_constraints(migrated_engine):
    """CONTRACT_v0.2.1.md §6.1 — tags table columns and unique constraint."""
    inspector = inspect(migrated_engine)
    tables = inspector.get_table_names()
    assert "tags" in tables, "tags table must exist after migration 0002"

    cols = {c["name"]: c for c in inspector.get_columns("tags")}
    assert "id" in cols
    assert "workspace_id" in cols
    assert "name" in cols
    assert cols["name"]["type"].length == 50

    fks = inspector.get_foreign_keys("tags")
    ws_fk = next((f for f in fks if "workspace_id" in f["constrained_columns"]), None)
    assert ws_fk is not None
    assert ws_fk["referred_table"] == "workspaces"


def test_note_tags_table_exists_with_composite_pk(migrated_engine):
    """CONTRACT_v0.2.1.md §6.2 — note_tags association table."""
    inspector = inspect(migrated_engine)
    tables = inspector.get_table_names()
    assert "note_tags" in tables, "note_tags table must exist after migration 0002"

    cols = {c["name"]: c for c in inspector.get_columns("note_tags")}
    assert "note_id" in cols
    assert "tag_id" in cols

    pk = inspector.get_pk_constraint("note_tags")
    assert set(pk["constrained_columns"]) == {"note_id", "tag_id"}


def test_note_links_table_exists_with_composite_pk(migrated_engine):
    """CONTRACT_v0.2.1.md §7.1 — note_links table."""
    inspector = inspect(migrated_engine)
    tables = inspector.get_table_names()
    assert "note_links" in tables, "note_links table must exist after migration 0002"

    cols = {c["name"]: c for c in inspector.get_columns("note_links")}
    assert "source_note_id" in cols
    assert "target_note_id" in cols
    assert "created_at" in cols

    pk = inspector.get_pk_constraint("note_links")
    assert set(pk["constrained_columns"]) == {"source_note_id", "target_note_id"}


def test_v0_2_1_indexes_exist(migrated_engine):
    """CONTRACT_v0.2.1.md §12 — indexes on notes, tags, note_tags, note_links."""
    inspector = inspect(migrated_engine)

    note_indexes = {idx["name"] for idx in inspector.get_indexes("notes")}
    assert "idx_notes_workspace_updated" in note_indexes
    assert "idx_notes_workspace_created" in note_indexes
    assert "idx_notes_workspace_pinned" in note_indexes
    assert "idx_notes_workspace_archived" in note_indexes
    assert "idx_notes_search" in note_indexes

    tag_indexes = {idx["name"] for idx in inspector.get_indexes("tags")}
    assert "idx_tags_workspace_name" in tag_indexes

    note_tag_indexes = {idx["name"] for idx in inspector.get_indexes("note_tags")}
    assert "idx_note_tags_tag_id" in note_tag_indexes

    note_link_indexes = {idx["name"] for idx in inspector.get_indexes("note_links")}
    assert "idx_note_links_target" in note_link_indexes


def test_v0_2_1_foreign_key_cascades(migrated_engine):
    """CONTRACT_v0.2.1.md §8 — verify CASCADE deletions on workspace and note deletion."""
    user_id = uuid.uuid4()
    workspace_id = uuid.uuid4()
    note1_id = uuid.uuid4()
    note2_id = uuid.uuid4()
    tag_id = uuid.uuid4()

    with migrated_engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO users (id, display_name, created_at, updated_at) "
                "VALUES (:id, :name, now(), now())"
            ),
            {"id": str(user_id), "name": "Cascade User"},
        )
        conn.execute(
            text(
                "INSERT INTO workspaces (id, name, owner_id, created_at, updated_at) "
                "VALUES (:id, :name, :owner_id, now(), now())"
            ),
            {"id": str(workspace_id), "name": "Cascade WS", "owner_id": str(user_id)},
        )
        conn.execute(
            text(
                "INSERT INTO notes (id, workspace_id, created_by, title, content, "
                "created_at, updated_at) "
                "VALUES (:id, :ws_id, :user_id, 'Note 1', 'Content 1', now(), now())"
            ),
            {"id": str(note1_id), "ws_id": str(workspace_id), "user_id": str(user_id)},
        )
        conn.execute(
            text(
                "INSERT INTO notes (id, workspace_id, created_by, title, content, "
                "created_at, updated_at) "
                "VALUES (:id, :ws_id, :user_id, 'Note 2', 'Content 2', now(), now())"
            ),
            {"id": str(note2_id), "ws_id": str(workspace_id), "user_id": str(user_id)},
        )
        conn.execute(
            text("INSERT INTO tags (id, workspace_id, name) VALUES (:id, :ws_id, 'ml')"),
            {"id": str(tag_id), "ws_id": str(workspace_id)},
        )
        conn.execute(
            text("INSERT INTO note_tags (note_id, tag_id) VALUES (:note_id, :tag_id)"),
            {"note_id": str(note1_id), "tag_id": str(tag_id)},
        )
        conn.execute(
            text(
                "INSERT INTO note_links (source_note_id, target_note_id, created_at) "
                "VALUES (:src, :tgt, now())"
            ),
            {"src": str(note1_id), "tgt": str(note2_id)},
        )

    # Deleting note1 should cascade to note_tags and note_links
    with migrated_engine.begin() as conn:
        conn.execute(text("DELETE FROM notes WHERE id = :id"), {"id": str(note1_id)})

    with migrated_engine.connect() as conn:
        nt_count = conn.execute(
            text("SELECT count(*) FROM note_tags WHERE note_id = :id"),
            {"id": str(note1_id)},
        ).scalar()
        nl_count = conn.execute(
            text(
                "SELECT count(*) FROM note_links WHERE source_note_id = :id OR target_note_id = :id"
            ),
            {"id": str(note1_id)},
        ).scalar()
        assert nt_count == 0, "note_tags row must be deleted on note deletion"
        assert nl_count == 0, "note_links row must be deleted on note deletion"

    # Deleting workspace should cascade to remaining notes and tags
    with migrated_engine.begin() as conn:
        conn.execute(text("DELETE FROM workspaces WHERE id = :id"), {"id": str(workspace_id)})

    with migrated_engine.connect() as conn:
        notes_rem = conn.execute(
            text("SELECT count(*) FROM notes WHERE workspace_id = :id"),
            {"id": str(workspace_id)},
        ).scalar()
        tags_rem = conn.execute(
            text("SELECT count(*) FROM tags WHERE workspace_id = :id"),
            {"id": str(workspace_id)},
        ).scalar()
        assert notes_rem == 0, "notes must be deleted on workspace deletion"
        assert tags_rem == 0, "tags must be deleted on workspace deletion"


# ── Test 7: Migration reversibility ───────────────────────────────────────────


def test_migration_downgrade_and_upgrade_are_reversible(db_url):
    """Contract §19.1 — downgrade() fully reverses upgrade().

    Uses the shared db_url but a fresh alembic config so as not to interfere
    with the module-scoped migrated_engine fixture.
    """
    # Test step-by-step downgrade to 0001
    _alembic_downgrade(db_url, "0001")
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" in tables
    assert "workspaces" in tables
    assert "notes" not in tables
    assert "tags" not in tables
    assert "note_tags" not in tables
    assert "note_links" not in tables
    engine.dispose()

    # Downgrade back to base (empty schema)
    _alembic_downgrade(db_url, "base")

    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" not in tables, "users table must be gone after downgrade"
    assert "workspaces" not in tables, "workspaces table must be gone after downgrade"
    assert "notes" not in tables
    assert "tags" not in tables
    engine.dispose()

    # Re-upgrade to confirm idempotency
    _alembic_upgrade(db_url)
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" in tables
    assert "workspaces" in tables
    assert "notes" in tables
    assert "tags" in tables
    assert "note_tags" in tables
    assert "note_links" in tables
    engine.dispose()
