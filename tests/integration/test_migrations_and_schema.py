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


# ── Test 6: Migration reversibility ───────────────────────────────────────────


def test_migration_downgrade_and_upgrade_are_reversible(db_url):
    """Contract §19.1 — downgrade() fully reverses upgrade().

    Uses the shared db_url but a fresh alembic config so as not to interfere
    with the module-scoped migrated_engine fixture.
    """
    # Downgrade back to base (empty schema)
    _alembic_downgrade(db_url, "base")

    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" not in tables, "users table must be gone after downgrade"
    assert "workspaces" not in tables, "workspaces table must be gone after downgrade"
    engine.dispose()

    # Re-upgrade to confirm idempotency
    _alembic_upgrade(db_url)
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" in tables, "users table must be recreated after re-upgrade"
    assert "workspaces" in tables, "workspaces table must be recreated after re-upgrade"
    engine.dispose()
