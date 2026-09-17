"""Tests for User API endpoints and domain requirements.

Contract §7, §11, §13, §22.1.
"""

import uuid

from fastapi.testclient import TestClient


def test_create_user_success(client: TestClient):
    """User creation succeeds with 201 Created and canonical response."""
    payload = {"display_name": "Alice Developer"}
    response = client.post("/api/v1/users", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert uuid.UUID(data["id"])  # Valid UUID
    assert data["display_name"] == "Alice Developer"
    assert "created_at" in data
    assert "updated_at" in data


def test_create_user_trims_whitespace(client: TestClient):
    """User creation trims leading and trailing whitespace."""
    payload = {"display_name": "   Bob Tester   "}
    response = client.post("/api/v1/users", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["display_name"] == "Bob Tester"


def test_create_user_rejects_empty_name(client: TestClient):
    """User creation rejects empty display_name with 422 VALIDATION_ERROR."""
    response = client.post("/api/v1/users", json={"display_name": ""})
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_create_user_rejects_whitespace_only(client: TestClient):
    """User creation rejects whitespace-only display_name with 422 VALIDATION_ERROR."""
    response = client.post("/api/v1/users", json={"display_name": "     "})
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_create_user_rejects_too_long_name(client: TestClient):
    """User creation rejects display_name exceeding 100 characters with 422 VALIDATION_ERROR."""
    long_name = "a" * 101
    response = client.post("/api/v1/users", json={"display_name": long_name})
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_create_user_rejects_missing_field(client: TestClient):
    """User creation rejects request without display_name with 422 VALIDATION_ERROR."""
    response = client.post("/api/v1/users", json={})
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_get_user_success(client: TestClient):
    """User retrieval succeeds with 200 OK."""
    create_res = client.post("/api/v1/users", json={"display_name": "Charlie"})
    assert create_res.status_code == 201
    user_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/users/{user_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == user_id
    assert data["display_name"] == "Charlie"


def test_get_user_not_found(client: TestClient):
    """User retrieval returns 404 USER_NOT_FOUND for non-existent UUID."""
    random_id = uuid.uuid4()
    response = client.get(f"/api/v1/users/{random_id}")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "USER_NOT_FOUND"
    assert data["error"]["message"] == "User not found."


def test_get_user_invalid_uuid(client: TestClient):
    """User retrieval returns 422 VALIDATION_ERROR for invalid UUID."""
    response = client.get("/api/v1/users/not-a-valid-uuid")
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_list_users_empty(client: TestClient):
    """List users returns empty list and total 0 when no users exist."""
    response = client.get("/api/v1/users")
    assert response.status_code == 200
    data = response.json()
    assert data == {"items": [], "total": 0}


def test_list_users_populated(client: TestClient):
    """List users returns all created users and total count."""
    client.post("/api/v1/users", json={"display_name": "User 1"})
    client.post("/api/v1/users", json={"display_name": "User 2"})

    response = client.get("/api/v1/users")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    names = [u["display_name"] for u in data["items"]]
    assert "User 1" in names
    assert "User 2" in names
