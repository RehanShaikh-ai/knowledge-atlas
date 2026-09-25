"""API tests for Knowledge Dashboard endpoint.

Contract references:
    CONTRACT_v0.2.2.md §9, §14.1
"""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.note import Note
from app.models.note_link import NoteLink
from app.models.note_tag import NoteTag
from app.models.source import Source
from app.models.tag import Tag
from app.models.user import User
from app.models.workspace import Workspace


@pytest.fixture
def dashboard_test_data(db_session: Session):
    user = User(id=uuid.uuid4(), display_name="Dashboard User")
    db_session.add(user)
    db_session.flush()

    ws = Workspace(id=uuid.uuid4(), name="Dashboard Workspace", owner_id=user.id)
    db_session.add(ws)
    db_session.flush()

    t_ml = Tag(id=uuid.uuid4(), workspace_id=ws.id, name="ml")
    t_web = Tag(id=uuid.uuid4(), workspace_id=ws.id, name="web")
    db_session.add_all([t_ml, t_web])
    db_session.flush()

    now = datetime.now(UTC)
    old_time = now - timedelta(days=10)

    # Note 1: Recent, 2 links (degree 2)
    n1 = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Note One",
        content="C1",
        created_at=now,
        updated_at=now,
    )
    # Note 2: Recent, 2 links (degree 2), updated slightly before Note 1 for tie-break testing
    n2 = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Note Two",
        content="C2",
        created_at=now,
        updated_at=now - timedelta(minutes=5),
    )
    # Note 3: Created 10 days ago, degree 1
    n3 = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Note Three",
        content="C3",
        created_at=old_time,
        updated_at=old_time,
    )
    # Note 4: Isolated note, degree 0
    n4 = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Isolated",
        content="C4",
        created_at=now,
        updated_at=now,
    )

    db_session.add_all([n1, n2, n3, n4])
    db_session.flush()

    # Tags: Note 1 and Note 2 have 'ml', Note 3 has 'web'
    db_session.add(NoteTag(note_id=n1.id, tag_id=t_ml.id))
    db_session.add(NoteTag(note_id=n2.id, tag_id=t_ml.id))
    db_session.add(NoteTag(note_id=n3.id, tag_id=t_web.id))

    # Links: n1 <-> n2 (n1 -> n2), n2 -> n3
    db_session.add(NoteLink(source_note_id=n1.id, target_note_id=n2.id))
    db_session.add(NoteLink(source_note_id=n2.id, target_note_id=n3.id))

    # Sources: 2 completed, 1 skipped
    s1 = Source(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        note_id=n1.id,
        source_type="markdown",
        original_path="n1.md",
        source_identifier="n1.md",
        content_hash="h1",
        import_batch_id=uuid.uuid4(),
        import_status="completed",
        imported_at=now,
    )
    s2 = Source(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        note_id=n2.id,
        source_type="markdown",
        original_path="n2.md",
        source_identifier="n2.md",
        content_hash="h2",
        import_batch_id=uuid.uuid4(),
        import_status="completed",
        imported_at=now,
    )
    s3 = Source(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        note_id=None,
        source_type="markdown",
        original_path="n3.md",
        source_identifier="n3.md",
        content_hash="h3",
        import_batch_id=uuid.uuid4(),
        import_status="skipped",
        imported_at=now,
    )
    db_session.add_all([s1, s2, s3])

    db_session.commit()

    return {"ws": ws, "n1": n1, "n2": n2, "n3": n3, "n4": n4}


def test_dashboard_metrics_and_isolated_agreement(client: TestClient, dashboard_test_data: dict):
    """Verify all dashboard counts, tie-break rules, and agreement with graph isolated count.

    CONTRACT_v0.2.2.md §9, §14.1
    """
    ws = dashboard_test_data["ws"]

    dash_res = client.get(f"/api/v1/workspaces/{ws.id}/dashboard")
    assert dash_res.status_code == 200
    dash = dash_res.json()

    assert dash["total_notes"] == 4
    assert dash["total_relationships"] == 2
    assert dash["total_tags"] == 2
    assert dash["total_sources"] == 3
    assert dash["notes_created_last_7_days"] == 3  # n1, n2, n4 (n3 is 10 days old)
    assert dash["isolated_notes_count"] == 1

    # Verify tie-break in most_connected_notes:
    # Note 2 has degree 2 (in from n1, out to n3)
    # Note 1 has degree 1 (out to n2)
    # Note 3 has degree 1 (in from n2)
    # Note 1 and Note 3 both have degree 1, Note 1 updated_at is more recent than Note 3
    connected = dash["most_connected_notes"]
    assert connected[0]["title"] == "Note Two"
    assert connected[0]["degree"] == 2
    assert connected[1]["title"] == "Note One"
    assert connected[1]["degree"] == 1
    assert connected[2]["title"] == "Note Three"
    assert connected[2]["degree"] == 1

    # Verify tag distribution: ml has 2 notes, web has 1 note
    assert dash["tag_distribution"][0]["tag"] == "ml"
    assert dash["tag_distribution"][0]["note_count"] == 2
    assert dash["tag_distribution"][1]["tag"] == "web"
    assert dash["tag_distribution"][1]["note_count"] == 1

    # Verify import status summary
    assert dash["import_status_summary"]["completed"] == 2
    assert dash["import_status_summary"]["skipped"] == 1


def test_dashboard_not_found_error(client: TestClient):
    random_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/workspaces/{random_id}/dashboard")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "WORKSPACE_NOT_FOUND"
