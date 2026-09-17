"""Integration tests: Backend HTTP API against a real PostgreSQL database.

Contract references:
    §11   — User API contract (POST /api/v1/users, GET /api/v1/users/{id}, GET /api/v1/users)
    §12   — Workspace API contract
    §13   — Error contract (error codes: USER_NOT_FOUND, WORKSPACE_NOT_FOUND, VALIDATION_ERROR)
    §22.3 — Integration tests: backend starts, user/workspace CRUD, ownership validation,
             health endpoint remains unchanged
    §23   — Backward compatibility: GET /api/v1/health must still return {"status": "ok"}

These tests spin up a real PostgreSQL container, apply migrations, then drive the
FastAPI application in-process via the HTTPX ASGITransport — no external port needed.

Workstream B models are required for the API tests. If they are absent (i.e. this
branch is reviewed in isolation before merging), the API tests are skipped with an
informative message rather than failing with an ImportError that would mask real issues.
"""

import os
import sys
import uuid

import pytest

# Ensure backend package is importable before app imports
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from alembic import command as alembic_command  # noqa: E402
from alembic.config import Config  # noqa: E402

try:
    from testcontainers.community.postgres import PostgresContainer  # noqa: E402
except ImportError:
    from testcontainers.postgres import PostgresContainer  # noqa: E402

# Detect whether Workstream B has been merged (models + services present).
try:
    from app.models.user import User  # noqa: F401
    from app.models.workspace import Workspace  # noqa: F401

    WORKSTREAM_B_AVAILABLE = True
except ImportError:
    WORKSTREAM_B_AVAILABLE = False

skip_without_ws_b = pytest.mark.skipif(
    not WORKSTREAM_B_AVAILABLE,
    reason="Workstream B models not yet merged — skipping API integration tests",
)


# ── Shared fixtures ────────────────────────────────────────────────────────────


@pytest.fixture(scope="module")
def postgres_container():
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


def _alembic_upgrade(db_url: str) -> None:
    """Run alembic upgrade head, patching settings so env.py uses the test URL."""
    try:
        from app.core.config import settings

        object.__setattr__(settings, "DATABASE_URL", db_url)
    except Exception:
        os.environ["DATABASE_URL"] = db_url

    alembic_ini = os.path.join(BACKEND_DIR, "alembic.ini")
    cfg = Config(alembic_ini)
    cfg.set_main_option("sqlalchemy.url", db_url)
    alembic_command.upgrade(cfg, "head")


@pytest.fixture(scope="module")
def migrated_db_url(db_url):
    """Apply migrations once for the entire module."""
    _alembic_upgrade(db_url)
    return db_url


@pytest.fixture(scope="module")
def test_client(migrated_db_url):
    """Create a test client wired to the FastAPI app using the test DB.

    Uses starlette.testclient.TestClient which handles async-to-sync bridging
    internally — no event-loop juggling needed in sync test functions.
    """
    if not WORKSTREAM_B_AVAILABLE:
        pytest.skip("Workstream B models not yet merged")

    import app.db.session as session_module  # noqa: PLC0415
    from sqlalchemy import create_engine  # noqa: PLC0415
    from sqlalchemy.orm import sessionmaker  # noqa: PLC0415
    from starlette.testclient import TestClient  # noqa: PLC0415

    # Override the database engine/session to point at the test container
    test_engine = create_engine(migrated_db_url)
    TestSessionLocal = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)

    original_engine = session_module.engine
    original_session_local = session_module.SessionLocal

    session_module.engine = test_engine
    session_module.SessionLocal = TestSessionLocal

    from app.main import app as fastapi_app  # noqa: PLC0415

    with TestClient(fastapi_app, raise_server_exceptions=False) as client:
        yield client

    # Restore originals
    session_module.engine = original_engine
    session_module.SessionLocal = original_session_local
    test_engine.dispose()


# ── Test: health endpoint backward compatibility ───────────────────────────────


@skip_without_ws_b
def test_health_endpoint_returns_ok(test_client):
    """Contract §23 — GET /api/v1/health must still return 200 {"status": "ok"}."""
    response = test_client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ── Test: User creation ────────────────────────────────────────────────────────


@skip_without_ws_b
def test_create_user_returns_201(test_client):
    """Contract §11.1 — POST /api/v1/users returns 201 with correct body."""
    response = test_client.post("/api/v1/users", json={"display_name": "Alice"})
    assert response.status_code == 201
    body = response.json()
    assert body["display_name"] == "Alice"
    assert "id" in body
    uuid.UUID(body["id"])  # must be a valid UUID
    assert "created_at" in body
    assert "updated_at" in body


@skip_without_ws_b
def test_create_user_rejects_empty_display_name(test_client):
    """Contract §7.2, §13.1 — empty display_name returns 422 VALIDATION_ERROR."""
    response = test_client.post("/api/v1/users", json={"display_name": ""})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@skip_without_ws_b
def test_create_user_rejects_whitespace_only_display_name(test_client):
    """Contract §7.2 — whitespace-only display_name must be rejected."""
    response = test_client.post("/api/v1/users", json={"display_name": "   "})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


# ── Test: User retrieval ───────────────────────────────────────────────────────


@skip_without_ws_b
def test_get_user_returns_200(test_client):
    """Contract §11.2 — GET /api/v1/users/{user_id} returns 200 for existing user."""
    create_resp = test_client.post("/api/v1/users", json={"display_name": "Bob"})
    assert create_resp.status_code == 201
    user_id = create_resp.json()["id"]

    get_resp = test_client.get(f"/api/v1/users/{user_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == user_id
    assert get_resp.json()["display_name"] == "Bob"


@skip_without_ws_b
def test_get_user_returns_404_for_missing_user(test_client):
    """Contract §11.2, §13.1 — non-existent user_id returns 404 USER_NOT_FOUND."""
    response = test_client.get(f"/api/v1/users/{uuid.uuid4()}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "USER_NOT_FOUND"


# ── Test: User listing ─────────────────────────────────────────────────────────


@skip_without_ws_b
def test_list_users_returns_200_with_items_and_total(test_client):
    """Contract §11.3 — GET /api/v1/users returns 200 with {items, total}."""
    response = test_client.get("/api/v1/users")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert isinstance(body["items"], list)
    assert body["total"] >= 0


# ── Test: Workspace creation ───────────────────────────────────────────────────


@skip_without_ws_b
def test_create_workspace_returns_201(test_client):
    """Contract §12.1 — POST /api/v1/workspaces returns 201 with correct body."""
    user_resp = test_client.post("/api/v1/users", json={"display_name": "Workspace Owner"})
    assert user_resp.status_code == 201
    owner_id = user_resp.json()["id"]

    ws_resp = test_client.post(
        "/api/v1/workspaces",
        json={"name": "My Workspace", "description": "A test workspace", "owner_id": owner_id},
    )
    assert ws_resp.status_code == 201
    body = ws_resp.json()
    assert body["name"] == "My Workspace"
    assert body["description"] == "A test workspace"
    assert body["owner_id"] == owner_id
    assert "id" in body
    uuid.UUID(body["id"])
    assert "created_at" in body
    assert "updated_at" in body


@skip_without_ws_b
def test_create_workspace_with_missing_owner_returns_404(test_client):
    """Contract §12.1, §13.1 — non-existent owner_id returns 404 USER_NOT_FOUND."""
    response = test_client.post(
        "/api/v1/workspaces",
        json={"name": "Orphan WS", "owner_id": str(uuid.uuid4())},
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "USER_NOT_FOUND"


@skip_without_ws_b
def test_create_workspace_rejects_empty_name(test_client):
    """Contract §8.2, §13.1 — empty workspace name returns 422 VALIDATION_ERROR."""
    user_resp = test_client.post("/api/v1/users", json={"display_name": "WS Validation User"})
    assert user_resp.status_code == 201
    owner_id = user_resp.json()["id"]

    response = test_client.post(
        "/api/v1/workspaces",
        json={"name": "", "owner_id": owner_id},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


# ── Test: Workspace retrieval ──────────────────────────────────────────────────


@skip_without_ws_b
def test_get_workspace_returns_200(test_client):
    """Contract §12.2 — GET /api/v1/workspaces/{workspace_id} returns 200."""
    user_resp = test_client.post("/api/v1/users", json={"display_name": "WS Getter"})
    owner_id = user_resp.json()["id"]

    ws_resp = test_client.post(
        "/api/v1/workspaces",
        json={"name": "Fetched WS", "owner_id": owner_id},
    )
    ws_id = ws_resp.json()["id"]

    get_resp = test_client.get(f"/api/v1/workspaces/{ws_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == ws_id


@skip_without_ws_b
def test_get_workspace_returns_404_for_missing(test_client):
    """Contract §12.2, §13.1 — non-existent workspace returns 404 WORKSPACE_NOT_FOUND."""
    response = test_client.get(f"/api/v1/workspaces/{uuid.uuid4()}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "WORKSPACE_NOT_FOUND"


# ── Test: Workspace listing ────────────────────────────────────────────────────


@skip_without_ws_b
def test_list_workspaces_returns_200_with_items_and_total(test_client):
    """Contract §12.3 — GET /api/v1/workspaces returns 200 with {items, total}."""
    response = test_client.get("/api/v1/workspaces")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert isinstance(body["items"], list)


# ── Test: Workspace ownership validation ──────────────────────────────────────


@skip_without_ws_b
def test_workspace_owner_id_matches_creating_user(test_client):
    """Contract §9, §12.1 — workspace owner_id matches the user who was supplied."""
    user_resp = test_client.post("/api/v1/users", json={"display_name": "Owner Check"})
    owner_id = user_resp.json()["id"]

    ws_resp = test_client.post(
        "/api/v1/workspaces",
        json={"name": "Owner WS", "owner_id": owner_id},
    )
    assert ws_resp.status_code == 201
    assert ws_resp.json()["owner_id"] == owner_id


# ── Test: Error response structure ────────────────────────────────────────────


@skip_without_ws_b
def test_error_responses_follow_canonical_structure(test_client):
    """Contract §13 — all error responses use {error: {code, message}} envelope."""
    resp = test_client.get(f"/api/v1/users/{uuid.uuid4()}")
    assert resp.status_code == 404
    body = resp.json()
    assert "error" in body
    assert "code" in body["error"]
    assert "message" in body["error"]
    assert isinstance(body["error"]["code"], str)
    assert isinstance(body["error"]["message"], str)

    resp2 = test_client.get(f"/api/v1/workspaces/{uuid.uuid4()}")
    assert resp2.status_code == 404
    assert resp2.json()["error"]["code"] == "WORKSPACE_NOT_FOUND"
