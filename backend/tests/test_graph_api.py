"""API and unit tests for Knowledge Graph endpoints.

Contract references:
    CONTRACT_v0.2.2.md §8, §14.1
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.note import Note
from app.models.note_link import NoteLink
from app.models.note_tag import NoteTag
from app.models.tag import Tag
from app.models.user import User
from app.models.workspace import Workspace


@pytest.fixture
def graph_test_data(db_session: Session):
    user = User(id=uuid.uuid4(), display_name="Graph Researcher")
    db_session.add(user)
    db_session.flush()

    ws = Workspace(id=uuid.uuid4(), name="Graph Workspace", owner_id=user.id)
    db_session.add(ws)
    db_session.flush()

    tag_ai = Tag(id=uuid.uuid4(), workspace_id=ws.id, name="ai")
    tag_math = Tag(id=uuid.uuid4(), workspace_id=ws.id, name="math")
    db_session.add_all([tag_ai, tag_math])
    db_session.flush()

    # Note 1: Neural Networks (has tag ai, degree 2)
    n1 = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Neural Networks",
        content="NN content",
    )
    # Note 2: Deep Learning (has tag ai, degree 2)
    n2 = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Deep Learning",
        content="DL content",
    )
    # Note 3: Linear Algebra (has tag math, degree 1)
    n3 = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Linear Algebra",
        content="Math content",
    )
    # Note 4: Isolated Note (degree 0)
    n4 = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Isolated Island",
        content="No links",
    )

    db_session.add_all([n1, n2, n3, n4])
    db_session.flush()

    # Attach tags
    db_session.add(NoteTag(note_id=n1.id, tag_id=tag_ai.id))
    db_session.add(NoteTag(note_id=n2.id, tag_id=tag_ai.id))
    db_session.add(NoteTag(note_id=n3.id, tag_id=tag_math.id))

    # Links: n1 -> n2, n2 -> n3
    db_session.add(NoteLink(source_note_id=n1.id, target_note_id=n2.id))
    db_session.add(NoteLink(source_note_id=n2.id, target_note_id=n3.id))

    db_session.commit()

    return {
        "user": user,
        "ws": ws,
        "n1": n1,
        "n2": n2,
        "n3": n3,
        "n4": n4,
        "tag_ai": tag_ai,
    }


def test_get_workspace_graph_structure_and_stats(client: TestClient, graph_test_data: dict):
    """Verify nodes, edges, degree calculation, and isolated node count.

    CONTRACT_v0.2.2.md §8.1, §14.1
    """
    ws = graph_test_data["ws"]
    res = client.get(f"/api/v1/workspaces/{ws.id}/graph")
    assert res.status_code == 200
    data = res.json()

    assert data["stats"]["node_count"] == 4
    assert data["stats"]["edge_count"] == 2
    assert data["stats"]["isolated_count"] == 1
    assert data["stats"]["truncated"] is False

    # Check node degrees
    node_map = {n["id"]: n for n in data["nodes"]}
    n1_id = str(graph_test_data["n1"].id)
    n2_id = str(graph_test_data["n2"].id)
    n3_id = str(graph_test_data["n3"].id)
    n4_id = str(graph_test_data["n4"].id)

    assert node_map[n1_id]["degree"] == 1  # 1 link (n1 -> n2)
    assert node_map[n2_id]["degree"] == 2  # 2 links (n1 -> n2, n2 -> n3)
    assert node_map[n3_id]["degree"] == 1  # 1 link (n2 -> n3)
    assert node_map[n4_id]["degree"] == 0  # isolated


def test_workspace_graph_tag_filter(client: TestClient, graph_test_data: dict):
    """Verify graph filtering by tag name.

    CONTRACT_v0.2.2.md §8.1
    """
    ws = graph_test_data["ws"]
    res = client.get(f"/api/v1/workspaces/{ws.id}/graph?tag=ai")
    assert res.status_code == 200
    data = res.json()

    assert data["stats"]["node_count"] == 2
    assert data["stats"]["edge_count"] == 1
    assert data["stats"]["isolated_count"] == 0
    titles = [n["title"] for n in data["nodes"]]
    assert "Neural Networks" in titles
    assert "Deep Learning" in titles


def test_workspace_graph_truncation_indicator(client: TestClient, graph_test_data: dict):
    """Verify stats.truncated is True when matching notes exceed limit.

    CONTRACT_v0.2.2.md §8.1, §14.1
    """
    ws = graph_test_data["ws"]
    # Total notes = 4, request limit = 2
    res = client.get(f"/api/v1/workspaces/{ws.id}/graph?limit=2")
    assert res.status_code == 200
    data = res.json()

    assert data["stats"]["node_count"] == 2
    assert data["stats"]["truncated"] is True


def test_get_note_neighborhood(client: TestClient, graph_test_data: dict):
    """Verify 1-hop connected subgraph for a specific note.

    CONTRACT_v0.2.2.md §8.2
    """
    n2 = graph_test_data["n2"]  # connected to n1 and n3
    res = client.get(f"/api/v1/notes/{n2.id}/graph")
    assert res.status_code == 200
    data = res.json()

    # n2 neighborhood contains n1, n2, n3
    node_ids = {n["id"] for n in data["nodes"]}
    assert str(graph_test_data["n1"].id) in node_ids
    assert str(graph_test_data["n2"].id) in node_ids
    assert str(graph_test_data["n3"].id) in node_ids
    assert str(graph_test_data["n4"].id) not in node_ids
    assert data["stats"]["node_count"] == 3
    assert data["stats"]["edge_count"] == 2


def test_graph_not_found_errors(client: TestClient):
    random_id = str(uuid.uuid4())
    res1 = client.get(f"/api/v1/workspaces/{random_id}/graph")
    assert res1.status_code == 404
    assert res1.json()["error"]["code"] == "WORKSPACE_NOT_FOUND"

    res2 = client.get(f"/api/v1/notes/{random_id}/graph")
    assert res2.status_code == 404
    assert res2.json()["error"]["code"] == "NOTE_NOT_FOUND"
