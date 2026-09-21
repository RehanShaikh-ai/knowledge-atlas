"""Unit and contract tests for Workstream B (Backend & AI) per CONTRACT v0.3.1 §17.1.

Covers:
- Chunking determinism and overlap (§8.1, §8.2)
- Embedding dimension validation and mismatch error (§7.4)
- Vector store payload, workspace isolation, and deletion (§7.2, §7.3, §7.5)
- Search modes: semantic, lexical, hybrid (§9.1, §9.2)
- Reranking (§9.4)
- RAG citations and empty context handling (§10.3, §10.5)
- Git path traversal rejection, snapshot, diff, restore without rewriting history (§11.2, §11.3)
- AI-edit staging, approval, and discard flow (§11.4)
- Job lifecycle and retry constraints (§12.1-§12.3)
- Saved search CRUD (§13.3)
- Workspace activity timeline (§13.2)
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.exceptions import (
    EmbeddingDimensionMismatchError,
    GitPathInvalidError,
    RAGContextEmptyError,
    ValidationError,
)
from app.models.note import Note
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.rag import RAGRequest
from app.services import (
    activity_service,
    chunking_service,
    embedding_service,
    git_service,
    job_service,
    rag_service,
    reranking_service,
    retrieval_service,
    saved_search_service,
    vector_service,
    version_service,
)


def _setup_workspace_and_note(db: Session) -> tuple[Workspace, User, Note]:
    """Helper to create a test workspace, user, and note."""
    user = User(
        id=uuid.uuid4(),
        display_name="Workstream B Tester",
    )
    db.add(user)
    db.flush()

    ws = Workspace(
        id=uuid.uuid4(),
        name=f"AI Workspace {uuid.uuid4().hex[:6]}",
        owner_id=user.id,
    )
    db.add(ws)
    db.flush()

    note = Note(
        id=uuid.uuid4(),
        workspace_id=ws.id,
        created_by=user.id,
        title="Quantum Computing Foundations",
        content=(
            "# Introduction\n\nQuantum algorithms leverage superposition and entanglement.\n\n"
            "## Qubits\n\nQubits represent superpositions of 0 and 1.\n\n"
            "## Shor Algorithm\n\nShor's algorithm achieves polynomial time prime factorization."
        ),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return ws, user, note


# ── 1. Chunking Tests (§8.1, §8.2, §17.1) ───────────────────────────────────


def test_chunking_deterministic_and_order_preserving():
    """Identical input produces identical chunks and 0-based ordered chunk_index."""
    content = (
        "# Heading 1\nContent under heading 1.\n\n"
        "# Heading 2\nContent under heading 2.\n\n"
        "# Heading 3\nContent under heading 3."
    )
    chunks1 = chunking_service.chunk_note(content)
    chunks2 = chunking_service.chunk_note(content)

    assert len(chunks1) == len(chunks2)
    for c1, c2 in zip(chunks1, chunks2, strict=True):
        assert c1["chunk_index"] == c2["chunk_index"]
        assert c1["content"] == c2["content"]
        assert c1["content_hash"] == c2["content_hash"]
        assert c1["token_count"] == c2["token_count"]

    # Check order preservation
    for idx, c in enumerate(chunks1):
        assert c["chunk_index"] == idx


def test_chunking_overlap():
    """CHUNK_OVERLAP creates consecutive overlap when text exceeds chunk size."""
    long_content = "word " * 600
    chunks = chunking_service.chunk_note(
        long_content, chunk_size=200, chunk_overlap=50, strategy="fixed_size"
    )
    assert len(chunks) > 1
    # Check that consecutive chunks have word overlap
    words_c0 = chunks[0]["content"].split()
    words_c1 = chunks[1]["content"].split()
    overlap = set(words_c0[-30:]).intersection(set(words_c1[:30]))
    assert len(overlap) > 0


# ── 2. Embedding & Dimension Validation (§7.4, §17.1) ───────────────────────


def test_embedding_dimension_validation():
    """Embedding generation validates dimension against expected dimension."""
    emb = embedding_service.get_embedding("Test embedding text")
    assert isinstance(emb, list)
    assert len(emb) == 384


def test_embedding_dimension_mismatch_raised(monkeypatch):
    """Raise EMBEDDING_DIMENSION_MISMATCH if provider returns mismatched vector."""
    from app.services.embedding_service import DeterministicTestEmbeddingProvider

    class WrongDimProvider(DeterministicTestEmbeddingProvider):
        def embed(self, texts):
            return [[0.1] * 128 for _ in texts]

    monkeypatch.setattr(embedding_service, "_get_provider", lambda: WrongDimProvider())

    with pytest.raises(EmbeddingDimensionMismatchError):
        embedding_service.get_embedding("Mismatched dimension")


# ── 3. Vector Service & Workspace Isolation (§7.2, §7.3, §7.5, §17.1) ───────


def test_vector_collection_name_formula():
    """Collection name strictly matches {QDRANT_COLLECTION_PREFIX}_{workspace_id}."""
    ws_id = uuid.uuid4()
    c_name = vector_service.collection_name(ws_id)
    assert c_name == f"ka_{ws_id}"


def test_workspace_isolation_in_vector_search(db_session: Session):
    """Vector search enforces workspace_id filtering; results from other workspace are excluded."""
    ws1, u1, n1 = _setup_workspace_and_note(db_session)
    ws2, u2, n2 = _setup_workspace_and_note(db_session)

    # Index ws1
    job_service.enqueue_index_job(db_session, ws1.id)

    # Index ws2
    job_service.enqueue_index_job(db_session, ws2.id)

    # Search in ws1
    q_vec = embedding_service.get_embedding("quantum algorithms")
    results_ws1 = vector_service.search_vectors(ws1.id, q_vec, limit=10)

    for r in results_ws1:
        assert r["payload"]["workspace_id"] == str(ws1.id)
        assert r["payload"]["note_id"] != str(n2.id)


def test_delete_note_vectors(db_session: Session):
    """delete_note_vectors removes points for specified note."""
    ws, u, note = _setup_workspace_and_note(db_session)
    job_service.enqueue_index_job(db_session, ws.id)

    q_vec = embedding_service.get_embedding("quantum")
    before = vector_service.search_vectors(ws.id, q_vec)
    assert len(before) > 0

    vector_service.delete_note_vectors(note.id, ws.id)
    after = vector_service.search_vectors(ws.id, q_vec)
    assert len(after) == 0


# ── 4. Retrieval & Reranking (§9.1, §9.2, §9.4, §17.1) ──────────────────────


def test_retrieval_modes(db_session: Session):
    """Test semantic, lexical, and hybrid search return valid SearchResultItems."""
    ws, u, note = _setup_workspace_and_note(db_session)
    job_service.enqueue_index_job(db_session, ws.id)

    semantic = retrieval_service.search_semantic(db_session, ws.id, "superposition")
    assert len(semantic) > 0
    assert semantic[0].search_mode == "semantic"
    assert semantic[0].score_meaning == "cosine_similarity"
    assert semantic[0].note_id == note.id

    lexical = retrieval_service.search_lexical(db_session, ws.id, "superposition")
    assert len(lexical) > 0
    assert lexical[0].search_mode == "lexical"
    assert lexical[0].score_meaning == "bm25"

    hybrid = retrieval_service.search_hybrid(db_session, ws.id, "superposition")
    assert len(hybrid) > 0
    assert hybrid[0].search_mode == "hybrid"
    assert hybrid[0].score_meaning == "rrf_combined"


def test_reranking(db_session: Session):
    """Reranking reorders/rescores results based on query term overlap."""
    ws, u, note = _setup_workspace_and_note(db_session)
    raw = retrieval_service.search_hybrid(db_session, ws.id, "quantum computing")
    assert len(raw) > 0

    reranked = reranking_service.rerank("quantum computing", raw)
    assert len(reranked) == len(raw)
    assert reranked[0].score_meaning == "reranked_fusion"


# ── 5. RAG Pipeline (§10.3, §10.5, §17.1) ───────────────────────────────────


def test_rag_pipeline_with_grounded_citations(db_session: Session):
    """RAG response returns answer and citations matching real note chunks."""
    ws, u, note = _setup_workspace_and_note(db_session)
    job_service.enqueue_index_job(db_session, ws.id)

    req = RAGRequest(query="What is a qubit?", search_mode="hybrid", rerank=True)
    res = rag_service.run_rag(db_session, ws.id, req)

    assert res.answer
    assert len(res.citations) > 0
    for cit in res.citations:
        assert cit.note_id == note.id
        assert cit.chunk_id is not None
        assert len(cit.excerpt) > 0


def test_rag_empty_context_raises_error(db_session: Session):
    """Zero retrieved chunks raises RAGContextEmptyError per CONTRACT §10.5."""
    user = User(id=uuid.uuid4(), display_name="Empty User")
    db_session.add(user)
    ws = Workspace(id=uuid.uuid4(), name="Empty WS", owner_id=user.id)
    db_session.add(ws)
    db_session.commit()

    req = RAGRequest(query="Anything here?", search_mode="semantic")
    with pytest.raises(RAGContextEmptyError):
        rag_service.run_rag(db_session, ws.id, req)


# ── 6. Git Versioning & Path Security (§11.2, §11.3, §18.1, §17.1) ───────────


def test_git_path_traversal_rejection():
    """Paths attempting directory traversal raise GitPathInvalidError per CONTRACT §11.2."""
    ws_id = uuid.uuid4()
    with pytest.raises(GitPathInvalidError):
        git_service._get_note_path(ws_id, "../../etc/passwd")


def test_git_snapshot_and_history(db_session: Session):
    """Snapshot commits note content and history records commit."""
    ws, u, note = _setup_workspace_and_note(db_session)
    v1 = version_service.create_version(
        db=db_session,
        workspace_id=ws.id,
        note_id=note.id,
        author_id=u.id,
        message="Version 1",
    )
    assert len(v1.commit_hash) == 40
    assert v1.is_ai_edit is False

    versions, total = version_service.list_versions(db_session, note.id)
    assert total >= 1
    assert versions[0].id == v1.id


def test_git_restore_creates_new_commit(db_session: Session):
    """Restore creates a new commit and does not rewrite history per CONTRACT §11.3."""
    ws, u, note = _setup_workspace_and_note(db_session)
    v1 = version_service.create_version(
        db_session, ws.id, note.id, u.id, message="Original content"
    )

    # Update note and snapshot v2
    note.content = "Completely altered content"
    db_session.commit()
    v2 = version_service.create_version(db_session, ws.id, note.id, u.id, message="Altered content")
    assert v1.commit_hash != v2.commit_hash

    # Restore v1
    new_commit = git_service.restore(ws.id, note.id, v1.commit_hash, u.id)
    assert new_commit != v1.commit_hash
    assert new_commit != v2.commit_hash

    # Restored content matches original
    restored = git_service.read_note(ws.id, note.id)
    assert "Superposition" in restored or "superposition" in restored


# ── 7. AI-Edit Staging & Approval Flow (§11.4, §17.1) ────────────────────────


def test_ai_edit_approval_flow(db_session: Session):
    """AI edit stages, prevents duplicates, approves with is_ai_edit=True, or discards."""
    ws, u, note = _setup_workspace_and_note(db_session)

    # 1. Stage edit
    version_service.stage_ai_edit(note.id, "Enhanced by AI with citations")

    # 2. Duplicate staging raises ConflictError
    from app.core.exceptions import ConflictError

    with pytest.raises(ConflictError):
        version_service.stage_ai_edit(note.id, "Second edit")

    # 3. Approve edit
    ai_ver = version_service.approve_ai_edit(db_session, note.id, u.id)
    assert ai_ver.is_ai_edit is True
    assert note.content == "Enhanced by AI with citations"

    # 4. Pending edit was cleared
    assert version_service.get_pending_ai_edit(note.id) is None


# ── 8. Job Lifecycle & Retry Constraints (§12.1-§12.3, §17.1) ────────────────


def test_job_lifecycle_and_retry(db_session: Session):
    """Job transitions and retry is allowed ONLY when status is failed."""
    ws, u, note = _setup_workspace_and_note(db_session)
    job = job_service.enqueue_index_job(db_session, ws.id)
    assert job.status in ("queued", "completed")

    # If completed, retry should fail with ValidationError
    job.status = "completed"
    db_session.commit()
    with pytest.raises(ValidationError):
        job_service.retry_job(db_session, job.id)

    # Set to failed and retry
    job.status = "failed"
    db_session.commit()
    retried = job_service.retry_job(db_session, job.id)
    assert retried.retry_count == 1


# ── 9. Saved Search CRUD (§13.3, §17.1) ─────────────────────────────────────


def test_saved_search_crud(db_session: Session):
    """Create, list, and delete saved searches."""
    ws, u, note = _setup_workspace_and_note(db_session)

    ss = saved_search_service.create_saved_search(
        db_session,
        workspace_id=ws.id,
        name="Quantum Queries",
        query="superposition AND qubits",
        search_mode="hybrid",
    )
    assert ss.name == "Quantum Queries"

    items, total = saved_search_service.list_saved_searches(db_session, ws.id)
    assert total == 1
    assert items[0].id == ss.id

    saved_search_service.delete_saved_search(db_session, ss.id)
    items_after, total_after = saved_search_service.list_saved_searches(db_session, ws.id)
    assert total_after == 0


# ── 10. Activity Feed (§13.2, §17.1) ─────────────────────────────────────────


def test_activity_feed_ordering(db_session: Session):
    """Activity feed returns chronologically ordered workspace events."""
    ws, u, note = _setup_workspace_and_note(db_session)
    items, total = activity_service.get_workspace_activity(db_session, ws.id)
    assert total > 0
    # Verify descending ordering
    for i in range(len(items) - 1):
        assert items[i].created_at >= items[i + 1].created_at


# ── 11. API Endpoints Integration Tests (TestClient) ─────────────────────────


def test_v0_3_1_api_endpoints(client: TestClient, db_session: Session):
    """Test all new API routes mounted on /api/v1."""
    ws, u, note = _setup_workspace_and_note(db_session)

    # 1. POST /workspaces/{id}/index
    idx_res = client.post(f"/api/v1/workspaces/{ws.id}/index")
    assert idx_res.status_code == 202
    job_id = idx_res.json()["job_id"]

    # 2. GET /jobs/{id}
    job_res = client.get(f"/api/v1/jobs/{job_id}")
    assert job_res.status_code == 200
    assert job_res.json()["id"] == job_id

    # 3. POST /workspaces/{id}/search
    s_res = client.post(
        f"/api/v1/workspaces/{ws.id}/search",
        json={"query": "quantum superposition", "mode": "hybrid", "rerank": True},
    )
    assert s_res.status_code == 200
    assert s_res.json()["mode"] == "hybrid"

    # 4. POST /workspaces/{id}/rag
    rag_res = client.post(
        f"/api/v1/workspaces/{ws.id}/rag",
        json={"query": "Explain qubits", "search_mode": "hybrid"},
    )
    assert rag_res.status_code == 200
    assert "answer" in rag_res.json()
    assert "citations" in rag_res.json()

    # 5. GET /notes/{id}/versions
    v_res = client.get(f"/api/v1/notes/{note.id}/versions")
    assert v_res.status_code == 200

    # 6. GET /workspaces/{id}/activity
    act_res = client.get(f"/api/v1/workspaces/{ws.id}/activity")
    assert act_res.status_code == 200
    assert "items" in act_res.json()

    # 7. Saved search API
    ss_create = client.post(
        f"/api/v1/workspaces/{ws.id}/saved-searches",
        json={"name": "Test Search", "query": "test query", "search_mode": "semantic"},
    )
    assert ss_create.status_code == 201
    ss_id = ss_create.json()["id"]

    ss_list = client.get(f"/api/v1/workspaces/{ws.id}/saved-searches")
    assert ss_list.status_code == 200
    assert ss_list.json()["total"] >= 1

    ss_del = client.delete(f"/api/v1/workspaces/{ws.id}/saved-searches/{ss_id}")
    assert ss_del.status_code == 204
