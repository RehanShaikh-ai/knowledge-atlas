"""Contract tests for v0.2.1 note, tag, link, and search endpoints."""

from fastapi.testclient import TestClient


def _create_workspace(client: TestClient) -> tuple[str, str]:
    user = client.post("/api/v1/users", json={"display_name": "Note Test User"})
    assert user.status_code == 201
    workspace = client.post(
        "/api/v1/workspaces",
        json={"name": "Note Test Workspace", "owner_id": user.json()["id"]},
    )
    assert workspace.status_code == 201
    return user.json()["id"], workspace.json()["id"]


def _create_note(client: TestClient, workspace_id: str, user_id: str, **values: object) -> dict:
    payload = {
        "title": "Knowledge note",
        "content": "A useful markdown note.",
        "created_by": user_id,
    }
    payload.update(values)
    response = client.post(f"/api/v1/workspaces/{workspace_id}/notes", json=payload)
    assert response.status_code == 201
    return response.json()


def test_note_crud_filtering_and_immutable_fields(client: TestClient):
    user_id, workspace_id = _create_workspace(client)
    first_note = _create_note(client, workspace_id, user_id, title="First")
    second_note = _create_note(client, workspace_id, user_id, title="Second")

    update = client.patch(
        f"/api/v1/notes/{first_note['id']}",
        json={"content": "Updated", "is_pinned": True},
    )
    assert update.status_code == 200
    assert update.json()["content"] == "Updated"
    assert update.json()["is_pinned"] is True

    immutable = client.patch(
        f"/api/v1/notes/{first_note['id']}", json={"workspace_id": workspace_id}
    )
    assert immutable.status_code == 422
    assert immutable.json()["error"]["code"] == "VALIDATION_ERROR"

    archived = client.patch(f"/api/v1/notes/{second_note['id']}", json={"is_archived": True})
    assert archived.status_code == 200
    listed = client.get(f"/api/v1/workspaces/{workspace_id}/notes?page=1&page_size=1")
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["id"] == first_note["id"]

    deleted = client.delete(f"/api/v1/notes/{first_note['id']}")
    assert deleted.status_code == 204
    missing_note = client.get(f"/api/v1/notes/{first_note['id']}")
    assert missing_note.json()["error"]["code"] == "NOTE_NOT_FOUND"


def test_note_validation_errors(client: TestClient):
    user_id, workspace_id = _create_workspace(client)
    empty_title = client.post(
        f"/api/v1/workspaces/{workspace_id}/notes",
        json={"title": "   ", "content": "", "created_by": user_id},
    )
    assert empty_title.status_code == 422
    assert empty_title.json()["error"]["code"] == "VALIDATION_ERROR"

    oversized_content = client.post(
        f"/api/v1/workspaces/{workspace_id}/notes",
        json={"title": "Large", "content": "x" * 100_001, "created_by": user_id},
    )
    assert oversized_content.status_code == 422


def test_tags_and_search(client: TestClient):
    user_id, workspace_id = _create_workspace(client)
    note = _create_note(
        client,
        workspace_id,
        user_id,
        title="Transformers",
        content="Attention mechanisms",
    )
    tag = client.post(f"/api/v1/notes/{note['id']}/tags", json={"name": " Machine-Learning "})
    assert tag.status_code == 201
    assert tag.json()["name"] == "machine-learning"

    duplicate = client.post(f"/api/v1/notes/{note['id']}/tags", json={"name": "machine-learning"})
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "DUPLICATE_TAG"

    tags = client.get(f"/api/v1/workspaces/{workspace_id}/tags")
    assert tags.status_code == 200
    assert tags.json()["total"] == 1

    search_title = client.get(f"/api/v1/workspaces/{workspace_id}/notes/search?q=transformers")
    assert search_title.status_code == 200
    assert search_title.json()["total"] == 1

    search_tag = client.get(f"/api/v1/workspaces/{workspace_id}/notes/search?q=machine")
    assert search_tag.status_code == 200
    assert search_tag.json()["items"][0]["id"] == note["id"]

    empty_query = client.get(f"/api/v1/workspaces/{workspace_id}/notes/search?q=%20%20%20")
    assert empty_query.status_code == 422
    assert empty_query.json()["error"]["code"] == "VALIDATION_ERROR"

    assert client.delete(f"/api/v1/notes/{note['id']}/tags/{tag.json()['id']}").status_code == 204


def test_note_links_validate_workspace_and_cascade(client: TestClient):
    user_id, workspace_id = _create_workspace(client)
    source = _create_note(client, workspace_id, user_id, title="Source")
    target = _create_note(client, workspace_id, user_id, title="Target")
    other_user_id, other_workspace_id = _create_workspace(client)
    other = _create_note(client, other_workspace_id, other_user_id, title="Other")

    self_link = client.post(
        f"/api/v1/notes/{source['id']}/links", json={"target_note_id": source["id"]}
    )
    assert self_link.status_code == 422
    assert self_link.json()["error"]["code"] == "VALIDATION_ERROR"

    cross_workspace = client.post(
        f"/api/v1/notes/{source['id']}/links", json={"target_note_id": other["id"]}
    )
    assert cross_workspace.status_code == 422

    link = client.post(f"/api/v1/notes/{source['id']}/links", json={"target_note_id": target["id"]})
    assert link.status_code == 201
    duplicate = client.post(
        f"/api/v1/notes/{source['id']}/links", json={"target_note_id": target["id"]}
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "CONFLICT"

    links = client.get(f"/api/v1/notes/{target['id']}/links")
    assert links.status_code == 200
    assert links.json()["incoming"][0]["source_note_id"] == source["id"]

    assert client.delete(f"/api/v1/notes/{source['id']}").status_code == 204
    links_after_delete = client.get(f"/api/v1/notes/{target['id']}/links")
    assert links_after_delete.json() == {"outgoing": [], "incoming": []}


def test_note_creation_succeeds_with_generated_search_vector(client: TestClient):
    """Regression test: Note creation succeeds when search_vector is a GENERATED ALWAYS column."""
    user_id, workspace_id = _create_workspace(client)
    note = _create_note(
        client,
        workspace_id,
        user_id,
        title="Search Vector Regression Test",
        content="Testing generated search_vector column",
    )
    assert note["id"] is not None
    assert note["title"] == "Search Vector Regression Test"
