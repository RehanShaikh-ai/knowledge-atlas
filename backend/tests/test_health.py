"""Tests for the health endpoint.

Contract §26: backend/tests/test_health.py
Tests must verify contract §10, §11, §12 behavior.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_health_returns_ok():
    """GET /api/v1/health returns 200 with {"status": "ok"} per contract §10."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "ok"}


def test_get_health_response_has_status_field():
    """HealthResponse contains 'status' field per contract §11."""
    response = client.get("/api/v1/health")
    data = response.json()
    assert "status" in data
    assert isinstance(data["status"], str)


def test_health_endpoint_method_not_allowed():
    """POST to /api/v1/health should return an ErrorResponse, not a raw traceback."""
    response = client.post("/api/v1/health")
    assert response.status_code == 405
    data = response.json()
    assert "error" in data
    assert "code" in data["error"]
    assert "message" in data["error"]


def test_not_found_returns_error_response():
    """A request to a non-existent route should return ErrorResponse per contract §12."""
    response = client.get("/api/v1/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "message" in data["error"]


def test_error_response_shape():
    """All error responses must match the canonical ErrorResponse shape per contract §12."""
    response = client.get("/api/v1/nonexistent")
    data = response.json()
    # Verify shape: {"error": {"code": str, "message": str}}
    assert isinstance(data, dict)
    assert "error" in data
    error = data["error"]
    assert isinstance(error, dict)
    assert isinstance(error.get("code"), str)
    assert isinstance(error.get("message"), str)


def test_unhandled_exception_returns_500_error_response():
    """Unhandled exception must return 500 ErrorResponse without exposing internal traceback."""
    from fastapi import APIRouter

    test_router = APIRouter()

    @test_router.get("/api/v1/test-error")
    def trigger_error():
        raise RuntimeError("Secret internal failure details")

    # Create a test app with the handler
    from fastapi import FastAPI

    from app.core.exception_handlers import register_exception_handlers

    test_app = FastAPI()
    register_exception_handlers(test_app)
    test_app.include_router(test_router)

    test_client = TestClient(test_app, raise_server_exceptions=False)
    response = test_client.get("/api/v1/test-error")
    assert response.status_code == 500
    data = response.json()
    assert data == {
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred.",
        }
    }
    # Ensure internal exception message is NEVER leaked
    assert "Secret internal failure details" not in response.text


def test_validation_error_returns_422_error_response():
    """Request validation error must return 422 ErrorResponse with code='VALIDATION_ERROR'."""
    from fastapi import APIRouter, FastAPI
    from pydantic import BaseModel

    class ItemPayload(BaseModel):
        count: int

    test_router = APIRouter()

    @test_router.post("/api/v1/test-validation")
    def trigger_validation(payload: ItemPayload):
        return {"ok": True}

    from app.core.exception_handlers import register_exception_handlers

    test_app = FastAPI()
    register_exception_handlers(test_app)
    test_app.include_router(test_router)

    test_client = TestClient(test_app)
    # Send invalid type for count
    response = test_client.post("/api/v1/test-validation", json={"count": "not-an-int"})
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert data["error"]["message"] == "Request validation failed."
