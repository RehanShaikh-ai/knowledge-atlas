# Knowledge Atlas — Contract v0.4.1 (Revision 2)

**Document status:** Corrected — supersedes the planning draft following technical review.
**Release:** v0.4.1
**Name:** Usability, Sources & Persistent Assistant
**Status:** Final engineering contract
**Predecessor:** `CONTRACT_v0.3.2.md` (Revision 1)

A Revision Log appears at the end of this document.

---

# 0. Cross-Workstream Conflict Prevention Protocol

**Carried forward from v0.3.2 §0. Applies unchanged.**

## 0.1 Schema Handoff Gate

Workstream C must not write a single line of Alembic migration until Workstream B has:

1. Finalized all SQLAlchemy model files listed in §6.1
2. Updated `backend/app/models/__init__.py` to import every new or modified model
3. Opened a PR titled exactly `schema-handoff/v0.4.1` containing only those model files and `__init__.py` — no routes, no services, no schemas
4. That PR is approved (one approval from any contributor) and merged to `main`

Workstream C cannot open its migration PR until the schema-handoff PR is merged.

If Workstream B changes a model after handoff, they open `schema-handoff/v0.4.1-patch-N` and Workstream C regenerates the affected migration. No silent in-place model editing after handoff.

## 0.2 Compose Lock

- Any change to `docker-compose.yml` requires a **Compose Change Notice** (PR comment on `main`'s latest commit) before the branch is created
- No Compose PR may be merged while another is open — one at a time
- Workstream B must file a notice (not a PR) if their changes require a new Compose service or volume
- Workstream C owns Compose; Workstream B may not merge Compose changes directly

## 0.3 Environment Variable Handoff

- Workstream B must add any new env var to `backend/app/core/config.py` **and** open a PR against `.env.example` simultaneously or before
- No backend code may reference an env var not yet in `.env.example` on `main`
- Workstream C must not add a var to `.env.example` that Workstream B hasn't requested via this contract (§15) or a documented PR comment

## 0.4 `models/__init__.py` is Workstream B's Responsibility, Always

Every new or modified SQLAlchemy model must be imported in `backend/app/models/__init__.py` **in the same commit as the model file**. Workstream C verifies this before running autogenerate. Workstream C files a bug against Workstream B if an import is missing — it does not work around it.

## 0.5 Integration Branch Creation

The integration branch (`review/v0.4.1-integration`) is created by Workstream C **only after**:

- The schema-handoff PR is merged
- The Compose additions PR is merged (if any)
- All three workstream branches have passing CI individually

Merge order into the integration branch: `infra` → `backend` → `frontend`. Non-negotiable. Merge conflicts resolved by Workstream C (Hamza) in coordination with the branch owner.

---

# 1. Objective

v0.4.1 is a usability and intelligence-access release — not another large intelligence system.

The capabilities built in v0.3.x are powerful. The goal is to make them substantially easier to use.

v0.4.1 introduces:

1. **Frontend redesign** — coherent application shell, navigation, and interaction model
2. **Graph rendering modernization** — performance-benchmarked renderer evaluation and conditional migration
3. **Source System** — first-class file ingestion feeding the existing retrieval pipeline
4. **Persistent AI Assistant** — conversations that survive page reload and support follow-up
5. **Reliability and integration improvements** — exposing what already works

Intended end-to-end user experience:

```text
Sources / Notes
      ↓
Processing + Indexing (ARQ jobs)
      ↓
 ┌────┼────────────┐
 ↓    ↓            ↓
Search Graph   Assistant
         ↓
  Workspace Retrieval
  (vector + graph)
         ↓
         LLM
         ↓
  Cited Response
```

---

# 2. Scope

## 2.1 Included

- Complete frontend redesign (shell, navigation, component consistency, performance)
- Graph renderer benchmark; conditional migration to Sigma.js + Graphology if thresholds met (§5)
- Source System: upload, process, index PDF/Markdown/text; surface in search and RAG
- Source provenance carried to RAG citations
- Persistent `Conversation` and `Message` models with streaming
- Conversation management: create, rename, delete, continue, history
- Workspace-aware assistant retrieval combining vector and graph context
- FreeLLMAPI and Ollama remain supported; no paid providers required
- Playwright E2E tests (Workstream C adds CI integration; Workstream A writes tests)
- Performance: no continuous rendering, LOD labels, async retrieval

## 2.2 Explicitly Excluded

**Sources:** image/video/audio ingestion, OCR, web crawling, browser extension, research-paper-specific processing, advanced source versioning, advanced duplicate detection, evidence/claim extraction.

**Assistant:** autonomous agents, web research, automatic note generation, automatic graph editing, study-material generation, Socratic mode, Personal Knowledge Twin, Knowledge Debugger, Contradiction Tracker.

**Collaboration:** real-time editing, presence, comments, mentions, notifications.

**Platform:** billing, public spaces, enterprise, plugin marketplace, offline-first, distributed processing.

**Infrastructure:** authentication, authorization (still excluded per v0.1.2).

---

# 3. Workstream Ownership

**Role change this release:** Rehan moves to Frontend primary; Ali moves to Backend primary; Hamza moves to Infrastructure primary.

## 3.1 Workstream A — Frontend

**Primary:** Rehan
**Backup:** Ali

Responsible for:

- Complete frontend redesign (shell, navigation, components)
- Source System UI
- AI Assistant UI and conversation management
- Graph visualization and renderer migration/evaluation
- Graph performance UX
- Search, source, graph, and assistant integration
- Loading, empty, error, and retry states
- Responsive behavior
- Playwright E2E test files (§14.3)
- Frontend API modules (§4.6), types (§4.5), components (§4.7)
- Frontend tests, linting, and builds

Primary directory: `frontend/`

Must not modify backend Python files, SQLAlchemy models, Alembic migrations, or `docker-compose.yml`.

## 3.2 Workstream B — Backend

**Primary:** Ali
**Backup:** Rehan

Responsible for:

- `Source` model extensions (§6.1), `Conversation` and `Message` models (§6.2, §6.3)
- `models/__init__.py` — always updated in the same commit as model files
- Source processing and chunking pipeline
- `ContentChunk` unification (§6.4 — replaces separate note/source chunk handling)
- Persistent conversation and message services
- Assistant retrieval orchestration (vector + graph, concurrent)
- Streaming response handling
- All Pydantic schemas (§4.2), API routes (§9), service functions (§4.3)
- Background job definitions for source processing
- Backend tests

Primary directory: `backend/app/`, `backend/tests/`

Must not modify `backend/alembic/` or `docker-compose.yml`. Must file env-var requests per §0.3 and complete the schema-handoff PR per §0.1 before Workstream C starts migrations.

## 3.3 Workstream C — Infrastructure, Database & Integration

**Primary:** Hamza
**Backup:** Rehan

Responsible for:

- Alembic migration — only after schema-handoff PR is merged (§0.1)
- Docker Compose additions (Playwright service for CI — §14.3)
- Environment template additions
- CI validation and Playwright CI integration
- Integration tests
- Scripts, documentation, and integration branch creation (only after §0.5 conditions are met)

Primary files: `docker-compose.yml`, `.env.example`, `scripts/`, `tests/integration/`, `backend/alembic/`, `docs/`

Must not edit `backend/app/models/` or any backend service file. Must post Compose Change Notices per §0.2.

---

# 4. Canonical Naming Contract

## 4.1 Backend Model Names

| Identifier | Type | File | Status |
|---|---|---|---|
| `Source` | SQLAlchemy model | `backend/app/models/source.py` | **Extended** (new fields added to v0.2.2 model) |
| `ContentChunk` | SQLAlchemy model | `backend/app/models/content_chunk.py` | **New** (unifies NoteChunk + SourceChunk) |
| `Conversation` | SQLAlchemy model | `backend/app/models/conversation.py` | **New** |
| `Message` | SQLAlchemy model | `backend/app/models/message.py` | **New** |
| `MessageCitation` | SQLAlchemy model | `backend/app/models/message_citation.py` | **New** |

`NoteChunk` (`backend/app/models/note_chunk.py`) is **deprecated** — all new chunk creation uses `ContentChunk`. Existing `note_chunks` rows are migrated to `content_chunks` (§6.4). `NoteChunk` model file is removed in this release.

`backend/app/models/__init__.py` must be updated in the schema-handoff PR to import all current models and remove `NoteChunk`.

## 4.2 Backend Schema Names

```text
SourceResponse / SourceListResponse
SourceProcessingStatusResponse
ContentChunkResponse
ConversationCreate / ConversationResponse / ConversationListResponse
ConversationRenameRequest
MessageCreate / MessageResponse
AssistantQueryRequest / AssistantStreamEvent
SourceLinkRequest / SourceNoteLink
```

All under `backend/app/schemas/`.

## 4.3 Backend Service Names

| File | Canonical function names |
|---|---|
| `backend/app/services/source_service.py` | `upload_source`, `get_source`, `list_sources`, `delete_source`, `retry_source`, `link_source_to_note` |
| `backend/app/services/source_processing_service.py` | `process_source`, `extract_text`, `chunk_source`, `embed_and_index_source`, `delete_source_chunks` |
| `backend/app/services/conversation_service.py` | `create_conversation`, `get_conversation`, `list_conversations`, `rename_conversation`, `delete_conversation` |
| `backend/app/services/message_service.py` | `create_message`, `list_messages`, `get_message` |
| `backend/app/services/assistant_service.py` | `run_assistant`, `build_assistant_context`, `stream_assistant_response` |

## 4.4 Background Job Function Names

```text
process_source_job      ← triggered on source upload
reindex_source_job      ← triggered on retry
```

Stable ARQ job identifiers — changing them requires re-queuing in-flight jobs and a contract amendment (§18).

## 4.5 Frontend Type Names

| Identifier | File |
|---|---|
| `Source` / `SourceListResponse` / `SourceProcessingStatus` | `frontend/src/types/source.ts` |
| `Conversation` / `ConversationListResponse` | `frontend/src/types/conversation.ts` |
| `Message` / `MessageCitation` | `frontend/src/types/message.ts` |
| `AssistantQueryRequest` / `AssistantStreamEvent` | `frontend/src/types/assistant.ts` |

## 4.6 Frontend API Function Names

| Function | File |
|---|---|
| `uploadSource()` / `listSources()` / `getSource()` / `deleteSource()` / `retrySource()` | `frontend/src/api/sources.ts` |
| `linkSourceToNote()` | `frontend/src/api/sources.ts` |
| `createConversation()` / `listConversations()` / `getConversation()` | `frontend/src/api/conversations.ts` |
| `renameConversation()` / `deleteConversation()` | `frontend/src/api/conversations.ts` |
| `sendMessage()` / `listMessages()` | `frontend/src/api/messages.ts` |
| `streamAssistantResponse()` | `frontend/src/api/assistant.ts` |

## 4.7 Frontend Component Names

```text
AppShell              — top-level layout: sidebar nav + content area
WorkspaceNav          — sidebar navigation (Notes / Sources / Search / Graph / Assistant)
SourceList            — paginated source list with status badges
SourceUploadPanel     — drag-drop / file picker + upload progress
SourceDetailView      — extracted content preview, metadata, processing status
SourceStatusBadge     — PENDING / PROCESSING / READY / FAILED chip
ConversationList      — list of past conversations
ConversationView      — messages + input
MessageBubble         — single message (user or assistant role)
CitationList          — inline citations below an assistant message
CitationCard          — single citation (source/note title + excerpt + similarity)
AssistantInput        — query input with send + streaming indicator
StreamingIndicator    — pulsing state while assistant is generating
```

---

# 5. Graph Renderer Modernization

## 5.1 Evaluation First

Before any migration work begins, Workstream A runs a performance benchmark comparing the existing renderer against a Sigma.js + Graphology implementation.

Test data sizes: **330, 1 000, 5 000, 10 000 nodes** (with proportional edges).

Metrics to measure and document for each:

| Metric | Tool |
|---|---|
| CPU usage (%) | Browser DevTools Performance panel |
| GPU usage (%) | `chrome://gpu` / DevTools |
| Frame time (ms) | `requestAnimationFrame` measurement |
| Memory usage (MB) | DevTools Memory panel |
| Layout time (ms) | Time to stable ForceAtlas2 layout |
| Pan responsiveness | Subjective + frame-time during drag |
| Label render quality | Visual inspection at each zoom level |

The benchmark result must be committed as `docs/benchmarks/v0.4.1-graph-renderer.md` before migration work begins.

## 5.2 Migration Threshold

Migration to Sigma.js + Graphology is **required** if the new renderer achieves **all three** of:

- ≥ 30% lower average CPU usage at 1 000 nodes during active pan
- ≥ 60 FPS (≤ 16.7 ms frame time) at 5 000 nodes during pan
- Zero continuous rendering frames when the graph layout has stabilized (0 CPU from renderer at rest)

If any threshold is not met, the existing renderer is retained. The benchmark document records the result and the decision. Either outcome closes the DoD item.

## 5.3 Target Architecture (if migration proceeds)

```text
Backend Graph API
      ↓
  Graphology        ← data model and layout computation
      ↓
  ForceAtlas2       ← web-worker-based layout (no main-thread block)
      ↓
   Sigma.js         ← WebGL renderer
```

## 5.4 Required Functionality After Migration (or without migration)

All existing graph capabilities must remain available:

- Node and edge rendering
- Node selection and detail panel
- Search and highlighting
- Type, cluster, and note filters
- Neighborhood exploration
- Pan, zoom, fit-to-view
- Cluster/group exploration
- Loading, error, and empty states
- LOD label culling (fewer labels at low zoom, more at high zoom)
- No continuous rendering at rest

---

# 6. Database Schema Contract

**§0.1 applies: no Alembic work until schema-handoff PR is merged.**

## 6.1 `source` Table — Extensions

The existing `sources` table (v0.2.2) receives the following **new columns** only. All existing columns are preserved unchanged.

| New Field | Type | Required | Description |
|---|---|---|---|
| `processing_stage` | String(50) | Yes | Current stage: `upload`, `extract`, `normalize`, `chunk`, `embed`, `index`, `complete` |
| `processing_status` | String(20) | Yes | `PENDING`, `PROCESSING`, `READY`, `FAILED` |
| `file_size_bytes` | BigInteger | No | File size in bytes |
| `page_count` | Integer | No | For PDFs: page count |
| `chunk_count` | Integer | No | Number of chunks created |
| `error_stage` | String(50) | No | Which stage failed (populated on `FAILED`) |

**Note:** The v0.2.2 `import_status` field (`pending`, `processing`, `completed`, `failed`, `skipped`) was import-batch-oriented. The new `processing_status` is source-lifecycle-oriented. Both fields coexist in this release; `import_status` is for vault-import operations, `processing_status` is for the new file-upload pipeline. These are different workflows and must not be confused.

## 6.2 `content_chunks` Table — Unification

`NoteChunk` (`note_chunks` table, v0.3.1) is replaced by `ContentChunk` (`content_chunks` table). The existing `note_chunks` table is migrated into `content_chunks` in the v0.4.1 migration, then dropped.

Canonical file: `backend/app/models/content_chunk.py`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Yes | PK, SQLAlchemy-generated; also used as Qdrant `chunk_id` |
| `workspace_id` | UUID | Yes | FK → `workspaces.id ON DELETE CASCADE` |
| `note_id` | UUID | No | FK → `notes.id ON DELETE CASCADE`; null for source chunks |
| `version_id` | UUID | No | FK → `note_versions.id ON DELETE CASCADE`; null for source chunks |
| `source_id` | UUID | No | FK → `sources.id ON DELETE CASCADE`; null for note chunks |
| `chunk_index` | Integer | Yes | 0-based position |
| `content` | Text | Yes | Raw chunk text |
| `content_hash` | String(64) | Yes | SHA-256 hex digest |
| `token_count` | Integer | Yes | Token count at chunking time |
| `embedding_model` | String(100) | Yes | Model identifier |
| `embedding_dimension` | Integer | Yes | Must match Qdrant collection dimension |
| `created_at` | DateTime(UTC) | Yes | Immutable |

Constraints:

- Exactly one of `note_id` or `source_id` must be non-null (enforced at service layer; not a DB CHECK constraint, due to SQLAlchemy portability)
- Unique on `(note_id, chunk_index)` where `note_id IS NOT NULL`
- Unique on `(source_id, chunk_index)` where `source_id IS NOT NULL`

**Qdrant payload extension:** Source chunks go into the same per-workspace collection as note chunks. Their payload carries all existing v0.3.1 fields plus:

```json
{
  "chunk_id": "uuid",
  "note_id": null,
  "source_id": "uuid",
  "workspace_id": "uuid",
  "version_id": null,
  "chunk_index": 0,
  "content_hash": "...",
  "embedding_model": "...",
  "embedding_dimension": 384,
  "entity_ids": [],
  "cluster_id": null
}
```

Old note-chunk points in Qdrant (from v0.3.1) retain their existing payload fields — `source_id: null` is treated as absent for backward compatibility. The search and retrieval code must handle both old and new payload shapes gracefully.

## 6.3 `conversations` Table

Canonical file: `backend/app/models/conversation.py`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Yes | PK, SQLAlchemy-generated |
| `workspace_id` | UUID | Yes | FK → `workspaces.id ON DELETE CASCADE` |
| `title` | String(200) | Yes | Auto-generated from first user message (first 100 chars, truncated at word boundary). User may rename via PATCH. |
| `created_at` | DateTime(UTC) | Yes | Immutable |
| `updated_at` | DateTime(UTC) | Yes | Updated on every new message |

Constraint: No required fields at creation except `workspace_id`. Title is set when the first message is sent, not at conversation creation time.

## 6.4 `messages` Table

Canonical file: `backend/app/models/message.py`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Yes | PK, SQLAlchemy-generated |
| `conversation_id` | UUID | Yes | FK → `conversations.id ON DELETE CASCADE` |
| `workspace_id` | UUID | Yes | Denormalized; FK → `workspaces.id ON DELETE CASCADE` |
| `role` | String(20) | Yes | `user` or `assistant` |
| `content` | Text | Yes | Message text content |
| `provider` | String(50) | No | LLM provider used (assistant messages only) |
| `model` | String(100) | No | Model name (assistant messages only) |
| `latency_ms` | Integer | No | Generation latency (assistant messages only) |
| `created_at` | DateTime(UTC) | Yes | Immutable |

`role` must be one of the two values above — no free-form strings.

## 6.5 `message_citations` Table

Canonical file: `backend/app/models/message_citation.py`

Citations link an assistant message to the specific chunks it retrieved. Stored as rows, not as JSONB, so they're queryable and maintainable.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Yes | PK, SQLAlchemy-generated |
| `message_id` | UUID | Yes | FK → `messages.id ON DELETE CASCADE` |
| `chunk_id` | UUID | Yes | FK → `content_chunks.id ON DELETE CASCADE` |
| `note_id` | UUID | No | Denormalized from chunk; FK → `notes.id ON DELETE SET NULL` |
| `source_id` | UUID | No | Denormalized from chunk; FK → `sources.id ON DELETE SET NULL` |
| `workspace_id` | UUID | Yes | Denormalized |
| `similarity_score` | Float | Yes | Retrieval similarity (0.0–1.0) — never labelled "confidence" (§8) |
| `rank` | Integer | Yes | Position in retrieval results (1-indexed) |

## 6.6 Source–Note Association

A source can relate to multiple notes (e.g. a PDF that spawns multiple note extracts). This is many-to-many.

New table: `source_note_links`

| Field | Type | Description |
|---|---|---|
| `source_id` | UUID | FK → `sources.id ON DELETE CASCADE` |
| `note_id` | UUID | FK → `notes.id ON DELETE CASCADE` |
| `created_at` | DateTime(UTC) | Immutable |

Composite PK: `(source_id, note_id)`.

## 6.7 Required Indexes

| Index | Table | Columns | Type | Purpose |
|---|---|---|---|---|
| `idx_source_extensions` | `sources` | `(workspace_id, processing_status)` | BTree | Status filtering |
| `idx_content_chunks_note` | `content_chunks` | `note_id` | BTree | Note chunk lookup |
| `idx_content_chunks_source` | `content_chunks` | `source_id` | BTree | Source chunk lookup |
| `idx_content_chunks_workspace` | `content_chunks` | `workspace_id` | BTree | Workspace-wide chunk queries |
| `idx_conversations_workspace` | `conversations` | `(workspace_id, updated_at DESC)` | BTree | Conversation list |
| `idx_messages_conversation` | `messages` | `(conversation_id, created_at ASC)` | BTree | Message history |
| `idx_message_citations_message` | `message_citations` | `message_id` | BTree | Citations for a message |
| `idx_source_note_links_source` | `source_note_links` | `source_id` | BTree | Notes linked to a source |
| `idx_source_note_links_note` | `source_note_links` | `note_id` | BTree | Sources linked to a note |

## 6.8 Migration Requirements

A single Alembic revision for this release must:

- Not be written until the schema-handoff PR is merged (§0.1)
- Add the new `source` columns from §6.1 (additive only — no column drops or renames)
- Create `content_chunks` with all fields, constraints, and indexes
- Migrate all rows from `note_chunks` into `content_chunks` (data migration — `source_id` and `version_id` mapped correctly)
- Drop `note_chunks` after data migration
- Update any FK references from `note_chunks.id` elsewhere (e.g. `entity_chunks.chunk_id`) to point to `content_chunks.id`
- Create `conversations`, `messages`, `message_citations`, `source_note_links`
- Include all indexes from §6.7
- Be fully reversible: `downgrade()` must recreate `note_chunks`, migrate data back, and drop the new tables

The clean-database and existing-database upgrade paths must both be tested by Workstream C before the integration branch is created.

---

# 7. Source Processing Pipeline

## 7.1 Supported Types

| Type | Extensions | Extraction Method |
|---|---|---|
| PDF | `.pdf` | `Docling` (existing, from v0.3.1) or `PyPDF2` fallback |
| Markdown | `.md`, `.markdown` | Direct read + existing Markdown parser |
| Plain text | `.txt` | Direct read |

## 7.2 Pipeline Stages

```text
upload         → file received, Source row created (status=PENDING)
extract        → text extracted from file
normalize      → whitespace normalization, encoding fixes
chunk          → deterministic chunking (same settings as v0.3.1 §8)
embed          → embeddings via existing embedding_service
index          → upsert into Qdrant (existing per-workspace collection)
complete       → processing_status=READY, chunk_count updated
```

On any stage failure: `processing_status=FAILED`, `error_stage` set, `error_message` populated (sanitized — no file paths, no stack traces). The source row is retained and inspectable.

## 7.3 Idempotency and Retry

On retry (`POST /api/v1/sources/{source_id}/retry`):

1. Delete all `content_chunks` rows where `source_id = this source`
2. Delete all Qdrant points where payload `source_id = this source` (existing `delete_note_vectors` pattern, generalized)
3. Reset `processing_status = PENDING`, `processing_stage = upload`, `error_stage = null`, `error_message = null`
4. Enqueue `reindex_source_job`

Delete-then-reindex is the idempotency mechanism. There is no "skip if already indexed" path — partial indexes are never left in place.

## 7.4 File Validation and Security

Identical to v0.2.2 §12.2:

- File type validated by magic bytes, not extension
- Size limits: 25 MB per file, 250 MB for archives
- Path traversal rejected via `pathlib.resolve()` check
- Malformed files fail that source only, not the batch
- Content is untrusted data — never interpreted as instructions

---

# 8. Source Provenance and Citation Language

Every `ContentChunk` from a source carries `source_id` in its Qdrant payload. When RAG retrieves a source chunk, the citation in the response must include:

```json
{
  "chunk_id": "uuid",
  "source_id": "uuid",
  "note_id": null,
  "source_title": "Understanding Transformers.pdf",
  "excerpt": "...chunk text...",
  "similarity_score": 0.87,
  "page_number": 3
}
```

**Terminology requirement.** The field is `similarity_score`, not `confidence_score` or `confidence`. The UI must label it "Similarity" or "Relevance" — never "Confidence." Presenting retrieval similarity as confidence implies a level of factual certainty the system cannot provide.

The assistant must be able to say, in its response, where retrieved information came from. Citations must correspond to real retrieved chunks. The assistant must not invent citation references.

---

# 9. Persistent AI Assistant Contract

## 9.1 Conversation Lifecycle

```text
POST /api/v1/workspaces/{workspace_id}/conversations
  → Creates Conversation with workspace_id; title is null until first message

POST /api/v1/conversations/{conversation_id}/messages
  → Sends user message; triggers assistant response; streams reply
  → On first message: sets Conversation.title from first 100 chars of user message

GET  /api/v1/workspaces/{workspace_id}/conversations
  → Lists conversations (newest first)

GET  /api/v1/conversations/{conversation_id}
  → Returns conversation + messages

PATCH /api/v1/conversations/{conversation_id}
  → Renames conversation (updates title only)

DELETE /api/v1/conversations/{conversation_id}
  → Deletes conversation and all its messages (CASCADE)
```

## 9.2 Message Endpoint

```http
POST /api/v1/conversations/{conversation_id}/messages
```

Request:

```json
{
  "content": "string (1–4000 chars, required)",
  "stream": true
}
```

**Non-streaming** (`stream: false`) — Response `201 Created`:

```json
{
  "user_message": { "id": "uuid", "role": "user", "content": "...", "created_at": "datetime" },
  "assistant_message": {
    "id": "uuid",
    "role": "assistant",
    "content": "...",
    "citations": [{ "...": "MessageCitation shape" }],
    "provider": "ollama",
    "model": "llama3.2",
    "latency_ms": 1340,
    "created_at": "datetime"
  }
}
```

**Streaming** (`stream: true`) — SSE events:

```text
data: {"type": "user_message_created", "message_id": "uuid"}
data: {"type": "chunk", "content": "partial text"}
data: {"type": "done", "message_id": "uuid", "citations": [...], "provider": "...", "model": "..."}
data: {"type": "error", "code": "LLM_PROVIDER_UNAVAILABLE", "message": "..."}
```

Both user and assistant messages are persisted before streaming begins. If the stream fails mid-way, the partial assistant message is retained with whatever content arrived, marked with `error_stage = "stream_interrupted"` in `messages.model` field — this allows the UI to show partial results rather than a blank error.

## 9.3 Assistant Retrieval

The assistant service builds context by running retrieval concurrently:

```text
User message
      ↓
 ┌────┴──────────────────┐
 ↓                       ↓
Vector retrieval     Graph retrieval
(existing v0.3.1     (existing v0.3.2
 retrieval_service)   graph_rag_service.traverse_graph)
 └────────────────────────┘
              ↓
       Context assembly
       (bounded by CONTEXT_TOKEN_LIMIT)
              ↓
  Conversation history injected
  (last N messages, governed by
   CONVERSATION_HISTORY_LIMIT env var)
              ↓
         LLM generation
              ↓
   Persist assistant message
   + MessageCitation rows
```

Graph retrieval runs only if the workspace has graph entities indexed (same degradation behavior as v0.3.2 GraphRAG). If no entities are indexed, it produces empty graph context — the assistant does not fail.

The assistant never retrieves content from a workspace other than `conversation.workspace_id`. Cross-workspace context is a bug, not a feature.

## 9.4 Conversation History Injection

Previous messages in the conversation are included in the LLM prompt, newest-first, truncated to `CONVERSATION_HISTORY_LIMIT` messages (env var, default 10). Combined with retrieved context, total tokens are bounded by `CONTEXT_TOKEN_LIMIT` — if the conversation history would exceed the remaining budget after retrieved context, it is truncated further. The most recent messages are kept over older ones.

---

# 10. API Contract

All endpoints under `/api/v1`. All errors follow §11.

## 10.1 Source Endpoints

```http
POST   /api/v1/workspaces/{workspace_id}/sources/upload
GET    /api/v1/workspaces/{workspace_id}/sources
GET    /api/v1/sources/{source_id}
DELETE /api/v1/sources/{source_id}
POST   /api/v1/sources/{source_id}/retry
POST   /api/v1/sources/{source_id}/link-note
DELETE /api/v1/sources/{source_id}/link-note/{note_id}
```

**Upload:** `multipart/form-data`, single file. Returns `201 Created` with `SourceResponse` immediately (processing is async — job enqueued). No preview-then-commit for single-file upload; preview was designed for batch vault import (v0.2.2) and is not reused here.

**List:** paginated (`page`, `page_size`); filterable by `processing_status`.

**Retry:** only valid for `processing_status = FAILED`. Returns `200 OK` with updated `SourceResponse`. Returns `422 VALIDATION_ERROR` for non-failed sources.

**Link note:** creates a `source_note_links` row. Returns `201 Created`.

## 10.2 Conversation Endpoints

```http
POST   /api/v1/workspaces/{workspace_id}/conversations
GET    /api/v1/workspaces/{workspace_id}/conversations
GET    /api/v1/conversations/{conversation_id}
PATCH  /api/v1/conversations/{conversation_id}
DELETE /api/v1/conversations/{conversation_id}
POST   /api/v1/conversations/{conversation_id}/messages
GET    /api/v1/conversations/{conversation_id}/messages
```

## 10.3 Existing Endpoints — No Change

All source import endpoints from v0.2.2 (`/sources/preview`, `/sources/import`) remain unchanged. The new `/sources/upload` is for single-file direct processing — a different workflow from vault batch import.

All v0.3.1 and v0.3.2 search, RAG, graph, versioning, job, and activity endpoints remain unchanged.

---

# 11. Error Contract

```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable explanation" } }
```

New codes for v0.4.1:

| HTTP Status | Code | Trigger |
|---|---|---|
| 404 | `SOURCE_NOT_FOUND` | Source does not exist |
| 404 | `CONVERSATION_NOT_FOUND` | Conversation does not exist |
| 404 | `MESSAGE_NOT_FOUND` | Message does not exist |
| 422 | `VALIDATION_ERROR` | Invalid request, unsupported file type, empty message |
| 422 | `SOURCE_NOT_RETRYABLE` | Retry attempted on non-failed source |
| 422 | `UNSUPPORTED_SOURCE_TYPE` | File type not in the supported set (§7.1) |
| 500 | `SOURCE_PROCESSING_FAILED` | Source processing job failed after max retries |
| 500 | `LLM_PROVIDER_UNAVAILABLE` | LLM unreachable (pre-existing, now also used for assistant) |
| 500 | `LLM_TIMEOUT` | LLM exceeded timeout (pre-existing) |

All prior error codes from v0.1.1–v0.3.2 remain valid and unchanged.

Internal exceptions, file paths, stack traces, and raw provider error bodies must never reach the client.

---

# 12. LLM Provider Contract

The existing provider abstraction from v0.3.1 §11.1 is unchanged. FreeLLMAPI and Ollama remain supported. No paid provider is required.

Required error handling (unchanged from v0.3.1, now also applied to assistant conversations):

- Timeout → `LLM_TIMEOUT`
- Provider unreachable → `LLM_PROVIDER_UNAVAILABLE`
- Rate limit → `LLM_PROVIDER_UNAVAILABLE` (same error code; the message field carries the distinction)
- Malformed model output → logged server-side, assistant message marked with partial content
- Invalid configuration → startup warning logged; request returns `LLM_PROVIDER_UNAVAILABLE`

A provider failure must not crash the application or corrupt the conversation state. The conversation row and any persisted messages remain intact after a provider failure.

---

# 13. Frontend Redesign Contract

## 13.1 Navigation Structure

```text
AppShell
├── WorkspaceNav
│   ├── Notes
│   ├── Sources      ← new
│   ├── Search
│   ├── Graph
│   └── Assistant    ← new
└── Content area
```

The redesign must be coherent — not page-by-page restyling. Spacing, typography, button shapes, dialog patterns, card layouts, and color use must be consistent across all sections.

## 13.2 Performance Requirements

- Graph renderer must not continuously consume CPU after layout stabilizes (0 idle frames)
- No expensive per-frame backdrop blur or animated canvas decorations
- LOD label culling: fewer labels at low zoom; full labels at high zoom
- Assistant streaming must not block navigation or note editing
- Source processing status updates via polling (not WebSocket) — poll interval maximum 5 seconds; stops polling on `READY` or `FAILED`

## 13.3 Accessibility

Keyboard navigation for all primary actions where practical. Focus management on dialog open/close. Screen-reader-compatible status badges.

## 13.4 Responsive Behavior

The application must remain usable at viewport widths ≥ 768px. The sidebar may collapse to an icon-only rail below 1024px.

---

# 14. Testing Contract

## 14.1 Backend Tests

- Source upload, validation (magic bytes), size limit rejection
- Source processing pipeline: each stage success and failure
- `processing_stage` and `processing_status` transitions
- Retry: existing chunks and Qdrant points deleted before reindex
- Retry rejected for non-failed source (returns `422 SOURCE_NOT_RETRYABLE`)
- Source link creation and deletion
- `ContentChunk` creation for source chunks (correct `source_id`, null `note_id`)
- `ContentChunk` creation for note chunks (correct `note_id`, null `source_id`) — post-migration regression
- Qdrant payload for source chunks includes `source_id`
- Source chunks appear in semantic search results
- Citation `similarity_score` field present; `confidence` field absent
- Conversation CRUD
- Message persistence (user and assistant roles)
- Conversation title auto-generated from first message; null before first message
- `MessageCitation` rows created for retrieved chunks
- Assistant retrieval scoped to `conversation.workspace_id` — no cross-workspace retrieval
- Streaming events delivered in correct order; partial content retained on error
- Conversation history truncated at `CONVERSATION_HISTORY_LIMIT`
- LLM provider failure: conversation state intact; error returned cleanly
- Duplicate `process_source_job` submission: deduplicated (not double-indexed)
- All existing v0.3.2 and earlier regression tests pass

## 14.2 Frontend Tests

- `AppShell` renders all nav items; active section highlighted
- `SourceList` renders sources with correct `SourceStatusBadge`
- `SourceUploadPanel` upload flow; progress indicator
- `SourceDetailView` shows processing stage and error
- Retry button enabled only for FAILED sources
- `ConversationList` renders, opens conversation on click
- New conversation button creates and navigates to empty conversation
- `ConversationView` renders message history; `MessageBubble` role distinction
- `CitationList` renders citations with "Similarity" label (not "Confidence")
- `StreamingIndicator` shown during generation; hidden on `done` event
- Graph: all existing functionality from v0.3.2 still passes
- LOD label behavior: label count changes with zoom level
- No continuous rendering frames at rest (measurable via frame counter in test)
- Loading, empty, error states for all new screens

## 14.3 Playwright E2E Tests

**Workstream C** adds Playwright to the CI Docker Compose stack and `.github/workflows/ci.yml`.
**Workstream A** writes the test files under `tests/e2e/`.

Minimum required scenarios:

```text
Scenario 1: Source → Search
  Upload PDF → wait for READY → search for content → result appears

Scenario 2: Source → Assistant
  Upload and index source → open assistant → ask question about source →
  receive cited response referencing the source → citation shows source title

Scenario 3: Conversation persistence
  Send message → reload page → conversation present in list →
  open conversation → messages present → send follow-up → receives context-aware reply

Scenario 4: Source failure and retry
  Upload invalid-but-accepted file that fails extraction →
  source shows FAILED → retry → source reprocesses → READY

Scenario 5: Provider timeout
  Configure test provider with forced timeout →
  send assistant message → receive LLM_TIMEOUT error →
  conversation state intact → can send new message
```

---

# 15. Environment Variable Contract

New variables for v0.4.1 (additions to existing v0.3.1 table):

| Variable | Type | Default | Description |
|---|---|---|---|
| `CONVERSATION_HISTORY_LIMIT` | Integer | `10` | Max messages from history injected into LLM prompt |
| `SOURCE_MAX_FILE_SIZE_MB` | Integer | `25` | Maximum individual file upload size |
| `SOURCE_PROCESSING_TIMEOUT_SECONDS` | Integer | `120` | Hard timeout for source processing job |

All v0.3.1 variables (`QDRANT_URL`, `REDIS_URL`, `LLM_PROVIDER`, `OLLAMA_BASE_URL`, etc.) remain unchanged.

---

# 16. Docker & CI Contract

## 16.1 Compose Changes

No new runtime services are required. The worker, Qdrant, Redis, and PostgreSQL services from v0.3.1 handle all v0.4.1 workloads.

The only Compose change: Workstream C adds a Playwright service for CI:

```yaml
playwright:
  image: mcr.microsoft.com/playwright:v1.44.0-jammy
  depends_on:
    - frontend
    - backend
  volumes:
    - ./tests/e2e:/tests/e2e
  command: npx playwright test
  profiles:
    - e2e
```

Using `profiles: [e2e]` means the service only runs in CI when explicitly included (`docker compose --profile e2e up playwright`). It does not run during normal `docker compose up`.

Compose Change Notice must be filed before this PR is opened (§0.2).

## 16.2 CI Gate

GitHub Actions (`.github/workflows/ci.yml`). All three test types must pass:

- Backend tests (including migration tests on both clean and existing databases)
- Frontend tests (including renderer idle-frame test)
- Playwright E2E tests (run via `--profile e2e`)

No paid external providers in CI. `DeterministicTestProvider` (v0.3.1 §17.4) used for all LLM calls in tests.

---

# 17. Backward Compatibility Contract

All endpoints from v0.1.1 through v0.3.2 must continue working. The following are explicitly protected:

```http
GET  /api/v1/health
POST/GET /api/v1/users, /users/{id}
POST/GET /api/v1/workspaces, /workspaces/{id}
POST/GET/PATCH/DELETE .../notes, /notes/{id}
POST/DELETE .../tags, .../links
GET  .../notes/search
POST .../sources/preview, .../sources/import
GET  .../sources, /sources/{id}
GET  .../graph, /entities/{id}, /relationships/{id}
GET  .../graph/search, .../clusters
POST .../graph/extract, .../graph/reindex
GET/POST/DELETE .../suggestions, /suggestions/{id}/accept, /suggestions/{id}/reject
GET  .../dashboard
POST .../search, .../rag, .../graph-rag
POST .../index
GET  /api/v1/jobs/{id}, POST .../retry
GET  .../versions, .../versions/{id}, .../diff
POST .../restore, .../ai-edit/approve, DELETE .../ai-edit/pending
GET  .../activity
GET/POST/DELETE .../saved-searches
```

**The one intentional breaking change:** `NoteChunk` becomes `ContentChunk`. Any code that directly queries the `note_chunks` table by name will break. The API does not expose table names, so no API contract changes. Internal services are updated by Workstream B. The migration handles the data move.

---

# 18. Git & Review Contract

## 18.1 Branching

```text
schema-handoff/v0.4.1            ← Workstream B only; merged first
frontend/v0.4.1-ui-sources-assistant
backend/v0.4.1-sources-assistant
infra/v0.4.1-infrastructure-integration
```

## 18.2 Merge Order

1. `schema-handoff/v0.4.1` → `main` (one approval; Workstream B)
2. `infra/v0.4.1-infrastructure-integration` → `main` (two approvals — one from Workstream B confirming migration matches schema handoff)
3. `backend/v0.4.1-sources-assistant` → `main` (one approval)
4. `frontend/v0.4.1-ui-sources-assistant` → `main` (one approval)

Steps 3 and 4 may proceed in parallel once step 2 is merged. Steps 1 and 2 are strictly sequential.

## 18.3 Cross-Workstream Review Files

PRs touching the following require approval from all three contributors:

```text
docker-compose.yml
.env.example
CONTRACT_v0.4.1.md
backend/app/core/**
backend/app/schemas/**
backend/alembic/**
```

## 18.4 Rules

- Never work directly on `main`
- Never force-push
- Never rewrite shared history
- Document cross-workstream changes in the PR description
- Keep commits reviewable

---

# 19. AI-Agent Development Rules

Agents must:

- Read this contract and the README; inspect the repository before writing any file
- Respect the schema-handoff gate (§0.1); Workstream B agents complete `schema-handoff/v0.4.1` before Workstream C touches `backend/alembic/`
- Use the assigned branch; modify only owned workstream files (§3)
- Use canonical identifiers from §4; never invent alternatives
- Not implement anything in §2.2
- Not write `confidence` where `similarity_score` is required (§8)
- Not set `similarity_score` > 1.0 or < 0.0
- Not let AI output modify persistent content without approval (existing rule from v0.3.x)
- Not overwrite manual graph entities during re-extraction (existing rule from v0.3.2)
- Not query or return content from a workspace other than the conversation's `workspace_id`
- Not use a paid external provider in any test or CI path
- Not add credentials or secret values
- Not force-push or merge branches
- Report all changed files, all commands executed, and all failed checks honestly

If this contract is silent or ambiguous on a needed decision, the agent stops and raises the ambiguity rather than inventing an interface.

---

# 20. Change Management

Written agreement from all three contributors required before changing:

- API endpoint paths, HTTP methods, or response shapes
- Database table or column names, including `content_chunks` (the unified table)
- The `NoteChunk → ContentChunk` migration — it is a one-way data migration; reversal is part of `downgrade()` only
- Canonical identifier names (§4)
- Error codes or error shapes, including the `similarity_score` / no-`confidence` rule (§8)
- Conversation history truncation behavior (§9.4)
- The benchmark thresholds for graph renderer migration (§5.2)
- Environment variable names or types
- Scope exclusions in §2.2

---

# 21. Substitute and Continuity Protocol

| Workstream | Primary | Backup |
|---|---|---|
| Frontend | Rehan | Ali |
| Backend | Ali | Rehan |
| Infrastructure | Hamza | Rehan |

Backups review this contract, inspect only relevant workstream files, preserve canonical identifiers, avoid unnecessary refactoring, run required tests, document incomplete work, and notify the integration owner (Hamza, Workstream C) of blockers.

---

# 22. Definition of Done

**Conflict prevention:**
- [ ] Schema-handoff PR merged before any Alembic work begins
- [ ] Compose Change Notice filed before Playwright Compose service PR
- [ ] All new env vars in `.env.example` before referenced in code

**Database:**
- [ ] `note_chunks` migrated to `content_chunks`; `note_chunks` table dropped
- [ ] New `source` columns added without touching existing columns
- [ ] `conversations`, `messages`, `message_citations`, `source_note_links` created
- [ ] All indexes from §6.7 present
- [ ] Migration reversible; downgrade recreates `note_chunks`
- [ ] Migration tested on clean database and existing v0.3.2 database

**Source System:**
- [ ] PDF, Markdown, and plain text upload and processing work
- [ ] All six pipeline stages (`upload`, `extract`, `normalize`, `chunk`, `embed`, `index`) transition correctly
- [ ] Failed source shows `error_stage` and sanitized `error_message`
- [ ] Retry deletes existing chunks and Qdrant points before reindex
- [ ] Retry rejected for non-failed source
- [ ] Source chunks appear in semantic search results
- [ ] Source content available to assistant citations
- [ ] `similarity_score` in citations; no `confidence` field anywhere in new API responses

**Assistant:**
- [ ] Conversations create, persist, rename, delete
- [ ] Conversation title set from first message
- [ ] Message history persists across page reloads
- [ ] Follow-up questions use conversation history (last `CONVERSATION_HISTORY_LIMIT` messages)
- [ ] Streaming works; partial content retained on stream failure
- [ ] `MessageCitation` rows created for all retrieved chunks
- [ ] Assistant retrieval scoped to conversation workspace
- [ ] Provider failure: conversation state intact, error returned cleanly
- [ ] FreeLLMAPI and Ollama work

**Frontend:**
- [ ] `AppShell` and `WorkspaceNav` implemented (Notes / Sources / Search / Graph / Assistant)
- [ ] All §4.7 components implemented and tested
- [ ] Graph renderer benchmark document committed to `docs/benchmarks/v0.4.1-graph-renderer.md`
- [ ] Sigma.js migration complete if thresholds in §5.2 are met; existing renderer retained if not
- [ ] No continuous rendering frames at rest (verified in frontend tests)
- [ ] `CitationCard` labels "Similarity" — never "Confidence"
- [ ] Playwright E2E: all 5 scenarios from §14.3 pass

**CI:**
- [ ] Backend tests pass, including migration tests
- [ ] Frontend tests pass
- [ ] Playwright E2E passes in CI
- [ ] No paid providers in CI
- [ ] All v0.3.2 and earlier regression tests pass

**Documentation:**
- [ ] README updated with Source System, Assistant, graph renderer architecture, new env vars
- [ ] `docs/benchmarks/v0.4.1-graph-renderer.md` committed

---

# 23. Release Boundary

v0.4.1 answers one question:

> How do we make the intelligence already built in Knowledge Atlas actually useful to a person using the application?

The intended experience after this release:

```text
I have knowledge
      ↓
I put it into Knowledge Atlas (notes or files)
      ↓
Knowledge Atlas processes it automatically
      ↓
I can search it semantically
      ↓
I can see its entity relationships in the graph
      ↓
I can ask questions about it in the assistant
      ↓
I can continue that conversation later
      ↓
The assistant tells me where its answers came from
```

Without requiring the user to understand Qdrant, ARQ, embeddings, graph traversal, or LLM providers.

---

## Revision Log

**Revision 2** (this document; supersedes the planning draft) resolves critical schema gaps, a role-assignment error, and the absence of the conflict-prevention protocol that was added in v0.3.2 specifically because of recurring backend–infra conflicts.

**Critical fixes:**
- `Source` table conflict resolved: v0.2.2's `sources` table is *extended*, not replaced; new fields defined (§6.1). The `import_status` vs. `processing_status` duality is called out explicitly.
- `NoteChunk` vs. `SourceChunk` conflict resolved: unified into `ContentChunk` with a single Alembic migration that migrates existing data (§6.2, §6.8)
- `Conversation.citations` resolved: citations are a separate `message_citations` table (not JSONB), queryable and FK-safe (§6.5)
- Schema Handoff Gate re-added (§0) — dropped from the planning draft despite being added in v0.3.2 in direct response to the sprints' conflicts
- Role assignments corrected: backup rotation verified — no contributor backs up their own primary workstream

**High-severity fixes:**
- Full canonical naming contract added (§4)
- Full error-code table added (§11)
- Graph renderer migration threshold made concrete and checkable (§5.2) — "meaningful improvement" replaced with specific CPU/FPS/idle-frame criteria
- `Conversation.title` auto-generation defined (§6.3)
- "Link source to notes" cardinality resolved as many-to-many via `source_note_links` table (§6.6)
- Qdrant payload shape for source chunks defined (§6.2)
- Backward compatibility section added (§17)
- AI-agent constraints section added (§19)
- Change management section added (§20)
- Integration branch protocol formalized (§0.5, §18.2) — "recommended order" replaced with fixed merge sequence with enforcement

**Medium fixes:**
- Playwright CI ownership split: Workstream C adds CI integration; Workstream A writes test files (§14.3, §16.1)
- Source retry mechanism defined as delete-then-reindex (§7.3)
- "Graph retrieval where useful" narrowed: graph retrieval always attempted if entities are indexed; graceful degradation otherwise (§9.3)
- DoD graph renderer item split into benchmark (always required) + migration (conditional) (§22)
- Source provenance terminology enforced: `similarity_score` everywhere; `confidence` nowhere (§8)
- Conversation history truncation mechanism specified (§9.4)
- Streaming failure behavior defined: partial content retained, not discarded (§9.2)