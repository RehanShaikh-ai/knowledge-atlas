"""Tests for Workspace API endpoints and domain requirements.

Contract §8, §12, §13, §22.1.
"""

import uuid

from fastapi.testclient import TestClient


def test_create_workspace_success(client: TestClient):
    """Workspace creation succeeds with 201 Created and canonical response."""
    # First create an owner
    user_res = client.post("/api/v1/users", json={"display_name": "Owner User"})
    assert user_res.status_code == 201
    owner_id = user_res.json()["id"]

    payload = {
        "name": "Knowledge Workspace",
        "description": "A collaborative workspace for research.",
        "owner_id": owner_id,
    }
    response = client.post("/api/v1/workspaces", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert uuid.UUID(data["id"])
    assert data["name"] == "Knowledge Workspace"
    assert data["description"] == "A collaborative workspace for research."
    assert data["owner_id"] == owner_id
    assert "created_at" in data
    assert "updated_at" in data


def test_create_workspace_without_description(client: TestClient):
    """Workspace creation succeeds when description is omitted or null."""
    user_res = client.post("/api/v1/users", json={"display_name": "Owner 2"})
    owner_id = user_res.json()["id"]

    payload = {
        "name": "Minimal Workspace",
        "owner_id": owner_id,
    }
    response = client.post("/api/v1/workspaces", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Minimal Workspace"
    assert data["description"] is None


def test_create_workspace_trims_name(client: TestClient):
    """Workspace creation trims leading and trailing whitespace on name."""
    user_res = client.post("/api/v1/users", json={"display_name": "Owner 3"})
    owner_id = user_res.json()["id"]

    payload = {
        "name": "   Trimmed Workspace   ",
        "owner_id": owner_id,
    }
    response = client.post("/api/v1/workspaces", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Trimmed Workspace"


def test_create_workspace_rejects_missing_owner(client: TestClient):
    """Workspace creation returns 404 USER_NOT_FOUND when owner does not exist."""
    random_owner_id = str(uuid.uuid4())
    payload = {
        "name": "Orphan Workspace",
        "owner_id": random_owner_id,
    }
    response = client.post("/api/v1/workspaces", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "USER_NOT_FOUND"


def test_create_workspace_rejects_empty_name(client: TestClient):
    """Workspace creation rejects empty name with 422 VALIDATION_ERROR."""
    user_res = client.post("/api/v1/users", json={"display_name": "Owner 4"})
    owner_id = user_res.json()["id"]

    response = client.post(
        "/api/v1/workspaces",
        json={"name": "", "owner_id": owner_id},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_create_workspace_rejects_whitespace_name(client: TestClient):
    """Workspace creation rejects whitespace-only name with 422 VALIDATION_ERROR."""
    user_res = client.post("/api/v1/users", json={"display_name": "Owner 5"})
    owner_id = user_res.json()["id"]

    response = client.post(
        "/api/v1/workspaces",
        json={"name": "     ", "owner_id": owner_id},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_create_workspace_rejects_too_long_name(client: TestClient):
    """Workspace creation rejects name exceeding 150 characters with 422 VALIDATION_ERROR."""
    user_res = client.post("/api/v1/users", json={"display_name": "Owner 6"})
    owner_id = user_res.json()["id"]

    response = client.post(
        "/api/v1/workspaces",
        json={"name": "x" * 151, "owner_id": owner_id},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_create_workspace_rejects_too_long_description(client: TestClient):
    """Workspace creation rejects description > 1000 chars with 422 VALIDATION_ERROR."""
    user_res = client.post("/api/v1/users", json={"display_name": "Owner 7"})
    owner_id = user_res.json()["id"]

    response = client.post(
        "/api/v1/workspaces",
        json={
            "name": "Valid Name",
            "description": "d" * 1001,
            "owner_id": owner_id,
        },
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_create_workspace_rejects_invalid_owner_uuid(client: TestClient):
    """Workspace creation rejects invalid UUID format with 422 VALIDATION_ERROR."""
    response = client.post(
        "/api/v1/workspaces",
        json={"name": "Valid Name", "owner_id": "not-a-uuid"},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_get_workspace_success(client: TestClient):
    """Workspace retrieval succeeds with 200 OK."""
    user_res = client.post("/api/v1/users", json={"display_name": "Owner 8"})
    owner_id = user_res.json()["id"]

    ws_res = client.post(
        "/api/v1/workspaces",
        json={"name": "Project Workspace", "description": "Notes", "owner_id": owner_id},
    )
    assert ws_res.status_code == 201
    workspace_id = ws_res.json()["id"]

    get_res = client.get(f"/api/v1/workspaces/{workspace_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == workspace_id
    assert data["name"] == "Project Workspace"
    assert data["description"] == "Notes"
    assert data["owner_id"] == owner_id


def test_get_workspace_not_found(client: TestClient):
    """Workspace retrieval returns 404 WORKSPACE_NOT_FOUND for non-existent UUID."""
    random_id = uuid.uuid4()
    response = client.get(f"/api/v1/workspaces/{random_id}")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "WORKSPACE_NOT_FOUND"
    assert data["error"]["message"] == "Workspace not found."


def test_get_workspace_invalid_uuid(client: TestClient):
    """Workspace retrieval returns 422 VALIDATION_ERROR for invalid UUID."""
    response = client.get("/api/v1/workspaces/invalid-workspace-uuid")
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_list_workspaces_empty(client: TestClient):
    """List workspaces returns empty list and total 0 when no workspaces exist."""
    response = client.get("/api/v1/workspaces")
    assert response.status_code == 200
    data = response.json()
    assert data == {"items": [], "total": 0}


def test_list_workspaces_populated(client: TestClient):
    """List workspaces returns all created workspaces and total count."""
    user_res = client.post("/api/v1/users", json={"display_name": "Owner 9"})
    owner_id = user_res.json()["id"]

    client.post("/api/v1/workspaces", json={"name": "WS 1", "owner_id": owner_id})
    client.post("/api/v1/workspaces", json={"name": "WS 2", "owner_id": owner_id})

    response = client.get("/api/v1/workspaces")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    names = [w["name"] for w in data["items"]]
    assert "WS 1" in names
    assert "WS 2" in names
