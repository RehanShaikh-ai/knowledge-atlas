# Knowledge Atlas — Contract v0.2.1

**Document status:** Corrected — supersedes the proposed draft following technical review.
**Version:** `v0.2.1`
**Name:** Knowledge Foundation
**Status:** Planned
**Predecessor:** `CONTRACT_v0.1.2.md` (Revision 2)

A Revision Log summarizing what changed from the proposed draft appears at the end of this document.

---

# 1. Objective

v0.2.1 transforms Knowledge Atlas from an identity/workspace foundation into a usable knowledge-management system.

The release introduces:

- Notes with Markdown content
- Note organization (tags, pinning, archiving)
- Full-text search across note content, titles, and tags
- Note-to-note linking (foundation for the future knowledge graph)
- A usable notes dashboard
- APIs, database models, migrations, tests, and documentation required to support these features

The release establishes the foundations required for v0.3's knowledge graph without implementing the graph engine itself.

This release does not implement authentication, authorization, AI, semantic search, graph visualization, or any feature listed in §22.

---

# 2. Scope

## 2.1 Included

- Note creation, retrieval, editing, deletion
- Note Markdown content
- Note metadata (title, timestamps, pinned state, archived state)
- Tags (workspace-scoped, normalized, multi-tag per note)
- Pinning
- Archiving and restore
- Paginated, filtered, sorted note listing
- Full-text search (PostgreSQL `tsvector`/`tsquery`, workspace-scoped)
- Note-to-note links
- Frontend notes dashboard
- Frontend note editor
- Alembic migrations
- Backend and frontend tests
- Integration tests
- Documentation updates

## 2.2 Explicitly Excluded

The following must not be implemented in v0.2.1:

- Password-based authentication, OAuth, JWT, session management
- Login, logout
- Role-based access control, workspace invitations, permission management
- Real-time collaboration
- Knowledge graph engine, graph visualization, typed graph relationships
- Automatic entity or relationship extraction
- LLM integration, vector databases, embeddings, semantic search, RAG
- AI-generated content or summaries
- Note version history
- File uploads
- Production deployment
- Billing or subscriptions

These are reserved for later releases. Any contributor or agent encountering a reason to implement one of the above must stop and raise it rather than proceeding.

---

# 3. Workstream Ownership

Ownership is directory-based unless an explicit exception is defined.

Contributors must not modify another workstream's files unless:

1. The change is explicitly required by this contract.
2. The owning contributor agrees to the change.
3. The change is documented in the pull request.

## 3.1 Workstream A — Frontend

**Primary:** Hamza
**Backup:** Rehan

Responsible for:

- React components for notes, dashboard, editor
- TypeScript types for notes, tags, links
- Frontend API modules for notes, tags, links, search
- Note editor (Markdown input, title, tag management, pin/archive)
- Notes dashboard
- Search UI
- Loading, empty, and error states
- Frontend tests
- Frontend environment configuration

Primary directory:

```text
frontend/
```

The frontend contributor must not modify backend Python files, SQLAlchemy models, Pydantic schemas, or Alembic migrations.

## 3.2 Workstream B — Backend

**Primary:** Ali
**Backup:** Hamza

Responsible for:

- SQLAlchemy models: `Note`, `Tag`, `NoteTag`, `NoteLink`
- `backend/app/models/__init__.py` — registering all new models
- Pydantic schemas: `NoteCreate`, `NoteUpdate`, `NoteResponse`, `NoteListResponse`, `TagResponse`, `NoteLinkResponse`
- Service modules: `note_service.py`, `tag_service.py`, `search_service.py`
- API routes: `notes.py`, `tags.py`, `search.py`
- Backend tests
- Error handling for new error codes (§15)

Primary directory:

```text
backend/app/
backend/tests/
```

The backend contributor must not modify Docker Compose configuration or files under `backend/alembic/`.

## 3.3 Workstream C — Infrastructure, Database & Integration

**Primary:** Rehan
**Backup:** Ali

Responsible for:

- Alembic migration for this release (all four new tables)
- Database schema validation
- Docker Compose compatibility
- Integration tests
- CI validation
- Documentation updates
- Integration branch review
- Contract compliance verification

Primary files and directories:

```text
docker-compose.yml
scripts/
tests/integration/
backend/alembic/
backend/alembic.ini
docs/
```

Workstream C owns all migration files even though they are located inside `backend/alembic/`.

---

# 4. Canonical Naming Contract

The identifiers below are canonical for v0.2.1. They must not be renamed independently by any single contributor.

## 4.1 Backend Model Names

| Identifier | Type | File |
|---|---|---|
| `Note` | SQLAlchemy model | `backend/app/models/note.py` |
| `Tag` | SQLAlchemy model | `backend/app/models/tag.py` |
| `NoteTag` | SQLAlchemy model (association) | `backend/app/models/note_tag.py` |
| `NoteLink` | SQLAlchemy model | `backend/app/models/note_link.py` |

## 4.2 Backend Schema Names

| Identifier | Type |
|---|---|
| `NoteCreate` | Pydantic request schema |
| `NoteUpdate` | Pydantic request schema (PATCH) |
| `NoteResponse` | Pydantic response schema |
| `NoteListResponse` | Pydantic paginated list response |
| `TagResponse` | Pydantic response schema |
| `NoteLinkCreate` | Pydantic request schema |
| `NoteLinkResponse` | Pydantic response schema |
| `NoteSearchResponse` | Pydantic search result response |

All defined in their respective files under `backend/app/schemas/`.

## 4.3 Backend Service Names

| File | Canonical function names |
|---|---|
| `backend/app/services/note_service.py` | `create_note`, `get_note`, `list_notes`, `update_note`, `delete_note` |
| `backend/app/services/tag_service.py` | `add_tag_to_note`, `remove_tag_from_note`, `list_workspace_tags` |
| `backend/app/services/search_service.py` | `search_notes` |

## 4.4 Database Table Names

```text
notes
tags
note_tags
note_links
```

## 4.5 Frontend Type Names

| Identifier | File |
|---|---|
| `Note` | `frontend/src/types/note.ts` |
| `NoteCreate` | `frontend/src/types/note.ts` |
| `NoteUpdate` | `frontend/src/types/note.ts` |
| `Tag` | `frontend/src/types/tag.ts` |
| `NoteLink` | `frontend/src/types/note_link.ts` |
| `NoteListResponse` | `frontend/src/types/note.ts` |
| `NoteSearchResponse` | `frontend/src/types/note.ts` |

## 4.6 Frontend API Function Names

| Function | File |
|---|---|
| `createNote()` | `frontend/src/api/notes.ts` |
| `listNotes()` | `frontend/src/api/notes.ts` |
| `getNote()` | `frontend/src/api/notes.ts` |
| `updateNote()` | `frontend/src/api/notes.ts` |
| `deleteNote()` | `frontend/src/api/notes.ts` |
| `searchNotes()` | `frontend/src/api/notes.ts` |
| `addTag()` | `frontend/src/api/tags.ts` |
| `removeTag()` | `frontend/src/api/tags.ts` |
| `listWorkspaceTags()` | `frontend/src/api/tags.ts` |
| `createNoteLink()` | `frontend/src/api/note_links.ts` |
| `deleteNoteLink()` | `frontend/src/api/note_links.ts` |
| `getNoteLinkss()` | `frontend/src/api/note_links.ts` |

## 4.7 Frontend Component Names

| Component | File |
|---|---|
| `NotesDashboard` | `frontend/src/pages/NotesDashboard.tsx` |
| `NoteEditor` | `frontend/src/components/NoteEditor.tsx` |
| `NoteList` | `frontend/src/components/NoteList.tsx` |
| `NoteCard` | `frontend/src/components/NoteCard.tsx` |
| `TagFilter` | `frontend/src/components/TagFilter.tsx` |
| `SearchBar` | `frontend/src/components/SearchBar.tsx` |

---

# 5. Note Domain Contract

## 5.1 Note Model

Canonical file:

```text
backend/app/models/note.py
```

Required fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Yes | Primary key, SQLAlchemy-generated |
| `workspace_id` | UUID | Yes | FK → `workspaces.id ON DELETE CASCADE` |
| `created_by` | UUID | Yes | FK → `users.id ON DELETE RESTRICT` |
| `title` | String(255) | Yes | Note title |
| `content` | Text | Yes | Markdown source |
| `created_at` | DateTime(UTC) | Yes | Immutable, set on creation |
| `updated_at` | DateTime(UTC) | Yes | Updated on every edit |
| `is_pinned` | Boolean | Yes | Default `False` |
| `is_archived` | Boolean | Yes | Default `False` |

UUID generation follows the same SQLAlchemy-level pattern established in v0.1.2 §6:

```python
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

No PostgreSQL extension is required.

## 5.2 Note Field Rules

### Immutable fields

The following fields must not be updated through the note edit API:

```text
id
workspace_id
created_by
created_at
```

`NoteUpdate` (§4.2) must not include these fields. If they appear in a PATCH request body, they must be silently ignored or rejected with a `VALIDATION_ERROR`.

### Editable fields

The following fields may be changed via PATCH:

```text
title
content
is_pinned
is_archived
```

### `title`

- Required
- Must not be empty or whitespace-only
- Maximum 255 characters

### `content`

- Required (may be empty string for a new blank note)
- Stores raw Markdown source
- No server-side Markdown parsing or sanitization required in v0.2.1
- Maximum length: 100,000 characters

### Timestamps

- All timestamps stored in UTC
- `created_at` set by the server at creation; never accepted from clients
- `updated_at` set by the server at creation and on every successful PATCH; never accepted from clients

---

# 6. Tag Domain Contract

Tags are workspace-scoped database rows, not global strings.

A tag named `"ml"` in workspace A and `"ml"` in workspace B are distinct rows in the `tags` table. They share a display name but have different `id` values and different `workspace_id` values.

## 6.1 Tag Model

Canonical file:

```text
backend/app/models/tag.py
```

Required fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Yes | Primary key, SQLAlchemy-generated |
| `workspace_id` | UUID | Yes | FK → `workspaces.id ON DELETE CASCADE` |
| `name` | String(50) | Yes | Tag display name |

Constraints:

- Unique on `(workspace_id, name)` — the same tag name cannot appear twice in the same workspace
- `name` must be lowercase, trimmed, and contain no whitespace
- Maximum 50 characters

## 6.2 NoteTag Association

Canonical file:

```text
backend/app/models/note_tag.py
```

This is a pure association table. No additional fields beyond the two FKs.

| Field | Type | Description |
|---|---|---|
| `note_id` | UUID | FK → `notes.id ON DELETE CASCADE` |
| `tag_id` | UUID | FK → `tags.id ON DELETE CASCADE` |

Constraints:

- Composite primary key: `(note_id, tag_id)`
- Unique on `(note_id, tag_id)` — the same tag cannot appear twice on the same note (the PK already enforces this, state it explicitly for clarity)

## 6.3 Tag Service Rules

- When adding a tag to a note: look up the tag by `(workspace_id, name)`. If it does not exist, create it. Then create the `NoteTag` association.
- Duplicate tag on the same note: return `409 CONFLICT` with `code: "DUPLICATE_TAG"`.
- Tag and note must belong to the same workspace. Cross-workspace tag assignment returns `422 VALIDATION_ERROR`.

---

# 7. Note-Link Domain Contract

## 7.1 NoteLink Model

Canonical file:

```text
backend/app/models/note_link.py
```

Required fields:

| Field | Type | Description |
|---|---|---|
| `source_note_id` | UUID | FK → `notes.id ON DELETE CASCADE` |
| `target_note_id` | UUID | FK → `notes.id ON DELETE CASCADE` |
| `created_at` | DateTime(UTC) | Set on creation, immutable |

Constraints:

- Composite primary key: `(source_note_id, target_note_id)`
- Unique on `(source_note_id, target_note_id)` — duplicate links return `409 CONFLICT`
- Self-links are forbidden: `source_note_id != target_note_id` must be enforced at the service layer
- Source and target must belong to the same workspace — enforced at the service layer, not only by FK

## 7.2 Note-Link Deletion

Both FK columns carry `ON DELETE CASCADE`. When a note is deleted, all `note_links` rows where it appears as either `source_note_id` or `target_note_id` are automatically removed by the database. The service layer must not attempt manual cleanup of links on note deletion.

## 7.3 Note-Link Service Rules

- Attempt to create a self-link: return `422 VALIDATION_ERROR` with `code: "VALIDATION_ERROR"`, message indicating self-links are not allowed.
- Attempt to link notes from different workspaces: return `422 VALIDATION_ERROR`.
- Duplicate link: return `409 CONFLICT` with `code: "CONFLICT"`.
- Either note not found: return `404 NOT_FOUND` with the appropriate note-specific code.

---

# 8. Database Relationship Contract

```text
workspaces ─────────────────────────────────────────────────────────────┐
     │                                                                   │
     │ ON DELETE CASCADE                                                  │
     ▼                                                                   │
   notes ──────────────────────────────────────┐                        │
     │                                          │                        │
     │ ON DELETE CASCADE                         │ ON DELETE CASCADE      │ ON DELETE CASCADE
     ▼                                          ▼                        ▼
note_links                                   note_tags                  tags
(source_note_id, target_note_id)             (note_id, tag_id)          (workspace_id, name)
```

### `notes.workspace_id`

FK → `workspaces.id ON DELETE CASCADE`

Rationale: a workspace's notes belong to it entirely. Deleting a workspace deletes its notes. This differs from the `owner_id` pattern in v0.1.2, where `ON DELETE RESTRICT` was used because user deletion was outside the API scope. Workspace deletion may eventually be in scope, and the expected behavior is full cascade.

### `notes.created_by`

FK → `users.id ON DELETE RESTRICT`

Rationale: consistent with v0.1.2 §9.1. User deletion is outside scope; notes must not become ownerless.

### `tags.workspace_id`

FK → `workspaces.id ON DELETE CASCADE`

### All association table FKs

`note_tags.note_id`, `note_tags.tag_id`, `note_links.source_note_id`, `note_links.target_note_id`: all `ON DELETE CASCADE`.

## 8.1 Model Registration

Workstream B must keep `backend/app/models/__init__.py` current, importing all four new models:

```python
from app.models.note import Note
from app.models.tag import Tag
from app.models.note_tag import NoteTag
from app.models.note_link import NoteLink
```

This is a direct extension of the pattern established in v0.1.2 §9.2. Workstream C's `alembic/env.py` already imports `Base` from `app.db.base` — as long as `models/__init__.py` is current, Alembic autogenerate will detect all four new tables automatically.

Workstream C must verify that `Base.metadata` contains all four new table names before accepting the migration as complete.

---

# 9. API Contract

All endpoints remain under `/api/v1`. All error responses follow the shape in §15.

## 9.1 Notes Endpoints

### Create Note

```http
POST /api/v1/workspaces/{workspace_id}/notes
```

Request body:

```json
{
  "title": "Understanding Transformers",
  "content": "## Intro\n\nTransformers use attention mechanisms...",
  "created_by": "user-uuid"
}
```

Response `201 Created`:

```json
{
  "id": "note-uuid",
  "workspace_id": "workspace-uuid",
  "created_by": "user-uuid",
  "title": "Understanding Transformers",
  "content": "## Intro\n\nTransformers use attention mechanisms...",
  "is_pinned": false,
  "is_archived": false,
  "tags": [],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

Errors: `404 WORKSPACE_NOT_FOUND`, `404 USER_NOT_FOUND`, `422 VALIDATION_ERROR`

### List Notes

```http
GET /api/v1/workspaces/{workspace_id}/notes
```

Query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | 1-indexed page number |
| `page_size` | integer | `20` | Maximum 100 |
| `tag` | string | — | Filter by tag name |
| `is_pinned` | boolean | — | Filter pinned notes |
| `is_archived` | boolean | `false` | Default excludes archived |
| `sort` | string | `updated_at_desc` | `updated_at_desc`, `updated_at_asc`, `created_at_desc`, `created_at_asc` |

Response `200 OK`:

```json
{
  "items": [{ "...": "NoteResponse" }],
  "total": 42,
  "page": 1,
  "page_size": 20
}
```

### Get Note

```http
GET /api/v1/notes/{note_id}
```

Response `200 OK`: full `NoteResponse`.
Error: `404 NOTE_NOT_FOUND`

### Update Note (partial)

```http
PATCH /api/v1/notes/{note_id}
```

Request body — only editable fields accepted:

```json
{
  "title": "...",
  "content": "...",
  "is_pinned": true,
  "is_archived": false
}
```

All fields are optional. Absent fields are unchanged. `workspace_id`, `created_by`, `created_at`, `id` must not be accepted.

Response `200 OK`: updated `NoteResponse`.
Error: `404 NOTE_NOT_FOUND`, `422 VALIDATION_ERROR`

### Delete Note

```http
DELETE /api/v1/notes/{note_id}
```

Response `204 No Content` (no body).
Error: `404 NOTE_NOT_FOUND`

## 9.2 Tag Endpoints

Tags are managed at the note level. A workspace-level listing is also available.

### Add Tag to Note

```http
POST /api/v1/notes/{note_id}/tags
```

Request body:

```json
{
  "name": "machine-learning"
}
```

Response `201 Created`:

```json
{
  "id": "tag-uuid",
  "workspace_id": "workspace-uuid",
  "name": "machine-learning"
}
```

Errors: `404 NOTE_NOT_FOUND`, `409 CONFLICT` (duplicate tag on note), `422 VALIDATION_ERROR`

### Remove Tag from Note

```http
DELETE /api/v1/notes/{note_id}/tags/{tag_id}
```

Response `204 No Content`.
Errors: `404 NOTE_NOT_FOUND`, `404 TAG_NOT_FOUND`

### List Tags in Workspace

```http
GET /api/v1/workspaces/{workspace_id}/tags
```

Response `200 OK`:

```json
{
  "items": [
    { "id": "tag-uuid", "workspace_id": "workspace-uuid", "name": "ml" }
  ],
  "total": 5
}
```

## 9.3 Note Link Endpoints

### Create Note Link

```http
POST /api/v1/notes/{note_id}/links
```

Request body:

```json
{
  "target_note_id": "target-uuid"
}
```

Response `201 Created`:

```json
{
  "source_note_id": "note-uuid",
  "target_note_id": "target-uuid",
  "created_at": "datetime"
}
```

Errors: `404 NOTE_NOT_FOUND`, `409 CONFLICT` (duplicate link), `422 VALIDATION_ERROR` (self-link or cross-workspace)

### Delete Note Link

```http
DELETE /api/v1/notes/{note_id}/links/{target_note_id}
```

Response `204 No Content`.
Errors: `404 NOTE_NOT_FOUND`

### Get Note Links

```http
GET /api/v1/notes/{note_id}/links
```

Response `200 OK`:

```json
{
  "outgoing": [{ "source_note_id": "...", "target_note_id": "...", "created_at": "..." }],
  "incoming": [{ "source_note_id": "...", "target_note_id": "...", "created_at": "..." }]
}
```

## 9.4 Search Endpoint

```http
GET /api/v1/workspaces/{workspace_id}/notes/search
```

Query parameters:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | Search query (min 1 char, max 200 chars) |
| `page` | integer | No, default `1` | 1-indexed |
| `page_size` | integer | No, default `20` | Maximum 100 |

Empty or whitespace-only `q` returns `422 VALIDATION_ERROR`. The endpoint must never return an unbounded result set — `page_size` is always enforced.

Response `200 OK`:

```json
{
  "items": [{ "...": "NoteResponse" }],
  "total": 10,
  "page": 1,
  "page_size": 20,
  "query": "neural networks"
}
```

---

# 10. Search Implementation Contract

PostgreSQL full-text search via `tsvector`/`tsquery` is the canonical search implementation for v0.2.1.

## 10.1 Search Column

The `notes` table must include a generated `tsvector` column covering `title`, `content`, and associated tag names. A GIN index must be created on this column.

Conceptual migration snippet:

```sql
ALTER TABLE notes
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
) STORED;

CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);
```

Tag names are not stored in `notes` directly, so they must be included in the search query at the service layer by joining `note_tags` and `tags` — or by also maintaining a `tsvector` update trigger. The Workstream B implementer must decide which approach is cleaner given the ORM, but the result must be that searching for a tag name returns notes tagged with it.

## 10.2 Search Query

Search must use `plainto_tsquery` rather than raw `to_tsquery`, so that freeform user input (including untokenized phrases) is handled safely without raising an error on syntax-invalid input.

## 10.3 Architecture Constraint

The search implementation must not introduce any infrastructure dependency outside what is already in the stack (no Elasticsearch, no Typesense, no Redis, no additional Python packages beyond what is already in `pyproject.toml` unless Workstream B documents the addition in the PR). PostgreSQL full-text search is built in and requires nothing new.

The `tsvector`/GIN approach must not be abandoned for `ILIKE` — `ILIKE` has no index support at scale and would require architectural replacement later.

---

# 11. Database Migration Contract

Canonical directory:

```text
backend/alembic/versions/
```

The migration introduced by v0.2.1 must create all four new tables in a single revision:

```text
notes
tags
note_tags
note_links
```

The migration must:

- Be fully reversible: `downgrade()` must drop tables in reverse FK order (`note_links`, `note_tags`, `tags`, `notes`)
- Include the `search_vector` generated column and GIN index on `notes` (§10.1)
- Include all uniqueness constraints described in §6 and §7
- Include all indexes described in §12
- Not modify any existing table from v0.1.1 or v0.1.2

Canonical command:

```bash
uv run alembic upgrade head
```

Workstream C must verify that the migration applies cleanly against a fresh database and that `downgrade()` fully reverses it.

---

# 12. Database Indexes

The following indexes must be created in the migration. They directly support the query patterns in §9.

| Index | Table | Columns | Type | Purpose |
|---|---|---|---|---|
| `idx_notes_workspace_updated` | `notes` | `(workspace_id, updated_at DESC)` | BTree | Workspace note listing, default sort |
| `idx_notes_workspace_created` | `notes` | `(workspace_id, created_at DESC)` | BTree | Created-at sort |
| `idx_notes_workspace_pinned` | `notes` | `(workspace_id, is_pinned)` | BTree | Pinned filter |
| `idx_notes_workspace_archived` | `notes` | `(workspace_id, is_archived)` | BTree | Archived filter |
| `idx_notes_search` | `notes` | `search_vector` | GIN | Full-text search |
| `idx_tags_workspace_name` | `tags` | `(workspace_id, name)` | BTree (unique) | Tag lookup and deduplication |
| `idx_note_tags_tag_id` | `note_tags` | `tag_id` | BTree | Reverse tag lookup |
| `idx_note_links_target` | `note_links` | `target_note_id` | BTree | Incoming link lookup |

---

# 13. Backend Architecture

Follows the existing project structure established in v0.1.2.

```text
backend/app/
├── models/
│   ├── __init__.py          ← Workstream B: must import all four new models
│   ├── note.py
│   ├── tag.py
│   ├── note_tag.py
│   └── note_link.py
│
├── schemas/
│   ├── note.py
│   ├── tag.py
│   └── note_link.py
│
├── services/
│   ├── note_service.py
│   ├── tag_service.py
│   └── search_service.py
│
└── api/
    └── v1/
        ├── router.py        ← Updated to include new sub-routers
        ├── notes.py
        ├── tags.py
        └── search.py
```

Note: the proposed draft used `routes/` for this path. The canonical path remains `api/v1/` to match the existing project convention.

Each new route module defines its own local `router = APIRouter()` instance and is registered through `api_router.include_router(...)` in `router.py`. No route module is mounted directly from `main.py`.

---

# 14. Markdown Contract

The backend stores raw Markdown source and performs no parsing, rendering, or sanitization of note content in v0.2.1.

The frontend is responsible for rendering Markdown to HTML for display.

At minimum, the renderer must correctly handle:

- Headings (`# H1` through `###### H6`)
- Paragraphs
- Bold (`**bold**`) and italic (`*italic*`)
- Ordered and unordered lists
- Links (`[text](url)`)
- Code blocks (fenced: ` ``` `) and inline code (`` `code` ``)
- Blockquotes (`> quote`)

Rich-text WYSIWYG editing is not required for this release.

---

# 15. Error Contract

All errors use the existing structure from v0.1.1/v0.1.2:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation"
  }
}
```

New error codes for v0.2.1:

| HTTP Status | Code | Trigger |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Invalid request data, immutable fields in PATCH, self-link attempt, cross-workspace link attempt, empty search query |
| 404 | `WORKSPACE_NOT_FOUND` | Workspace does not exist |
| 404 | `NOTE_NOT_FOUND` | Note does not exist |
| 404 | `TAG_NOT_FOUND` | Tag does not exist |
| 409 | `CONFLICT` | Duplicate note link |
| 409 | `DUPLICATE_TAG` | Same tag added to the same note twice |
| 500 | `INTERNAL_SERVER_ERROR` | Unhandled server error |

**Relationship to v0.1.1/v0.1.2 error-code rules.** v0.1.1 established a generic `HTTPException` fallback (`404` → `NOT_FOUND`). The table above defines specific codes for known business conditions and takes precedence wherever it applies. The generic fallback still governs any `HTTPException` not listed here (e.g. hitting an undefined route).

Internal exception details, SQL, stack traces, and connection strings must never be returned to the client.

---

# 16. Frontend Type Contract

New canonical types, located in `frontend/src/types/`:

### `note.ts`

```typescript
export interface Note {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_archived: boolean;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
  content: string;
  created_by: string;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface NoteListResponse {
  items: Note[];
  total: number;
  page: number;
  page_size: number;
}

export interface NoteSearchResponse {
  items: Note[];
  total: number;
  page: number;
  page_size: number;
  query: string;
}
```

### `tag.ts`

```typescript
export interface Tag {
  id: string;
  workspace_id: string;
  name: string;
}
```

### `note_link.ts`

```typescript
export interface NoteLink {
  source_note_id: string;
  target_note_id: string;
  created_at: string;
}

export interface NoteLinksResponse {
  outgoing: NoteLink[];
  incoming: NoteLink[];
}
```

---

# 17. Frontend UI Contract

## 17.1 Notes Dashboard

Component: `NotesDashboard`

Must display:

- Pinned notes section (uses `is_pinned` filter)
- Recent notes section (default: `updated_at DESC`, excludes archived)
- Archived notes access (toggle or separate view using `is_archived: true` filter)
- Search bar (`SearchBar`)
- Tag filter sidebar or panel (`TagFilter`)
- Create-note action
- Note count / basic metadata

## 17.2 Note Editor

Component: `NoteEditor`

Must support:

- Create mode (new note)
- Edit mode (existing note)
- Markdown content editor (plain textarea with Markdown rendering preview is acceptable)
- Title editing
- Tag management (add/remove tags)
- Pin/unpin toggle
- Archive/unarchive toggle
- Explicit save action
- Delete action (with confirmation)
- Loading states
- Error states

**Unsaved changes.** A confirmation dialog must be shown if the user navigates away from a dirty editor (whether through in-app navigation or page close via `beforeunload`). Auto-save is not required for v0.2.1.

## 17.3 UI Restrictions

The frontend must not:

- Hardcode fake API responses
- Hide API errors
- Assume every request succeeds
- Generate fake UUIDs for persisted records
- Directly access the database
- Include backend logic
- Duplicate API request logic across components

---

# 18. Testing Contract

## 18.1 Backend Tests

Required coverage:

- Note creation, retrieval, listing, update, deletion
- `NoteUpdate` rejects immutable fields
- Workspace ownership validation
- Validation errors (empty title, over-max-length content)
- Tag: add, remove, duplicate returns `409 DUPLICATE_TAG`
- Tag: cross-workspace assignment returns `422`
- Pinning and archiving via PATCH
- Default list excludes archived notes
- Search returns notes matching `q` in title, content, and tag names
- Search with empty `q` returns `422`
- Note link: create, delete, get outgoing/incoming
- Note link: self-link returns `422`
- Note link: duplicate returns `409 CONFLICT`
- Note link: cross-workspace returns `422`
- Note deletion cascades link removal (via DB, verified by FK constraint test)
- API errors follow canonical error structure for all new error codes
- Pagination parameters respected
- All existing v0.1.2 tests continue to pass

## 18.2 Frontend Tests

Required coverage:

- `NotesDashboard` renders
- `NoteList` renders notes, pinned notes, archived notes
- `NoteCard` renders note metadata
- `NoteEditor` renders in create mode
- `NoteEditor` renders in edit mode with existing data
- `SearchBar` calls `searchNotes()` on input
- `TagFilter` filters note list
- Pin/archive toggles call the correct API function
- Note link creation and deletion
- Loading state renders for all async operations
- Error state renders for API failures
- Empty state renders when no notes exist

## 18.3 Integration Tests

The integration test suite (in `tests/integration/`) must verify the complete flow:

```text
1. Create workspace
2. Create user
3. Create note in workspace
4. Add tag to note
5. Search for note by title
6. Search for note by tag name
7. Link two notes
8. Retrieve note links (outgoing and incoming)
9. Archive note — verify it no longer appears in default list
10. Restore note
11. Delete note — verify note_links rows are removed
12. Existing health endpoint returns 200
```

---

# 19. Backward Compatibility Contract

The following from v0.1.1 and v0.1.2 must continue working unchanged:

```http
GET /api/v1/health → {"status": "ok"} (200)
POST /api/v1/users
GET /api/v1/users/{user_id}
GET /api/v1/users
POST /api/v1/workspaces
GET /api/v1/workspaces/{workspace_id}
GET /api/v1/workspaces
```

The following must not be broken:

- Docker Compose startup sequence (`postgres` → `migrate` → `backend` → `frontend`)
- PostgreSQL connectivity
- Alembic execution
- Existing backend tests
- Existing frontend build and linting
- Existing CI workflows
- Existing environment variable names
- Existing API base path (`/api/v1`)

The v0.2.1 migration must be purely additive — it must not modify any column, constraint, or index on `users` or `workspaces`.

---

# 20. Docker & Environment Contract

Existing service names, ports, and environment variables remain unchanged from v0.1.2.

The `migrate` service introduced in v0.1.2 §21 remains the canonical mechanism for running migrations before the backend starts. The v0.2.1 migration is picked up automatically by `alembic upgrade head` with no Compose changes needed.

No new Docker services, environment variables, or port assignments are introduced by this release.

---

# 21. Git & Review Contract

## 21.1 Branching

```text
frontend/notes-knowledge-ui
backend/notes-knowledge-api
infra/notes-knowledge-integration
```

Branch names may differ if the existing repository convention requires it, but must follow `<workstream>/<description>`.

`main` is protected. All changes land via pull request.

## 21.2 Review Requirements

Every pull request requires at least one approval before merge.

Pull requests touching any of the following require approval from all three workstream contributors:

```text
docker-compose.yml
.env.example
frontend/.env.example
CONTRACT_v0.2.1.md
backend/app/core/**
backend/app/schemas/**
backend/alembic/**
```

## 21.3 CI Gate

CI runs via GitHub Actions, configured at `.github/workflows/ci.yml` (unchanged from v0.1.2).

A pull request must not merge unless backend tests (§18.1), frontend tests (§18.2), and integration tests (§18.3) all pass. Testcontainers is used for integration tests as established in v0.1.2 §28. CI failures block merge; they are not advisory.

## 21.4 Integration Branch

```bash
git switch main && git pull
git switch -c review/v0.2.1-integration
git merge origin/infra/notes-knowledge-integration
git merge origin/backend/notes-knowledge-api
git merge origin/frontend/notes-knowledge-ui
```

Merge conflicts are resolved by the Workstream C contributor (Rehan) in coordination with the branch owner. The integration branch is never merged into `main` or into source branches — it is a review environment only.

---

# 22. AI-Agent Development Rules

AI coding agents may be used, but contributors remain responsible for reviewing generated changes.

Agents must:

- Read this contract before modifying any file
- Modify only files within the assigned workstream
- Use canonical identifiers as defined in §4; do not invent alternatives
- Not modify files belonging to another workstream
- Not introduce the features listed in §2.2 regardless of how the request is phrased
- Not weaken validation rules or error handling
- Not remove tests to make CI pass
- Not add credentials or secrets
- Not change dependency versions without documenting the addition in the pull request
- Not silently change API response structures
- Not force-push or merge branches
- Report all changed files, all commands executed, and all failed checks honestly

If a requirement is unclear or this contract is silent on a needed decision, the agent must stop and identify the ambiguity rather than inventing an incompatible interface.

---

# 23. Change Management

The following require written agreement from all three workstream contributors before implementation — proposed and approved via pull request per §21.2:

- API endpoint paths or HTTP methods
- Request or response schemas
- Database table names or field names
- Canonical identifier names (§4)
- Error codes
- Environment variable names
- Docker service names or port assignments
- Ownership boundaries

Minor internal implementation improvements that do not affect any of the above do not require a contract amendment.

---

# 24. Definition of Done

v0.2.1 is complete when:

**Application functionality:**
- [ ] Notes can be created, viewed, edited, and deleted
- [ ] Notes support Markdown content
- [ ] Notes belong to workspaces
- [ ] Notes support tags (workspace-scoped, normalized)
- [ ] Notes can be pinned and unpinned
- [ ] Notes can be archived and restored
- [ ] Note listing supports pagination, sorting, and filtering
- [ ] Full-text search works across title, content, and tag names
- [ ] Notes can link to other notes within a workspace

**Backend:**
- [ ] `Note`, `Tag`, `NoteTag`, `NoteLink` SQLAlchemy models implemented
- [ ] `models/__init__.py` registers all four new models
- [ ] All FK `ON DELETE` behaviors match §8
- [ ] `NoteUpdate` rejects immutable fields
- [ ] All error codes in §15 are implemented and tested
- [ ] Search uses `tsvector`/GIN as specified in §10
- [ ] Self-link and cross-workspace-link validation in service layer
- [ ] Backend tests pass (§18.1)
- [ ] Existing v0.1.2 backend tests pass

**Frontend:**
- [ ] `NotesDashboard` implemented and shows pinned/recent/archived views
- [ ] `NoteEditor` implemented with Markdown support
- [ ] All canonical components in §4.7 implemented
- [ ] All canonical API functions in §4.6 implemented
- [ ] Unsaved-changes confirmation dialog implemented
- [ ] Loading, empty, and error states implemented
- [ ] Frontend tests pass (§18.2)
- [ ] Frontend build passes
- [ ] Frontend linting passes

**Infrastructure:**
- [ ] Alembic migration creates all four tables with all constraints and indexes (§11, §12)
- [ ] Migration is fully reversible
- [ ] Migration does not modify existing tables
- [ ] `alembic upgrade head` and `alembic downgrade -1` both succeed against a clean database
- [ ] Docker Compose starts successfully
- [ ] Integration tests pass (§18.3)
- [ ] CI passes
- [ ] No secrets committed
- [ ] No unapproved dependency changes

**Integration:**
- [ ] All workstream branches reviewed together
- [ ] Backend response structures match frontend types
- [ ] Database field names match backend models
- [ ] API contracts match frontend expectations
- [ ] Documentation updated (§25)

---

# 25. Documentation Contract

Update where relevant:

```text
README.md
docs/tech_stack.md
docs/architecture/
docs/CONTRACT_v0.2.1.md
```

Documentation must cover:

- Note, tag, note-link data models
- All new API endpoints with request/response examples
- Search implementation approach
- Migration commands
- Local development commands
- Testing commands

---

# 26. Substitute and Continuity Protocol

| Workstream | Primary | Backup |
|---|---|---|
| Frontend | Hamza | Rehan |
| Backend | Ali | Hamza |
| Infrastructure | Rehan | Ali |

The backup contributor reviews this contract, inspects only the relevant workstream files, preserves canonical identifiers, avoids unnecessary refactoring, runs required tests, documents incomplete work, and notifies the integration owner of blockers.

---

# 27. Release Boundary

The central principle of v0.2.1 is:

> Build a usable knowledge foundation — not merely CRUD, and not yet the knowledge graph.

By the end of this release, Knowledge Atlas should function as a basic personal knowledge-management system:

```text
                    Knowledge Atlas
                          │
                     Workspace
                          │
             ┌────────────┼────────────┐
             │            │            │
           Notes         Tags        Search
             │
       ┌─────┴─────┐
       │           │
    Markdown    Metadata
       │
   Note Links
       │
       ▼
 Future Knowledge Graph (v0.3)
```

The next major architectural step is **v0.3: Knowledge Graph**.

---

## Revision Log

**Revision 2** (this document; supersedes the proposed draft) addresses a structural gap between the proposed draft — which reads as a product specification — and the engineering contract format the predecessor documents established.

Added in this revision (absent from the proposed draft entirely):

- §3 — Workstream ownership (who owns every new file and directory)
- §4 — Canonical naming contract (SQLAlchemy model names, Pydantic schema names, service function names, database table names, TypeScript interface names, frontend API function names, frontend component names)
- §8 — Database relationship contract (all FK names and `ON DELETE` behaviors, explicit cascade rationale, `models/__init__.py` ownership)
- §10 — Search implementation contract (`tsvector`/`tsquery`/GIN specified explicitly; `ILIKE` ruled out; `plainto_tsquery` required; no new infrastructure dependencies)
- §12 — Database indexes (all required indexes named with type and purpose)
- §19 — Backward compatibility contract
- §21 — Git & review contract (branch naming, review requirements, CI gate, integration branch workflow)
- §22 — AI-agent constraints
- §23 — Change management

Modified in this revision (present but incomplete in the proposed draft):

- Tag architecture resolved: tags are workspace-scoped DB rows, not global strings (§6)
- Note-link uniqueness constraint, self-link prohibition, and cross-workspace prohibition defined (§7)
- `notes.created_by` FK target and `ON DELETE` behavior defined (§8)
- `PATCH` immutability enforcement and `NoteUpdate` scope defined (§5.2, §9.1)
- `409 CONFLICT` triggers defined per code (`CONFLICT` for duplicate link, `DUPLICATE_TAG` for duplicate tag) (§15)
- Pagination query parameter names stated (`page`, `page_size`, 1-indexed, maximum 100) (§9.1)
- `note_tags` table schema fully specified (§6.2)
- Note-link `ON DELETE CASCADE` stated as DB-level, not service-level cleanup (§7.2)
- `DELETE` response status stated as `204 No Content` (§9.1)
- Search endpoint path defined and response schema defined (§9.4)
- Tag endpoints made required, not optional, with full request/response shapes (§9.2)
- Backend architecture path corrected from `routes/` to `api/v1/` to match project convention (§13)
- Unsaved-changes behavior narrowed to confirmation dialog + `beforeunload`; auto-save ruled out (§17.2)
- `display_name`-style "no secrets" note removed (was an unenforceable validation rule in the predecessor; not applicable here either)
- Migration reversibility made unconditional (§11)