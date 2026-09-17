# v0.1.2 — Identity & Workspace Foundation Engineering Contract (Revision 2)

**Document status:** Corrected — supersedes the proposed draft, following technical review against this project's actual repository state and its v0.1.1 predecessor.
**Release:** v0.1.2
**Project:** Collaborative Second Brain / Knowledge Atlas
**Predecessor:** `CONTRACT_v0.1.1.md` (Revision 3)

A Revision Log summarizing what changed from the proposed draft appears at the end of this document.

---

# 1. Objective

Establish the first application-level foundation for Knowledge Atlas by introducing:

- Users
- Workspaces
- Basic ownership relationships
- Persistent database models
- Backend APIs
- Frontend screens for interacting with users and workspaces

Version `v0.1.1` established the infrastructure foundation but intentionally contained no application-domain functionality.

Version `v0.1.2` introduces the minimum structures required for the application to begin supporting real users and workspaces.

This release does **not** implement full authentication, authorization, collaboration, knowledge graphs, notes, documents, or AI/RAG functionality.

The release must produce the following conceptual system:

```text
Browser
   │
   │ HTTP
   ▼
Frontend :5173
   │
   │ REST / JSON
   ▼
Backend :8080
   │
   │ SQLAlchemy
   ▼
PostgreSQL :5432
   │
   ├── users
   └── workspaces
```

All workstreams must implement their components against the interfaces and identifiers defined in this contract.

A contributor must not need to inspect another contributor's internal implementation to integrate their work.

Only the interfaces explicitly defined in this document may be used for cross-workstream communication.

---

# 2. Release Scope

## 2.1 Included

The following functionality is included:

- User record creation
- User record retrieval
- Basic user listing
- Workspace creation
- Workspace retrieval
- Basic workspace listing
- Workspace ownership through `owner_id`
- PostgreSQL persistence
- SQLAlchemy models
- Alembic migrations
- Backend REST endpoints
- Frontend API integration
- Basic user and workspace interface
- Validation and error handling
- Automated tests
- Docker Compose integration
- Updated technical documentation

## 2.2 Explicitly Excluded

The following functionality must not be implemented in `v0.1.2`:

- Password-based authentication
- Login and logout
- OAuth or social login
- JWT tokens
- Session management
- Role-based access control
- Workspace invitations
- Workspace membership
- Permission management
- Real-time collaboration
- Notes
- Documents
- Knowledge nodes
- Knowledge edges
- Graph visualization
- Embeddings
- Vector databases
- RAG pipelines
- LLM integration
- AI-generated content
- File uploads
- Production deployment
- Billing or subscriptions

These features may be introduced in later contract versions.

---

# 3. Workstream Ownership

Ownership is directory-based unless an explicit exception is defined.

Contributors must not modify another workstream's files unless:

1. The change is explicitly required by this contract.
2. The owning contributor agrees to the change.
3. The change is documented in the pull request.

## 3.1 Workstream A — Frontend

**Primary contributor:** Hamza
**Backup contributor:** Rehan

Responsible for:

- React application changes
- TypeScript types
- Frontend API modules
- User interface for users
- User interface for workspaces
- Loading states
- Empty states
- Error states
- Frontend tests
- Frontend environment configuration
- Frontend Docker compatibility

Primary directory:

```text
frontend/
```

The frontend contributor must not modify backend Python files, database models, or Alembic migrations.

## 3.2 Workstream B — Backend

**Primary contributor:** Ali
**Backup contributor:** Hamza

Responsible for:

- SQLAlchemy models
- Pydantic schemas
- User endpoints
- Workspace endpoints
- Backend service functions
- Backend validation
- Backend tests
- API documentation compatibility
- Application-level error handling

Primary directory:

```text
backend/app/
backend/tests/
```

The backend contributor must not modify Docker Compose configuration or files under `backend/alembic/` — this mirrors the absolute rule already established in v0.1.1 §2.2. "Coordinating with Workstream C" means going through the standard review process (§25.2), not an informal exception to the rule itself; the boundary does not move, only who else signs off on a rare cross-cutting change.

## 3.3 Workstream C — Infrastructure, Database & Integration

**Primary contributor:** Rehan
**Backup contributor:** Ali

Responsible for:

- Alembic migration execution
- Database migration validation
- Docker Compose compatibility
- Integration tests
- Root scripts
- Environment documentation
- Cross-workstream integration
- CI validation
- Contract compliance review

Primary files and directories:

```text
docker-compose.yml
scripts/
tests/integration/
backend/alembic/
backend/alembic.ini
docs/
```

Workstream C owns the migration files, even though they are located inside the backend directory.

---

# 4. Current Repository Structure

The current repository structure after `v0.1.1` is the baseline for this contract.

```text
.
├── backend/
│   ├── alembic/
│   ├── alembic.ini
│   ├── app/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── tests/
│   └── uv.lock
│
├── docker-compose.yml
│
├── docs/
│   ├── architecture/
│   ├── CONTRACT_v0.1.1.md
│   └── tech_stack.md
│
├── frontend/
│   ├── dist/
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── src/
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── LICENSE
├── pyproject.toml
├── README.md
├── scripts/
│   └── dev.sh
├── tests/
│   └── integration/
│
└── uv.lock
```

**Verify before building on this:** this listing does not show `.env.example` or `frontend/.env.example`, both of which v0.1.1 requires (§5, §20 below). Confirm they exist in the real repository — this may just be an abbreviated listing (other subfolders are shown bare too), but it's worth checking given how much weight the predecessor contract puts on the env-file split.

## 4.1 Required Structure Additions

The following directories and files must be created only where they do not already exist:

```text
backend/app/
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── workspace.py
│
├── schemas/
│   ├── user.py
│   └── workspace.py
│
├── services/
│   ├── user_service.py
│   └── workspace_service.py
│
└── api/
    └── v1/
        ├── users.py
        └── workspaces.py
```

The exact existing structure must be inspected before creating duplicate modules.

## 4.2 Generated and Local-Only Files

The following must not be committed unless the existing project explicitly requires them:

```text
frontend/node_modules/
frontend/dist/
__pycache__/
.pytest_cache/
.env
.env.local
```

The existing `.gitignore` must be updated if required.

---

# 5. Canonical Naming Contract

All workstreams must use the identifiers defined below.

Identifiers must not be renamed independently by a single contributor.

## 5.1 Backend Application

Application root:

```text
backend/app/
```

FastAPI application object:

```python
app
```

Import:

```python
from app.main import app
```

Configuration singleton:

```python
settings
```

Import:

```python
from app.core.config import settings
```

Database base:

```python
Base
```

Import:

```python
from app.db.base import Base
```

Database engine:

```python
engine
```

Session factory:

```python
SessionLocal
```

## 5.2 Canonical Domain Names

The following domain names must be used consistently:

```text
User
Workspace
UserCreate
UserResponse
UserListResponse
WorkspaceCreate
WorkspaceResponse
WorkspaceListResponse
```

Database table names:

```text
users
workspaces
```

Primary key field:

```text
id
```

Workspace ownership field:

```text
owner_id
```

---

# 6. Identifier Contract

All user and workspace identifiers must use UUID values.

## 6.1 User Identifier

Canonical field:

```python
id: UUID
```

The database must generate UUID values when a user is created — this means generation happens server-side and is never accepted from the client, not that it must specifically be a PostgreSQL-native function. Canonically, this is a SQLAlchemy-level default:

```python
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

This avoids requiring a PostgreSQL extension (`pgcrypto` or `uuid-ossp`) that a native `gen_random_uuid()` default would need. The client must not be responsible for generating database identifiers.

## 6.2 Workspace Identifier

Canonical field:

```python
id: UUID
```

The same SQLAlchemy-level generation approach as §6.1 applies.

## 6.3 Ownership Identifier

Canonical field:

```python
owner_id: UUID
```

`owner_id` must reference an existing record in the `users` table.

A workspace cannot be created with an owner that does not exist.

---

# 7. User Domain Contract

## 7.1 User Database Model

Canonical file:

```text
backend/app/models/user.py
```

Canonical model name:

```python
User
```

Required fields:

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | Yes | Primary key |
| `display_name` | String | Yes | User's display name |
| `created_at` | DateTime | Yes | Creation timestamp |
| `updated_at` | DateTime | Yes | Last update timestamp |

## 7.2 User Field Rules

### `id`

- Primary key
- UUID type
- Automatically generated
- Immutable
- Must not be accepted as a required client-generated value

### `display_name`

- Required
- Must not be empty
- Must be trimmed before validation
- Must not contain only whitespace
- Must have a defined maximum length

Recommended maximum length:

```text
100 characters
```

**Design note (not a validation rule):** this field is a display name, not a place for secrets, tokens, or credentials — but "does this string look like a secret" isn't something code can reliably detect and reject, so it isn't a checkable requirement. Don't build a rejection filter for it; just don't design any feature that puts a secret here.

### `created_at`

- Generated automatically
- Must not be supplied by the client
- Must remain unchanged after creation

### `updated_at`

- Generated automatically
- Must not be supplied by the client
- Must be updated when supported user fields change

## 7.3 User Request Schema

Canonical file:

```text
backend/app/schemas/user.py
```

Canonical schema:

```python
UserCreate
```

Required request body:

```json
{
  "display_name": "Example User"
}
```

The request must not accept:

```text
id
created_at
updated_at
```

## 7.4 User Response Schema

Canonical schema:

```python
UserResponse
```

Canonical response structure:

```json
{
  "id": "uuid",
  "display_name": "Example User",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

The response must not expose:

- Database credentials
- Internal exception details
- Password fields
- Private server configuration
- Unrelated database columns

---

# 8. Workspace Domain Contract

## 8.1 Workspace Database Model

Canonical file:

```text
backend/app/models/workspace.py
```

Canonical model name:

```python
Workspace
```

Required fields:

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | UUID | Yes | Primary key |
| `name` | String | Yes | Workspace name |
| `description` | String | No | Workspace description |
| `owner_id` | UUID | Yes | User who owns the workspace |
| `created_at` | DateTime | Yes | Creation timestamp |
| `updated_at` | DateTime | Yes | Last update timestamp |

## 8.2 Workspace Field Rules

### `name`

- Required
- Must not be empty
- Must be trimmed
- Must not contain only whitespace
- Must have a defined maximum length

Recommended maximum length:

```text
150 characters
```

### `description`

- Optional
- May be null
- Must have a defined maximum length

Recommended maximum length:

```text
1000 characters
```

### `owner_id`

- Required
- Must reference an existing user
- Must be validated before insertion
- Must not be silently replaced with another user
- Must not be nullable

### Timestamps

The timestamp rules must match the User model.

---

# 9. Database Relationship Contract

The relationship between users and workspaces is:

```text
User 1 ──────────── N Workspace
```

A user may own multiple workspaces.

Each workspace must have exactly one owner in `v0.1.2`.

The database relationship is:

```text
workspaces.owner_id
        │
        ▼
users.id
```

## 9.1 Foreign Key Requirements

The `workspaces.owner_id` field must be a foreign key referencing:

```text
users.id
```

The foreign key must enforce referential integrity using:

```text
ON DELETE RESTRICT
```

This is the only option consistent with the two constraints already stated elsewhere in this contract: it must not silently delete a user's workspaces (rules out `CASCADE`), and `owner_id` must not be nullable (§8.2, rules out `SET NULL`).

User deletion is outside the required API scope for `v0.1.2` — there is no endpoint that can trigger this constraint through the HTTP API. It must instead be verified directly at the database/service layer (see §22.1).

## 9.2 Model Registration

Canonical file:

```text
backend/app/models/__init__.py
```

Owned by Workstream B. It must import both new models so they register on the shared metadata object:

```python
from app.models.user import User
from app.models.workspace import Workspace
```

This extends v0.1.1's Interface I-006 (Alembic ↔ ORM coupling): Workstream C's `alembic/env.py` already imports `Base` from `app.db.base`. As long as Workstream B keeps `models/__init__.py` current, Workstream C needs no additional per-model changes to discover new tables through Alembic autogenerate.

Workstream C must verify that:

```python
Base.metadata
```

contains both:

```text
users
workspaces
```

---

# 10. API Base Path Contract

All new endpoints must use:

```text
/api/v1
```

The API must be registered through the existing canonical router:

```python
api_router
```

The application must not independently mount individual endpoint routers directly from `main.py`.

---

# 11. User API Contract

## 11.1 Create User

```http
POST /api/v1/users
```

Request:

```json
{
  "display_name": "Example User"
}
```

Success response:

```text
201 Created
```

Response body:

```json
{
  "id": "uuid",
  "display_name": "Example User",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## 11.2 Retrieve User

```http
GET /api/v1/users/{user_id}
```

Success response:

```text
200 OK
```

If the user does not exist:

```text
404 Not Found
```

## 11.3 List Users

```http
GET /api/v1/users
```

Success response:

```text
200 OK
```

Canonical response structure:

```json
{
  "items": [
    {
      "id": "uuid",
      "display_name": "Example User",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "total": 1
}
```

Pagination is not mandatory for the initial implementation unless already supported by the existing backend structure.

The response structure must remain consistent between backend and frontend.

---

# 12. Workspace API Contract

## 12.1 Create Workspace

```http
POST /api/v1/workspaces
```

Request:

```json
{
  "name": "My Workspace",
  "description": "A workspace for learning",
  "owner_id": "uuid"
}
```

Success response:

```text
201 Created
```

Response body:

```json
{
  "id": "uuid",
  "name": "My Workspace",
  "description": "A workspace for learning",
  "owner_id": "uuid",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

If the owner does not exist:

```text
404 Not Found
```

## 12.2 Retrieve Workspace

```http
GET /api/v1/workspaces/{workspace_id}
```

Success response:

```text
200 OK
```

If the workspace does not exist:

```text
404 Not Found
```

## 12.3 List Workspaces

```http
GET /api/v1/workspaces
```

Success response:

```text
200 OK
```

Canonical response structure:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "My Workspace",
      "description": "A workspace for learning",
      "owner_id": "uuid",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "total": 1
}
```

The initial list endpoint does not require advanced filtering or sorting.

---

# 13. API Error Contract

All errors must use the existing error structure from `v0.1.1`.

Canonical structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## 13.1 Required Error Codes

| Situation | HTTP Status | Error Code |
|---|---:|---|
| Invalid request data | 422 | `VALIDATION_ERROR` |
| Invalid UUID | 422 | `VALIDATION_ERROR` |
| User not found | 404 | `USER_NOT_FOUND` |
| Workspace not found | 404 | `WORKSPACE_NOT_FOUND` |
| Workspace owner not found | 404 | `USER_NOT_FOUND` |
| Database failure | 500 | `INTERNAL_SERVER_ERROR` |
| Unexpected failure | 500 | `INTERNAL_SERVER_ERROR` |

The exact error code must be stable across backend and frontend.

**Relationship to v0.1.1's error-code rule.** v0.1.1 §12 fixed `code` as the HTTP status's generic reason phrase for the `HTTPException` handler (`404` → `NOT_FOUND`) as a deterministic fallback for errors with no more specific meaning. The table above defines specific codes for known business conditions and takes precedence over that generic fallback wherever a row here applies. The generic fallback still governs any `HTTPException` this contract doesn't specifically name — for example, hitting a genuinely undefined route.

Internal database errors must not be returned directly to the client.

The API must not expose:

- SQL statements
- Stack traces
- Database connection strings
- File paths
- Internal exception messages

---

# 14. Backend Router Contract

Canonical files:

```text
backend/app/api/v1/users.py
backend/app/api/v1/workspaces.py
```

Each module must define its own local router:

```python
router = APIRouter()
```

The routers must be registered through:

```text
backend/app/api/v1/router.py
```

Expected conceptual structure:

```python
api_router.include_router(users.router)
api_router.include_router(workspaces.router)
```

The exact implementation may differ, but the public route paths and HTTP methods must match this contract.

---

# 15. Backend Service Contract

Business logic must not be placed entirely inside route functions.

Canonical service files:

```text
backend/app/services/user_service.py
backend/app/services/workspace_service.py
```

Canonical service responsibilities:

```text
user_service.py
    - Create users
    - Retrieve users
    - List users

workspace_service.py
    - Create workspaces
    - Retrieve workspaces
    - List workspaces
    - Validate workspace ownership
```

Routes are responsible for:

- Receiving HTTP requests
- Calling the appropriate service
- Returning the correct response schema
- Translating known service errors into API errors

Services are responsible for:

- Database operations
- Business validation
- Entity lookup
- Relationship validation

The frontend must not depend on service implementation details.

---

# 16. Frontend API Contract

Canonical directory:

```text
frontend/src/api/
```

Required modules:

```text
frontend/src/api/client.ts
frontend/src/api/users.ts
frontend/src/api/workspaces.ts
```

## 16.1 User API Functions

Canonical functions:

```typescript
createUser()
getUser()
getUsers()
```

The function names may include explicit parameter and return types, but the public responsibilities must remain unchanged.

## 16.2 Workspace API Functions

Canonical functions:

```typescript
createWorkspace()
getWorkspace()
getWorkspaces()
```

React components must not manually construct fetch requests for users or workspaces.

All requests must pass through the API modules.

## 16.3 API Base URL

The frontend must use:

```text
VITE_API_BASE_URL
```

Expected development value:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

This variable is listed among the other canonical environment variables in §20.

The API modules must append endpoint paths without duplicating `/api/v1`.

Correct:

```text
{VITE_API_BASE_URL}/users
{VITE_API_BASE_URL}/workspaces
```

Incorrect:

```text
{VITE_API_BASE_URL}/api/v1/users
```

---

# 17. Frontend Type Contract

Canonical directory:

```text
frontend/src/types/
```

Required types:

```typescript
User
UserCreate
Workspace
WorkspaceCreate
ApiError
```

## 17.1 User Types

```typescript
export interface User {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  display_name: string;
}
```

## 17.2 Workspace Types

```typescript
export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreate {
  name: string;
  description?: string | null;
  owner_id: string;
}
```

## 17.3 Relocating `ApiError`

`ApiError` and `ApiErrorDetail` were originally defined in `frontend/src/types/health.ts` (v0.1.1 §15), which made sense when health was the only consumer. They must move to:

```text
frontend/src/types/api.ts
```

— the file v0.1.1's own deliverables list already anticipated but never actually populated. `health.ts` keeps only `HealthResponse`; every module that previously imported `ApiError` from `health.ts` must update its import path.

The frontend must use these shared types rather than duplicating equivalent inline object definitions throughout components.

---

# 18. Frontend UI Contract

The frontend must provide a basic interface for testing the new functionality.

The UI is functional and validation-oriented. Advanced design work is not required.

## 18.1 Required UI Capabilities

The frontend must support:

- Displaying users
- Creating a user
- Displaying workspaces
- Creating a workspace
- Selecting or entering a workspace owner
- Showing loading states
- Showing empty states
- Showing API errors
- Showing successful creation results

## 18.2 Suggested Components

The following component names are canonical unless an equivalent component already exists:

```text
UserList
UserCreateForm
WorkspaceList
WorkspaceCreateForm
LoadingState
ErrorState
EmptyState
```

Suggested directory:

```text
frontend/src/components/
```

## 18.3 UI Restrictions

The frontend must not:

- Hardcode fake successful API responses
- Hide API errors
- Assume that every request succeeds
- Generate fake UUIDs for persisted records
- Directly access the database
- Include backend implementation logic
- Duplicate API request logic in multiple components

---

# 19. Database Migration Contract

Migration framework:

```text
Alembic
```

Migration directory:

```text
backend/alembic/versions/
```

The migration must create:

```text
users
workspaces
```

The migration must include:

- UUID primary keys
- Required user fields
- Required workspace fields
- Timestamp fields
- Foreign key from `workspaces.owner_id` to `users.id`, with `ON DELETE RESTRICT` (§9.1)

## 19.1 Migration Requirements

The migration must be:

- Reversible: it must include a working `downgrade()` that fully reverses the `upgrade()` (drop `workspaces` before `users`, respecting the foreign key). For a purely additive migration like this one, reversibility is always achievable, so this is unconditional — not "where practical."
- Compatible with the configured PostgreSQL version
- Executable using the existing project commands
- Included in the pull request
- Tested against a clean database

Canonical command:

```bash
uv run alembic upgrade head
```

The migration must not require manual SQL execution during normal development.

## 19.2 Migration Ownership

Workstream C owns:

```text
backend/alembic/
backend/alembic.ini
```

Workstream B must provide the models and metadata required by Alembic, including keeping `backend/app/models/__init__.py` current (§9.2).

Workstream C must validate that the migration works with the actual backend implementation.

---

# 20. Environment Contract

The existing environment variable names from `v0.1.1` remain unchanged, across both of its canonical files.

Root `.env.example`:

```text
APP_ENV
APP_HOST
APP_PORT

DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD

FRONTEND_URL
```

Frontend `frontend/.env.example`:

```text
VITE_API_BASE_URL
```

No new environment variable is introduced by `v0.1.2`.

No new secret or credential may be committed to the repository.

Both `.env.example` files must remain free of real credentials.

---

# 21. Docker Compose Contract

The existing service names remain unchanged:

```text
frontend
backend
postgres
```

The existing ports remain unchanged:

```text
Frontend: 5173
Backend: 8080
PostgreSQL: 5432
```

**Migration execution strategy.** A dedicated one-shot service runs the migration and exits before `backend` starts:

```yaml
migrate:
  build: ./backend
  command: uv run alembic upgrade head
  depends_on:
    postgres:
      condition: service_healthy
  env_file: .env

backend:
  depends_on:
    migrate:
      condition: service_completed_successfully
```

This extends v0.1.1's existing `postgres` healthcheck chain rather than replacing it: `postgres` → `migrate` → `backend` → `frontend`. Migrations must not run inside the `backend` container's own entrypoint — keeping them a separate service makes a migration failure visibly distinct from an application startup failure, both in logs and in `docker compose ps`.

The PostgreSQL service must retain its healthcheck.

The backend must continue using:

```text
postgres
```

as the PostgreSQL hostname inside Docker.

It must not use:

```text
localhost
127.0.0.1
```

for internal container-to-container database communication.

---

# 22. Testing Contract

All workstreams must provide tests for their functionality.

## 22.1 Backend Tests

Required backend tests include:

- User creation succeeds
- User creation rejects invalid input
- User retrieval succeeds
- User retrieval returns `404` for missing users
- User listing succeeds
- Workspace creation succeeds
- Workspace creation rejects a missing owner
- Workspace retrieval succeeds
- Workspace retrieval returns `404` for missing workspaces
- Workspace listing succeeds
- Database relationships are valid, including that deleting a user with an existing workspace is rejected by the database (§9.1) — verified directly at the SQLAlchemy session level, since no API endpoint can trigger it
- API errors follow the canonical error structure, including the domain-specific codes in §13.1

Tests must not depend on a contributor's local database.

## 22.2 Frontend Tests

Required frontend tests include:

- User list renders
- User creation form renders
- Workspace list renders
- Workspace creation form renders
- Loading state renders
- Empty state renders
- API error state renders
- Successful API responses are displayed
- Failed API requests are handled correctly

## 22.3 Integration Tests

Integration tests must verify:

1. PostgreSQL starts successfully.
2. Database migrations run successfully.
3. Backend starts successfully.
4. User creation works through the HTTP API.
5. Workspace creation works through the HTTP API.
6. Workspace ownership is validated.
7. Frontend can communicate with the backend.
8. Existing health endpoint behavior remains unchanged.

Integration test directory:

```text
tests/integration/
```

---

# 23. Backward Compatibility Contract

The following functionality from `v0.1.1` must continue working:

```http
GET /api/v1/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Expected status:

```text
200 OK
```

The following must not be broken:

- Docker Compose startup
- PostgreSQL connectivity
- Alembic execution
- Existing backend tests
- Existing frontend build
- Existing frontend linting
- Existing CI workflows
- Existing environment variable names
- Existing API base path

---

# 24. Documentation Contract

The following documentation must be updated where relevant:

```text
README.md
docs/tech_stack.md
docs/architecture/
```

Documentation must describe:

- User and workspace functionality
- New API endpoints
- Database relationship
- Local development commands
- Migration commands
- Testing commands
- Environment requirements

The documentation must not describe excluded functionality as already implemented.

---

# 25. Git and Pull Request Contract

## 25.1 Branching

Each workstream must work on its own feature branch.

Suggested branches:

```text
frontend/identity-workspace-ui
backend/identity-workspace-api
infra/identity-workspace-integration
```

Branch names may differ if the existing repository convention requires it.

## 25.2 Pull Requests

Each pull request must:

- Target `main`
- Contain a focused scope
- Explain changed files
- Explain testing performed
- Identify known limitations
- Avoid unrelated formatting changes
- Avoid modifying another workstream's implementation without coordination

## 25.3 Integration Review

Integration must be reviewed using a temporary integration branch.

Example:

```bash
git switch main
git pull origin main
git fetch origin

git switch -c review/v0.1.2-integration

git merge origin/infra/identity-workspace-integration
git merge origin/backend/identity-workspace-api
git merge origin/frontend/identity-workspace-ui
```

The integration branch must not replace `main`.

The integration branch must not be merged into source feature branches.

**Merge conflicts.** If a `git merge` step in this sequence conflicts, the Workstream C contributor (Rehan, per §3.3 and §29) resolves it, coordinating with whoever owns the branch involved rather than resolving it unilaterally. This is the one point in the workflow where the "must not need to inspect another contributor's internals" principle (§31) doesn't fully hold — it's an accepted, named exception, not a violation of it.

Once the source branches are updated, the integration branch should be recreated from the latest `main` rather than accumulating outdated merges indefinitely.

---

# 26. AI-Agent Development Rules

AI coding agents may be used, but contributors remain responsible for reviewing generated changes.

Agents must follow these rules:

- Read this contract before modifying files.
- Modify only files within the assigned workstream.
- Do not invent new public identifiers.
- Do not rename canonical identifiers.
- Do not modify unrelated functionality.
- Do not remove tests to make CI pass.
- Do not weaken validation rules.
- Do not add credentials or secrets.
- Do not change dependency versions without approval.
- Do not silently change API response structures.
- Do not merge branches.
- Do not force-push.
- Report all changed files.
- Report all commands executed.
- Report failed checks honestly.

If a requirement is unclear, the agent must stop and identify the ambiguity rather than inventing an incompatible interface.

---

# 27. Workstream Deliverables

## 27.1 Frontend Deliverables

- User TypeScript types
- Workspace TypeScript types
- User API module
- Workspace API module
- User interface
- Workspace interface
- Loading states
- Empty states
- Error states
- Frontend tests
- Updated frontend environment documentation

## 27.2 Backend Deliverables

- User SQLAlchemy model
- Workspace SQLAlchemy model
- `backend/app/models/__init__.py` registering both models on `Base.metadata` (§9.2)
- User Pydantic schemas
- Workspace Pydantic schemas
- User service
- Workspace service
- User API routes
- Workspace API routes
- Backend tests, including the database-level foreign-key test (§22.1)
- Error handling integration, including the domain-specific error codes (§13.1)

## 27.3 Infrastructure and Integration Deliverables

- Alembic migration, reversible per §19.1
- `migrate` service in `docker-compose.yml` (§21)
- Database schema validation
- Docker Compose validation
- Integration tests
- CI validation
- Documentation updates
- Integration branch review
- Contract compliance verification

---

# 28. Definition of Done

Version `v0.1.2` is complete only when all conditions below are satisfied.

## 28.1 Application Functionality

- [ ] Users can be created through the API.
- [ ] Users can be retrieved through the API.
- [ ] Users can be listed through the API.
- [ ] Workspaces can be created through the API.
- [ ] Workspaces can be retrieved through the API.
- [ ] Workspaces can be listed through the API.
- [ ] Workspace ownership is validated.
- [ ] User and workspace records persist in PostgreSQL.

## 28.2 Backend

- [ ] SQLAlchemy models are implemented.
- [ ] `backend/app/models/__init__.py` registers both models on `Base.metadata` (§9.2).
- [ ] The `workspaces.owner_id` foreign key uses `ON DELETE RESTRICT`, verified at the database level (§9.1, §22.1).
- [ ] UUIDs are generated at the SQLAlchemy layer, never client-supplied (§6).
- [ ] Pydantic schemas are implemented.
- [ ] API routes follow the canonical paths.
- [ ] Error responses follow the existing format, including the domain-specific codes in §13.1.
- [ ] Backend tests pass.
- [ ] Existing health endpoint remains functional.

## 28.3 Frontend

- [ ] User functionality is represented in the UI.
- [ ] Workspace functionality is represented in the UI.
- [ ] API calls use centralized API modules.
- [ ] `ApiError`/`ApiErrorDetail` live in `frontend/src/types/api.ts` (§17.3).
- [ ] Loading states are implemented.
- [ ] Empty states are implemented.
- [ ] Error states are implemented.
- [ ] Frontend linting passes.
- [ ] Frontend tests pass.
- [ ] Frontend build passes.

## 28.4 Infrastructure

- [ ] The `migrate` service runs `alembic upgrade head` and completes successfully before `backend` starts (§21).
- [ ] Alembic migration succeeds, and includes a working `downgrade()` (§19.1).
- [ ] PostgreSQL schema is correct.
- [ ] Docker Compose starts successfully.
- [ ] Integration tests pass.
- [ ] CI checks pass.
- [ ] No secrets are committed.
- [ ] No unapproved dependency changes are introduced.

## 28.5 Integration

- [ ] All workstream branches have been reviewed together.
- [ ] No unresolved merge conflicts remain.
- [ ] API contracts match frontend expectations.
- [ ] Database field names match backend models.
- [ ] Backend response structures match frontend types.
- [ ] Documentation reflects the implemented functionality.

---

# 29. Substitute and Continuity Protocol

If a primary contributor becomes unavailable, the assigned backup contributor assumes responsibility.

| Workstream | Primary | Backup |
|---|---|---|
| Frontend | Hamza | Rehan |
| Backend | Ali | Hamza |
| Infrastructure | Rehan | Ali |

The backup contributor must:

1. Review this contract.
2. Inspect only the relevant workstream files.
3. Preserve canonical identifiers.
4. Avoid unnecessary refactoring.
5. Run the required tests.
6. Document any incomplete work.
7. Notify the integration owner of blockers.

The backup contributor is not required to reproduce the original contributor's internal implementation.

The contract exists so that the public interfaces remain sufficient for continuation.

---

# 30. Change Management

Any change to the following requires agreement before implementation:

- API endpoint paths
- HTTP methods
- Request schemas
- Response schemas
- Database table names
- Database field names
- Canonical identifiers
- Environment variable names
- Docker service names
- Port assignments
- Ownership boundaries
- Required dependency versions

Minor internal implementation improvements may be made without a contract amendment if they do not change the defined interfaces.

Contract amendments must include:

- Changed section
- Reason for change
- Affected workstreams
- Compatibility impact
- Required migration or testing changes

---

# 31. Final Engineering Principle

The implementation must follow this principle:

> Member B must not need to know what Member A is coding internally.

Each contributor must know:

- Which files they own
- Which identifiers they must use
- Which APIs exist
- Which request and response structures are expected
- Which database fields are required
- Which tests must pass
- Which files they must not modify

Internal implementation choices remain private to each workstream unless they affect a documented interface.

The integration result must behave as one coherent system, regardless of which contributor implemented each component.

---

## Revision Log

**Revision 2** (this document; supersedes the proposed draft) resolves a set of ambiguities that would have produced genuinely different schemas or migrations depending on who implemented them, plus a few places where this contract silently diverged from its v0.1.1 predecessor:

- UUID generation is now explicitly SQLAlchemy-level, not left ambiguous between that and a PostgreSQL-native default (§6)
- The `workspaces.owner_id` foreign key's `ON DELETE` behavior is now explicit (`RESTRICT`), with a database-level test added since no endpoint can exercise it (§9.1, §22.1)
- Model registration for Alembic now has a named file and owner (`backend/app/models/__init__.py`, Workstream B) — an extension of v0.1.1's Interface I-006 (§9.2)
- The migration execution strategy is now a concrete dedicated `migrate` service in Compose, rather than left unspecified (§21)
- Domain-specific error codes are now explicitly reconciled against v0.1.1's generic status-derived fallback rule, rather than silently contradicting it (§13)
- `VITE_API_BASE_URL` and `frontend/.env.example` are now listed in the Environment Contract, matching what v0.1.1 actually established (§20)
- `ApiError`/`ApiErrorDetail` are relocated to `frontend/src/types/api.ts`, populating the file v0.1.1's own deliverables list already anticipated (§17)
- The `display_name` "no secrets" rule is reframed as design guidance rather than an unenforceable validation requirement (§7.2)
- Migration reversibility is now unconditional rather than hedged with "where practical" (§19.1)
- The Alembic-modification exception in §3.2 is clarified as a process exception (goes through review), not a loosening of v0.1.1's absolute rule (§2.2)
- Merge-conflict handling during integration-branch review is now named explicitly (§25.3)

Sections not mentioned above are unchanged from the proposed draft.