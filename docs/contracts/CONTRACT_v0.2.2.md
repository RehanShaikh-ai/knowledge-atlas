# Knowledge Atlas v0.2.2 — Knowledge Expansion Contract (Revision 2)

**Document status:** Corrected — supersedes the planning draft following technical review, with the team role reassignment in §3 applied throughout.
**Release:** v0.2.2
**Status:** Planning and architecture
**Predecessor:** `CONTRACT_v0.2.1.md` (Revision 2)
**Primary goal:** Turn Knowledge Atlas into a structured knowledge workspace that can import existing knowledge, visualize relationships, and provide transparent insights.

A Revision Log appears at the end of this document.

---

# 1. Objective

v0.2.2 introduces three connected capabilities:

1. **Source Ingestion** — import Markdown, text, PDFs, and Obsidian vaults into existing workspaces.
2. **Knowledge Graph** — visualize notes and their explicit relationships.
3. **Knowledge Dashboard** — surface transparent, factual statistics about a workspace.

All three must work with the existing workspace, note, user, and note-link architecture established in v0.1.2 and v0.2.1. No duplicate concepts should be introduced where an existing model already fits.

**This release does not implement authentication or authorization.** That remains true from v0.1.2 §2.2 and v0.2.1 §2.2 — nothing in this contract changes it. See §12 for what this means concretely for the security requirements below.

### Core workflow

```text
Obsidian Vault / Files / PDFs
          │
          ▼
Source Import and Parsing
          │
          ▼
Notes + Metadata + Relationships
          │
          ▼
Knowledge Graph
          │
          ▼
Dashboard + Search + Navigation
```

---

# 2. Scope

## 2.1 Included

- Markdown, plain text, PDF, and Obsidian vault/note import
- Obsidian wikilink and tag parsing, YAML frontmatter extraction
- Deterministic duplicate-import handling (upsert, not duplication)
- A `Source` model tracking import provenance
- Workspace-scoped knowledge graph (nodes = notes, edges = note links)
- Workspace dashboard with factual, explainable metrics
- Search and navigation integration for imported content
- Alembic migrations, additive only
- Backend and frontend tests, integration tests

## 2.2 Explicitly Excluded

The following must not be implemented in v0.2.2:

- Authentication and authorization of any kind — still excluded per v0.1.2 §2.2 and v0.2.1 §2.2, not reintroduced here despite the planning draft's mention of "authorized workspaces" (corrected in §12)
- Automatic AI relationship generation or semantic linking
- Embedding pipelines, vector databases, RAG
- AI-generated summaries for imported notes
- OCR, image ingestion
- Web scraping, URL ingestion
- Video and audio ingestion
- Real-time bidirectional Obsidian synchronization
- Automatic conflict resolution
- Real-time collaborative editing
- Advanced graph algorithms (multi-hop traversal, centrality, clustering)
- Typed graph relationships (e.g. "prerequisite of", "contradicts") — reserved for v0.3's knowledge graph
- Knowledge quality or importance scoring
- Automatic deletion from the source Obsidian vault
- Deletion or archival of Knowledge Atlas notes whose source file was removed from the vault (see §5.6 for what happens instead)

These are reserved for later releases.

---

# 3. Workstream Ownership

**Role change, effective this release.** Workstream B and C assignments swap relative to v0.1.2 and v0.2.1: Ali moves from Backend to Infrastructure; Rehan moves from Infrastructure to Backend. Workstream A (Frontend, Hamza) is unchanged. Read earlier contracts with their original, pre-swap assignments for historical context.

Ownership is directory-based unless an explicit exception is defined. Contributors must not modify another workstream's files unless the change is explicitly required by this contract, the owning contributor agrees, and the change is documented in the pull request.

## 3.1 Workstream A — Frontend

**Primary:** Hamza
**Backup:** Ali

Responsible for:

- Source import UI (upload, preview, results)
- Graph visualization
- Dashboard UI
- Frontend types for `Source`, graph, and dashboard responses
- Frontend API modules for sources, graph, dashboard
- Markdown rendering with HTML sanitization (§12.3)
- Loading, empty, and error states
- Frontend tests

Primary directory:

```text
frontend/
```

## 3.2 Workstream B — Infrastructure, Database & Integration

**Primary:** Ali
**Backup:** Rehan

Responsible for:

- Alembic migration for this release (`sources` table, `notes.metadata` column, indexes)
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

Workstream B owns all migration files even though they are located inside `backend/alembic/`.

## 3.3 Workstream C — Backend

**Primary:** Rehan
**Backup:** Hamza

Responsible for:

- `Source` SQLAlchemy model and service layer
- Markdown, wikilink, frontmatter, and tag parsing logic
- Import preview and commit endpoints
- Knowledge graph endpoints
- Dashboard endpoint
- Search integration for imported content
- Backend tests
- Error handling for new error codes (§11)

Primary directory:

```text
backend/app/
backend/tests/
```

Workstream C must not modify Docker Compose configuration or files under `backend/alembic/`.

---

# 4. Canonical Naming Contract

## 4.1 Backend Model Names

| Identifier | Type | File |
|---|---|---|
| `Source` | SQLAlchemy model | `backend/app/models/source.py` |

Extends an existing model (additive column only, no new file):

| Model | Change |
|---|---|
| `Note` | add `metadata: JSONB, nullable` (§6.2) |

## 4.2 Backend Schema Names

```text
SourcePreviewResponse
SourceImportResponse
SourceResponse
SourceListResponse
GraphResponse
GraphNode / GraphEdge   (nested within GraphResponse)
DashboardResponse
```

All defined under `backend/app/schemas/`.

## 4.3 Backend Service Names

| File | Canonical functions |
|---|---|
| `backend/app/services/source_service.py` | `preview_import`, `commit_import`, `get_source`, `list_sources` |
| `backend/app/services/obsidian_parser.py` | `parse_markdown_note`, `parse_wikilinks`, `parse_frontmatter`, `parse_tags` |
| `backend/app/services/graph_service.py` | `get_workspace_graph`, `get_note_neighborhood` |
| `backend/app/services/dashboard_service.py` | `get_workspace_dashboard` |

## 4.4 Database Table Names

```text
sources
```

`notes` gains a column; no new table is needed for metadata (§6.2).

## 4.5 Frontend Type Names

| Identifier | File |
|---|---|
| `Source` | `frontend/src/types/source.ts` |
| `SourcePreviewResult` | `frontend/src/types/source.ts` |
| `SourceImportResult` | `frontend/src/types/source.ts` |
| `GraphNode` / `GraphEdge` / `GraphResponse` | `frontend/src/types/graph.ts` |
| `DashboardStats` | `frontend/src/types/dashboard.ts` |

## 4.6 Frontend API Function Names

| Function | File |
|---|---|
| `previewImport()` | `frontend/src/api/sources.ts` |
| `commitImport()` | `frontend/src/api/sources.ts` |
| `listSources()` | `frontend/src/api/sources.ts` |
| `getSource()` | `frontend/src/api/sources.ts` |
| `getWorkspaceGraph()` | `frontend/src/api/graph.ts` |
| `getNoteNeighborhood()` | `frontend/src/api/graph.ts` |
| `getWorkspaceDashboard()` | `frontend/src/api/dashboard.ts` |

## 4.7 Frontend Component Names

```text
ImportWizard
ImportPreview
ImportResults
GraphView
NoteDetailPanel
DashboardView
DashboardMetricCard
```

Suggested directories: `frontend/src/components/` (all above except `DashboardView`, which is a page under `frontend/src/pages/`).

---

# 5. Source Domain Contract

## 5.1 Source Model

Canonical file: `backend/app/models/source.py`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | Yes | Primary key, SQLAlchemy-generated |
| `workspace_id` | UUID | Yes | FK → `workspaces.id ON DELETE CASCADE` |
| `note_id` | UUID | No | FK → `notes.id ON DELETE SET NULL` — null if the resulting note was later deleted |
| `source_type` | String(30) | Yes | One of: `markdown`, `text`, `pdf`, `obsidian_vault`, `obsidian_note` |
| `original_path` | String(500) | Yes | Original filename or vault-relative path |
| `source_identifier` | String(500) | Yes | Stable dedup key — normalized `original_path` |
| `content_hash` | String(64) | Yes | SHA-256 hex digest of raw source content |
| `import_batch_id` | UUID | Yes | Groups all sources created in one import operation |
| `import_status` | String(20) | Yes | One of: `pending`, `processing`, `completed`, `failed`, `skipped` |
| `raw_metadata` | JSONB | No | Arbitrary frontmatter properties not mapped to a structured field (§5.4) |
| `error_message` | Text | No | Populated when `import_status = failed` |
| `imported_at` | DateTime(UTC) | Yes | First successful import timestamp |
| `last_synced_at` | DateTime(UTC) | No | Timestamp of the most recent re-import that touched this source |

Constraints:

- Unique on `(workspace_id, source_identifier)` — the dedup key (§5.5)

## 5.2 Obsidian Parsing Rules

### Wikilinks

All three forms resolve to a `note_links` row once both notes exist:

```text
[[Note Title]]              → link to the note with matching title
[[Note Title|Display Text]] → link to the note with matching title; display text is a rendering concern only, not stored
[[Note Title#Heading]]      → link to the note with matching title; heading anchor is not stored in v0.2.2 (note-level linking, not heading-level)
```

Link resolution matches by note `title` within the same workspace, case-insensitively, after trimming.

### Tags

```text
#machine-learning          → single tag "machine-learning"
#research/deep-learning    → single tag "research/deep-learning" (see below)
```

**Nested tag paths are stored as a single literal tag string in v0.2.2.** `#research/deep-learning` becomes one `Tag` row with `name = "research/deep-learning"`, using the existing flat `Tag` model from v0.2.1 §6 unchanged. No hierarchy, parent-tag, or path-based filtering exists in this release — a `research/deep-learning` tag and a separately-existing `research` tag are unrelated rows.

This is deliberate: it requires zero changes to the existing `Tag` schema and ships correctly today. It's revisited without a breaking migration later, since the raw tag string is preserved either way — see §18 for why this specific decision needs a contract amendment if it changes.

### Frontmatter

```yaml
---
title: Neural Networks
tags:
  - machine-learning
status: learning
---
```

- A `tags:` list in frontmatter is treated identically to inline `#tags` — no separate handling needed.
- Everything else (e.g. `status: learning`) is stored verbatim in `Source.raw_metadata` as a JSON object. It is not copied onto `Note` directly; `Note.metadata` (§6.2) mirrors it for the currently-linked note so it's queryable without a join.

### Folder Paths

Vault folder structure is preserved in `Source.original_path` (e.g. `"research/ml/neural-networks.md"`). It is metadata only in v0.2.2 — no folder-to-workspace or folder-to-tag mapping is built from it.

## 5.3 Unresolved Links

A wikilink whose target title doesn't match any existing note in the workspace **is not persisted as a database row** — `note_links` (v0.2.1 §7.1) requires both `source_note_id` and `target_note_id` to reference real notes, so there is nowhere to store a link to a note that doesn't exist yet.

Unresolved links are:

- Reported in the import preview and import summary (§7)
- Not stored anywhere — the source note's raw Markdown content is already preserved verbatim (v0.2.1 §5.1), so unresolved links can always be re-derived by re-parsing that content

**Re-resolution.** Every import run re-scans the wikilinks in all notes involved and creates any `note_links` rows that are now resolvable. A previously-unresolved link becomes real automatically once its target note exists in a later import — no manual re-linking step required.

## 5.4 Note Metadata

See §6.2 for the schema change. `Note.metadata` holds the same JSON object as the linked `Source.raw_metadata` as of the last sync. `null` for notes with no associated source (created manually).

## 5.5 Duplicate Handling

Dedup key: `(workspace_id, source_identifier)` (§5.1).

```text
No existing Source with this key?
    → create Source + create Note. import_status = "completed".

Existing Source found, content_hash unchanged?
    → import_status = "skipped". last_synced_at updated. No note change.

Existing Source found, content_hash changed?
    → update the linked Note's title/content/metadata in place (upsert).
      import_status = "completed". last_synced_at updated.
      The Note's id, created_at, and created_by are unchanged
      (v0.2.1 §5.2 immutability rules still apply).
```

Re-running the same import must never create a second `Note` for the same source file.

## 5.6 Removed-Source Handling

If a re-import no longer includes a file that was previously imported, the resulting `Note` and its `Source` record are **left untouched** — not deleted, not archived. The import summary reports this as informational ("previously imported, not found in this import: N files"). Deletion or archival of orphaned imports is deferred to a future release (§2.2).

---

# 6. Database Relationship & Migration Contract

## 6.1 New Relationships

```text
workspaces ──ON DELETE CASCADE──▶ sources
notes      ──ON DELETE SET NULL──▶ sources.note_id
```

`sources.note_id` uses `SET NULL`, not `CASCADE`: if a note is deleted, the historical record of what it was imported from should persist for audit purposes even though it no longer points at a live note.

## 6.2 Additive Column: `notes.metadata`

```sql
ALTER TABLE notes ADD COLUMN metadata JSONB NULL;
```

**This is the one permitted exception to the backward-compatibility rule (§15)**, which forbids modifying existing tables. That rule exists to prevent breaking changes — dropped/renamed/retyped columns, or new non-nullable columns with no default. A new nullable column is additive: every existing row gets `NULL` automatically, no existing query is affected, and it's trivially reversible (`DROP COLUMN metadata`).

## 6.3 Indexes

| Index | Table | Columns | Type | Purpose |
|---|---|---|---|---|
| `idx_sources_workspace_identifier` | `sources` | `(workspace_id, source_identifier)` | BTree (unique) | Dedup lookup (§5.5) |
| `idx_sources_workspace_batch` | `sources` | `(workspace_id, import_batch_id)` | BTree | Import summary queries |
| `idx_sources_note_id` | `sources` | `note_id` | BTree | Reverse lookup: note → its source |

## 6.4 Migration Requirements

The v0.2.2 migration must:

- Create `sources` with all fields, constraints, and FKs from §5.1
- Add `notes.metadata` per §6.2
- Include all indexes from §6.3
- Be fully reversible: `downgrade()` drops `sources` and the `metadata` column
- Not modify `users`, `workspaces`, `tags`, `note_tags`, or `note_links` in any way
- Not require manual SQL during normal development

Canonical command: `uv run alembic upgrade head`

Workstream B must verify the migration applies cleanly against a database seeded with v0.1.2/v0.2.1 data, and that `downgrade()` fully reverses it without touching pre-existing tables.

---

# 7. Source Import API Contract

All endpoints under `/api/v1`. All error responses follow §11.

## 7.1 Preview Import

```http
POST /api/v1/workspaces/{workspace_id}/sources/preview
```

`multipart/form-data`: one or more files, or a single vault archive (`.zip`). **This call writes nothing to the database** — every import must go through preview first; there is no "where practical" exception.

Response `200 OK`:

```json
{
  "detected_notes": [
    {
      "original_path": "research/ml/neural-networks.md",
      "title": "Neural Networks",
      "tag_count": 2,
      "outgoing_link_count": 2,
      "is_duplicate": false,
      "will_update_existing": false
    }
  ],
  "unresolved_link_count": 1,
  "warnings": ["1 wikilink could not be resolved within this batch"],
  "errors": []
}
```

Errors: `422 VALIDATION_ERROR` (unsupported file type, oversized file — §7.4). Individual oversized/corrupt files are reported in `errors` rather than failing the whole preview.

## 7.2 Commit Import

```http
POST /api/v1/workspaces/{workspace_id}/sources/import
```

`multipart/form-data`: the same files as preview, plus `created_by` (user UUID).

Response `201 Created`:

```json
{
  "import_batch_id": "uuid",
  "imported": 12,
  "updated": 2,
  "skipped": 3,
  "failed": 1,
  "removed_since_last_import": 0,
  "results": [
    {
      "original_path": "research/ml/neural-networks.md",
      "status": "completed",
      "note_id": "uuid",
      "error": null
    }
  ]
}
```

Errors: `404 WORKSPACE_NOT_FOUND`, `404 USER_NOT_FOUND` (invalid `created_by`), `422 VALIDATION_ERROR`

## 7.3 List / Get Sources

```http
GET /api/v1/workspaces/{workspace_id}/sources
```

Paginated, same shape as existing list endpoints (`items`, `total`, `page`, `page_size`).

```http
GET /api/v1/sources/{source_id}
```

Returns a `SourceResponse`. Error: `404 SOURCE_NOT_FOUND`

## 7.4 File Limits

```text
Maximum individual file size:    25 MB
Maximum files per import batch:  500
Maximum vault archive size:      250 MB
Supported extensions:            .md, .markdown, .txt, .pdf
Supported archive format:        .zip only
```

File type is validated by content inspection (magic bytes), not extension alone (§12.2). A file exceeding these limits is reported as a per-file failure, not an aborted batch.

## 7.5 Idempotency

Preview never writes. Commit follows the upsert behavior in §5.5 — re-submitting identical files produces `skipped` results, never duplicates or errors.

---

# 8. Knowledge Graph API Contract

## 8.1 Workspace Graph

```http
GET /api/v1/workspaces/{workspace_id}/graph
```

| Query parameter | Type | Default | Description |
|---|---|---|---|
| `tag` | string | — | Only include notes with this tag |
| `limit` | integer | `500` | Maximum nodes returned; maximum allowed value `1000` |

Response `200 OK`:

```json
{
  "nodes": [
    { "id": "note-uuid", "title": "Neural Networks", "is_pinned": false, "tag_names": ["machine-learning"], "degree": 3 }
  ],
  "edges": [
    { "source_note_id": "uuid", "target_note_id": "uuid" }
  ],
  "stats": {
    "node_count": 240,
    "edge_count": 310,
    "isolated_count": 12,
    "truncated": false
  }
}
```

`truncated: true` means the workspace has more notes than `limit` and the frontend must show this rather than silently rendering a partial graph as complete (§13.1).

**Scope note.** "Filtering by relationship type" from the planning draft is not implemented — `note_links` has exactly one, untyped relationship kind in this release, so a type filter has no effect. Typed relationships belong to v0.3.

## 8.2 Note Neighborhood

```http
GET /api/v1/notes/{note_id}/graph
```

Returns the note and its directly connected notes (1-hop), same shape as §8.1.

Error: `404 NOTE_NOT_FOUND`

---

# 9. Knowledge Dashboard API Contract

```http
GET /api/v1/workspaces/{workspace_id}/dashboard
```

Response `200 OK`:

```json
{
  "total_notes": 240,
  "total_relationships": 310,
  "total_tags": 18,
  "total_sources": 45,
  "notes_created_last_7_days": 6,
  "isolated_notes_count": 12,
  "most_connected_notes": [{ "id": "uuid", "title": "Neural Networks", "degree": 14 }],
  "tag_distribution": [{ "tag": "machine-learning", "note_count": 32 }],
  "import_status_summary": { "completed": 40, "failed": 2, "skipped": 3 }
}
```

Definitions:

- `isolated_notes_count` uses the identical definition and query logic as `stats.isolated_count` in the graph endpoint (§8.1) — the two numbers must never disagree.
- `most_connected_notes` — top 10 by `degree` (in + out links) descending, ties broken by `updated_at` descending.
- `tag_distribution` — top 10 tags by note count descending.

Error: `404 WORKSPACE_NOT_FOUND`

Every metric here is a count, not a judgment — a highly-connected note isn't automatically more valuable. The dashboard reports facts.

---

# 10. Search & Navigation Integration

Existing search (v0.2.1 §9.4) covers imported notes automatically — they're ordinary `Note` rows already covered by the existing `tsvector` index.

## 10.1 Source Attribution

`Note` (v0.2.1 §16) gains one optional field:

```typescript
export interface Note {
  // ...existing fields from v0.2.1...
  source?: {
    source_type: string;
    original_path: string;
  } | null;
}
```

`null` for manually created notes. This is a computed, read-only field (joined at response time) — `Source.note_id` remains the source of truth.

## 10.2 Navigation

- Clicking an imported note anywhere opens the standard `NoteEditor` — no separate "imported note" view.
- Graph nodes link to `GET /api/v1/notes/{note_id}`.
- Dashboard's `most_connected_notes` links to the corresponding note.

---

# 11. Error Contract

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation"
  }
}
```

| HTTP Status | Code | Trigger |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Invalid request, unsupported file type, empty upload |
| 404 | `WORKSPACE_NOT_FOUND` | Workspace does not exist |
| 404 | `NOTE_NOT_FOUND` | Note does not exist |
| 404 | `SOURCE_NOT_FOUND` | Source record does not exist |
| 404 | `USER_NOT_FOUND` | `created_by` does not reference an existing user |
| 500 | `INTERNAL_SERVER_ERROR` | Unhandled server error |

There is no `409` in this release — duplicate imports are upserted (§5.5), not rejected. A per-file failure (oversized, corrupt, unparseable) is a `failed` entry in the import results (§7.2), not an HTTP error for the whole request.

**Relationship to prior error-code rules.** Consistent with v0.1.1 §12 and v0.2.1 §15: this table takes precedence over the generic status-derived fallback wherever it applies.

Internal exceptions, file paths, and stack traces must never reach the client. Validation failures log full detail server-side; the response carries only the safe `message`. This is the resolution of the planning draft's note about opaque errors: the fix is detailed *logs*, not detailed *response bodies*.

---

# 12. Security & Data Integrity Contract

## 12.1 No Authentication or Authorization in v0.2.2

**Correction to the planning draft.** The draft described "authorized workspaces" and asked for authentication/authorization requirements to be defined. Neither exists yet, and nothing here reintroduces it — v0.1.2 §2.2 and v0.2.1 §2.2 both stand.

There is no login, no session, no way for the API to know who's calling it. Every workspace remains reachable by anyone who knows its ID, exactly as in v0.1.2 and v0.2.1. This is a known, carried-forward limitation, not something v0.2.2 is responsible for fixing.

What v0.2.2 *does* need to defend against is **malicious file content** — a real risk independent of who's allowed to upload it. The rest of this section covers that.

## 12.2 File Upload Safety

- Archive-internal file paths are resolved to their canonical absolute form and rejected if they resolve outside the designated extraction directory — path traversal via `../` in a zip's internal names.
- File type is validated by content inspection (magic bytes), not extension alone.
- Size limits (§7.4) are enforced via streaming/size-checked reads, not "load fully then check."
- A malformed file (corrupt PDF, invalid UTF-8, invalid YAML frontmatter) fails gracefully for that file only — reported in `results[].error` — and must not crash the batch or the request.

## 12.3 Untrusted Content Rendering

Imported content — text, links, frontmatter — is never interpreted as executable instructions.

Concretely: the frontend Markdown renderer (v0.2.1 §14, Workstream A) must sanitize embedded raw HTML for **all** notes, not only imported ones — imported content is simply the first source Knowledge Atlas can no longer assume was self-authored. Rendering unsanitized HTML from note content is a stored-XSS vector regardless of where the note came from.

## 12.4 Duplicate and Re-Import Safety

Per §5.5 and §5.6: importing never overwrites unrelated notes, never silently deletes notes, and behaves predictably on repeated runs.

---

# 13. Frontend Contract

## 13.1 Required UI Capabilities

**Import (`ImportWizard`):** file/vault selection; preview always shown before commit; results display (`ImportResults`) with per-file status; clear indication of skipped/duplicate/failed files.

**Graph (`GraphView`):** interactive visualization, zoom/pan, node selection; `NoteDetailPanel` on click; visible truncation indicator when `stats.truncated = true`; isolated notes visually distinguished, not just invisible.

**Dashboard (`DashboardView`):** all metrics from §9 via `DashboardMetricCard`; links from metrics to filtered note views where applicable.

All three: loading, empty, and error states.

## 13.2 UI Restrictions

The frontend must not:

- Hardcode fake API responses or hardcode user/workspace IDs
- Hide API errors, including per-file import failures
- Render unsanitized HTML from note content (§12.3)
- Assume every uploaded file succeeds
- Render more nodes than the graph endpoint returns without indicating truncation

---

# 14. Testing Contract

## 14.1 Backend Tests

- Wikilink (all three forms), frontmatter, and tag parsing — unit tests
- Nested tag path stored as a single literal string — unit test
- PDF text extraction
- Duplicate re-import → `skipped`, no new note; changed-file re-import → `updated`, same note `id`
- Unresolved link: not persisted; auto-resolves on a later import
- Removed-source re-import: note/source untouched, reported in summary
- File size/type/count limits, magic-byte validation, path traversal rejection
- Preview makes no database writes
- Graph: `truncated` correctness, isolated detection, degree calculation
- Graph/dashboard isolated counts agree
- Dashboard ranking and tie-break correctness
- Search includes imported notes; `Note.source` populated correctly
- All error codes in §11
- All existing v0.1.2/v0.2.1 backend tests still pass

## 14.2 Frontend Tests

- `ImportWizard` preview → commit flow; `ImportResults` per-file status
- `GraphView` renders nodes/edges, `NoteDetailPanel` on selection, truncation indicator
- `DashboardView` renders all metrics
- Markdown renderer sanitizes embedded HTML (deliberately malicious fixture)
- Loading, empty, error states across all three features

## 14.3 Integration Tests

```text
1. Import a small Obsidian vault (wikilinks, tags, one frontmatter property, one unresolved link)
2. Verify notes, tags, resolvable links created; unresolved link reported, not persisted
3. Re-import unchanged — all files report "skipped"
4. Modify one file, re-import — note updates in place, same id
5. Remove one file, re-import — note untouched, reported as removed
6. Fetch workspace graph — counts match imported data
7. Fetch dashboard — metrics match
8. Search for an imported note by title and by tag
9. Existing health endpoint returns 200
```

---

# 15. Backward Compatibility Contract

The following must continue working unchanged:

```http
GET /api/v1/health
POST/GET /api/v1/users, GET /api/v1/users/{id}
POST/GET /api/v1/workspaces, GET /api/v1/workspaces/{id}
POST/GET .../notes, GET/PATCH/DELETE /api/v1/notes/{id}
POST/DELETE .../tags, GET /api/v1/workspaces/{id}/tags
POST/DELETE .../links, GET .../links
GET /api/v1/workspaces/{id}/notes/search
```

Also protected: Docker Compose startup sequence, existing backend/frontend tests, existing CI workflow, existing environment variables, existing API base path.

**The one permitted exception** is the additive `notes.metadata` column (§6.2) — not a violation of "no existing table may be modified," but the specific, narrow, non-breaking case that rule was always meant to allow. No other existing table, column, constraint, or index changes.

---

# 16. Git & Review Contract

## 16.1 Branching

```text
frontend/v0.2.2-knowledge-expansion
backend/v0.2.2-knowledge-expansion
infra/v0.2.2-knowledge-expansion
```

`main` is protected; all changes land via pull request.

## 16.2 Review Requirements

PRs touching any of the following require approval from all three contributors:

```text
docker-compose.yml
.env.example
CONTRACT_v0.2.2.md
backend/app/core/**
backend/app/schemas/**
backend/alembic/**
```

## 16.3 CI Gate

GitHub Actions (`.github/workflows/ci.yml`, unchanged). Backend, frontend, and integration tests (§14) must all pass before merge.

## 16.4 Integration Branch

```bash
git switch main && git pull
git switch -c review/v0.2.2-integration
git merge origin/infra/v0.2.2-knowledge-expansion
git merge origin/backend/v0.2.2-knowledge-expansion
git merge origin/frontend/v0.2.2-knowledge-expansion
```

Merge conflicts are resolved by the Workstream B contributor (**Ali**, per the role swap in §3.2) in coordination with the branch owner. The integration branch is a review environment only.

## 16.5 Development Sequence

1. Inspect existing architecture and reusable models.
2. Write the technical design (affected files, schema, API contracts, risks, milestones) before writing code.
3. Implement backend, then frontend, against the interfaces already fixed here.
4. Add tests alongside implementation.
5. Integrate via the review branch (§16.4).
6. Run the full validation suite.
7. Update documentation.
8. Merge and tag.

---

# 17. AI-Agent Development Rules

Agents must:

- Read this contract before modifying any file
- Modify only files within the assigned workstream
- Use canonical identifiers from §4; never invent alternatives
- Not introduce anything listed in §2.2, regardless of how the request is phrased
- Not weaken validation, file-size limits, or path-traversal protections (§12.2)
- Not remove tests to make CI pass
- Not add credentials or secrets
- Not change dependency versions without documenting it in the PR
- Not silently change API response structures
- Not force-push or merge branches
- Not implement authentication/authorization as a side effect of "securing" the import feature (§12.1) — flag it instead
- Report all changed files, all commands executed, and all failed checks honestly

If this contract is silent or ambiguous on a needed decision, the agent stops and raises it rather than inventing an interface.

---

# 18. Change Management

Requires written agreement from all three contributors, via pull request per §16.2:

- API endpoint paths or HTTP methods
- Request/response schemas
- Database table or column names, including `sources` and `notes.metadata`
- Canonical identifier names (§4)
- Error codes
- File size/type/count limits (§7.4)
- Ownership boundaries
- The tag-hierarchy decision in §5.2 — revisiting flat-string tags for a real hierarchy is expected eventually, but it's schema-affecting and must go through this process, not a quiet refactor

---

# 19. Substitute and Continuity Protocol

| Workstream | Primary | Backup |
|---|---|---|
| Frontend | Hamza | Ali |
| Infrastructure | Ali | Rehan |
| Backend | Rehan | Hamza |

The rotation structure from earlier contracts is preserved — each person backs up a different workstream than their own — reapplied to the new assignments.

The backup contributor reviews this contract, inspects only relevant workstream files, preserves canonical identifiers, avoids unnecessary refactoring, runs required tests, documents incomplete work, and notifies the integration owner (**Ali**, Workstream B) of blockers.

---

# 20. Definition of Done

**Application functionality:**
- [ ] Markdown, text, and PDF import works
- [ ] Obsidian vault import parses wikilinks, tags, and frontmatter
- [ ] Preview always precedes commit
- [ ] Unchanged re-import produces no duplicates; changed re-import updates in place
- [ ] Unresolved links are reported and later auto-resolve
- [ ] Workspace graph renders with correct counts
- [ ] Dashboard shows accurate, defined metrics
- [ ] Imported notes are searchable with source attribution

**Backend:**
- [ ] `Source` model implemented (§5.1); `notes.metadata` added (§6.2)
- [ ] All parsing rules (§5.2) unit-tested
- [ ] Path traversal and file validation implemented (§12.2)
- [ ] All error codes (§11) implemented and tested
- [ ] Graph and dashboard endpoints match §8, §9
- [ ] Backend tests pass, including all existing v0.1.2/v0.2.1 tests

**Frontend:**
- [ ] `ImportWizard`, `GraphView`, `DashboardView`, and §4.7 components implemented
- [ ] Markdown renderer sanitizes embedded HTML for all notes
- [ ] Truncation indicator implemented
- [ ] Frontend tests, build, and lint pass

**Infrastructure:**
- [ ] Migration creates `sources` and adds `notes.metadata`, reversibly, without touching existing tables
- [ ] Indexes present; Docker Compose starts; integration tests and CI pass

**Integration:**
- [ ] Backend/frontend types match; isolated-note counts agree between graph and dashboard
- [ ] Documentation updated (§21)

---

# 21. Documentation Contract

Update: `README.md`, `docs/tech_stack.md`, `docs/architecture/`, `docs/CONTRACT_v0.2.2.md`.

Must cover the `Source` model and import flow, Obsidian parsing behavior (including the tag-flattening decision, since it's the kind of thing a future contributor will wonder about), graph/dashboard API usage, and local dev/testing commands.

---

# 22. Release Boundary

> Build Obsidian-aware ingestion, an explicit knowledge graph, and a transparent dashboard as one connected release — while keeping AI inference, semantic search, and RAG for later.

By the end of this release, a user should be able to import an existing Obsidian vault, see it rendered as a connected graph, and get a factual picture of their workspace — without Knowledge Atlas guessing at meaning it can't yet verify.

---

## Revision Log

**Revision 2** (this document; supersedes the planning draft) resolves a critical scope contradiction, several schema gaps that made stated requirements unimplementable as written, and restructures the document to match the format established by the predecessor contracts. It also applies the team role swap (§3): Ali moves Backend → Infrastructure, Rehan moves Infrastructure → Backend, Hamza unchanged.

**Critical/high-impact:**
- Removed the implied authorization layer from the original §7/§9 — no auth exists yet; the real security surface is malicious file content, not access control (§12.1)
- Added a concrete `Source` model — the draft only listed conceptual fields (§5.1)
- Resolved frontmatter-property storage via `notes.metadata`, explicitly carved out as the one permitted backward-compatibility exception (§6.2, §15)
- Resolved unresolved-wikilink storage — not persisted, re-derived from stored content on later imports (§5.3)
- Resolved nested Obsidian tags — stored as a single literal string on the existing flat `Tag` model, hierarchy deferred (§5.2)
- Removed "filtering by relationship type" — not meaningful with one relationship type; v0.3 scope (§8.1)
- Defined concrete API contracts for import, graph, and dashboard endpoints (§7, §8, §9)

**Structural additions** (present in predecessors, absent from the draft): §3 ownership, §4 canonical naming, §11 full error table, §15 backward compatibility, §16 git/review/CI, §17 full AI-agent rules (was one sentence), §18 change management, §19 continuity protocol, §20 Definition of Done.

**Smaller fixes:** preview made unconditional, not "where practical" (§7.1); file limits specified (§7.4); path traversal mitigation specified (§12.2); stored-XSS risk addressed for all notes, not just imported ones (§12.3); "most connected" given a defined limit and tie-break (§9); search source-attribution field defined (§10.1); dedup strategy committed to a specific key and upsert behavior (§5.5); removed-source behavior specified (§5.6).

Sections not mentioned above are new content addressing gaps the planning draft left entirely open.