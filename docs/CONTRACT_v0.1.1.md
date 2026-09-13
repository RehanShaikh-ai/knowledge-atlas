# v0.1.1 — Foundation Engineering Contract (Revision 2)

**Document status:** This revision supersedes the original v0.1.1 draft. It resolves the ownership overlaps, undefined interfaces, and missing process rules identified during technical review, without changing the target release scope. A summary of what changed is provided in the Revision Log at the end of this document.

# 1. Objective

Establish the minimum executable application platform for Collaborative Second Brain.

This release is infrastructure-only. It contains no authentication, no authorization, and no multi-user or knowledge-management functionality. Those capabilities are explicitly deferred to a future contract version (see §19).

The release must produce the following working system:

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
   │ PostgreSQL protocol
   ▼
PostgreSQL :5432
```

The three workstreams are implemented independently against the interfaces defined in this contract, subject to the single sequencing note in §2.3.

---

# 2. Workstream Ownership

Ownership is directory-based by default. §2.2 and §2.3 define one explicit exception to that rule — read them together.

## 2.1 Workstream A — Frontend

Responsible for:

- React application
- TypeScript configuration
- Vite configuration
- Application shell
- Frontend routing scaffold (single route: `/`; see §29 for scope limits)
- Frontend API client
- Health-status UI
- Loading/error states
- Frontend tests
- Frontend Docker image
- `frontend/.env.example`

Primary directory:

```text
frontend/
```

## 2.2 Workstream B — Backend

Responsible for:

- FastAPI application
- API routing
- API schemas
- Application configuration
- Database access layer (`app/db/base.py`, `app/db/session.py`)
- Health endpoint
- Global error handling
- Backend logging
- Backend tests

Primary directory:

```text
backend/
```

**Exception:** `backend/alembic/` and `backend/alembic.ini` are owned by Workstream C (§2.3), not Workstream B, despite living inside the `backend/` tree. Workstream B must not modify files under `backend/alembic/`.

## 2.3 Workstream C — Infrastructure & Database

Responsible for:

- Docker Compose
- PostgreSQL service
- PostgreSQL persistent volume
- Root environment template (`.env.example`)
- Alembic infrastructure (`backend/alembic/`, `backend/alembic.ini`) — an explicit exception to directory-based ownership; see §2.2
- Database connectivity validation
- Integration-test infrastructure
- Root development scripts
- Root infrastructure documentation

Primary files/directories:

```text
docker-compose.yml
.env.example
docker/
scripts/
tests/integration/
backend/alembic/
backend/alembic.ini
```

**Dependency note:** `backend/alembic/env.py` (owned by Workstream C) must import `Base` from `app.db.base` and `settings` from `app.core.config` — both owned by Workstream B (Interface I-006, §35). Because the import path and object names are fixed by this contract, Workstream C may write `env.py` against that interface without waiting for Workstream B's implementation to land first. If Workstream B has not yet delivered a working `Base`/`settings` at the time Workstream C writes `env.py`, the Alembic setup is permitted to remain unverified — but must still be written — until integration.

---

# 3. Shared Repository Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py
│   │   │       └── health.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── exception_handlers.py
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── alembic/
│   │   └── versions/
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── uv.lock
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docs/
│   ├── contracts/
│   └── architecture/
│
├── tests/
│   └── integration/
│
├── docker/
├── scripts/
│   └── dev.sh
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 4. Canonical Naming Contract

The following identifiers are canonical for `v0.1.1`. Do not rename them independently between workstreams.

## 4.1 Backend Application

Python package root:

```text
backend/app/
```

FastAPI application object:

```python
app
```

defined in:

```text
backend/app/main.py
```

Canonical import target:

```python
from app.main import app
```

## 4.2 Backend Configuration

Configuration module:

```text
backend/app/core/config.py
```

Canonical settings class:

```python
Settings
```

Canonical singleton:

```python
settings
```

Expected usage:

```python
from app.core.config import settings
```

## 4.3 API Router Aggregation

Canonical aggregator router:

```python
api_router
```

defined in:

```text
backend/app/api/v1/router.py
```

`health.py` defines its own local `APIRouter` instance. It is attached to `api_router` via:

```python
# backend/app/api/v1/router.py
api_router = APIRouter()
api_router.include_router(health.router)
```

```python
# backend/app/api/v1/health.py
router = APIRouter()

@router.get("/health", response_model=HealthResponse, name="get_health")
def get_health() -> HealthResponse:
    return HealthResponse(status="ok")
```

`main.py` mounts only `api_router` under the `/api/v1` prefix. It must not mount individual sub-routers directly.

## 4.4 Error Handling

Canonical registration function:

```python
register_exception_handlers(app: FastAPI) -> None
```

defined in:

```text
backend/app/core/exception_handlers.py
```

called once from `main.py`, after the FastAPI `app` object is constructed. See §12 for what it must cover.

---

# 5. Environment Variable Contract

Two canonical environment files exist. They are not interchangeable and must not duplicate each other's variables.

## 5.1 Root Environment File

```text
.env.example
```

Owned by Workstream C. Canonical variable names:

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

Example:

```env
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8080

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=knowledge_atlas
DATABASE_USER=knowledge_atlas
DATABASE_PASSWORD=change_me

FRONTEND_URL=http://localhost:5173
```

## 5.2 Frontend Environment File

```text
frontend/.env.example
```

Owned by Workstream A. Canonical variable:

```text
VITE_API_BASE_URL
```

Example:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

This variable must not also appear in the root `.env.example`. Vite only reads `VITE_`-prefixed variables from files inside `frontend/`, so putting it at the root would be silently ignored at build time.

---

# 6. Docker Service Naming Contract

The Docker Compose service names are canonical:

```text
frontend
backend
postgres
```

The PostgreSQL hostname inside the Compose network is:

```text
postgres
```

Therefore the backend database configuration must use:

```env
DATABASE_HOST=postgres
```

The backend must not use:

```text
localhost
127.0.0.1
```

for PostgreSQL communication when running inside Docker.

---

# 7. Port Contract

Canonical development ports:

```text
Frontend   5173
Backend    8080
PostgreSQL 5432
```

Canonical URLs:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:8080

API:
http://localhost:8080/api/v1
```

---

# 8. Toolchain & Pinned Versions Contract

To prevent divergent local environments and container images, the following are canonical for this contract version. A version bump requires a contract amendment (§36), not an ad-hoc change by a single workstream.

```text
Backend Python runtime:     python:3.12-slim
Backend package manager:    uv (uv.lock committed; no requirements.txt)

Frontend Node runtime:      node:20-alpine
Frontend package manager:   npm (package-lock.json committed)

PostgreSQL image:           postgres:16-alpine
```

Rules:

- Only `package-lock.json` may be committed for the frontend. `pnpm-lock.yaml` and `yarn.lock` must not be committed, and neither pnpm nor yarn may be used to install dependencies.
- Floating tags (`latest`, an unversioned `alpine`, an unversioned `slim`) must not appear in any Dockerfile or Compose file.
- Patch-level drift (e.g. `3.12.4` vs `3.12.6`) is acceptable without amendment; major/minor version changes are not.

---

# 9. API Base Path Contract

All application endpoints must use:

```text
/api/v1
```

---

# 10. Health Endpoint Contract

Canonical endpoint:

```http
GET /api/v1/health
```

Canonical backend route identifier:

```text
health
```

Canonical response schema:

```python
HealthResponse
```

Canonical response:

```json
{
  "status": "ok"
}
```

HTTP status:

```text
200
```

---

# 11. Backend Health Implementation Contract

Canonical backend files:

```text
backend/app/api/v1/health.py
backend/app/schemas/health.py
```

Canonical route function:

```python
get_health()
```

Canonical response model:

```python
HealthResponse
```

The exact framework implementation may differ, but the following interface is fixed:

```text
Route:            GET /api/v1/health
Function:         get_health
Response model:   HealthResponse
Response field:   status
Response type:    string
Success value:    "ok"
```

---

# 12. API Error Contract

Canonical schema:

```python
ErrorResponse
```

Canonical nested schema:

```python
ErrorDetail
```

Canonical structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Canonical fields:

```text
ErrorResponse.error
ErrorDetail.code
ErrorDetail.message
```

Example:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

**Mandatory global coverage.** This schema must be the response for every error path the backend can produce, not only errors an endpoint explicitly raises. `register_exception_handlers` (§4.4) must register handlers for, at minimum:

```text
RequestValidationError   → 422, code="VALIDATION_ERROR"
HTTPException             → matching status, code derived from status
Exception (catch-all)     → 500, code="INTERNAL_SERVER_ERROR"
```

Exact exception classes may differ slightly by framework version; the coverage requirement and response shape are fixed. No unhandled exception may reach the client as a raw stack trace or as a framework default error body. Internal exception messages must never be serialized directly into `message`.

---

# 13. Frontend API Contract

Canonical frontend API directory:

```text
frontend/src/api/
```

Canonical client module:

```text
frontend/src/api/client.ts
```

Canonical health module:

```text
frontend/src/api/health.ts
```

Canonical frontend API function:

```typescript
getHealth()
```

Canonical frontend response type:

```typescript
HealthResponse
```

Canonical frontend API error type:

```typescript
ApiError
```

The frontend health request must use:

```http
GET /api/v1/health
```

The frontend must not manually construct this request inside React components. The component must call `getHealth()`.

**Malformed response handling.** If a response cannot be parsed as JSON, or does not match the `ApiError` shape, `client.ts` must catch the parsing failure and return a generic `ApiError` (e.g. `code: "UNKNOWN_ERROR"`) rather than letting an unhandled exception escape into the calling component.

---

# 14. Frontend Configuration Contract

Frontend backend URL must come from Vite environment configuration (§5.2).

Canonical variable:

```text
VITE_API_BASE_URL
```

Development value:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Canonical client behavior:

```text
VITE_API_BASE_URL
        ↓
ApiClient
        ↓
getHealth()
        ↓
GET /health
```

Because the base URL already contains `/api/v1`, the health module must request `/health`, not `/api/v1/health`. This avoids duplicate version prefixes.

**Docker runtime mode.** `frontend/Dockerfile` builds a development image for `v0.1.1`. It runs the Vite dev server (`vite --host 0.0.0.0 --port 5173`), not a production static build served by nginx or similar. A production build strategy is out of scope for this release and deferred to a future contract version.

---

# 15. Frontend Type Contract

Canonical file:

```text
frontend/src/types/health.ts
```

Canonical type:

```typescript
export interface HealthResponse {
  status: string;
}
```

Canonical API error type:

```typescript
export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiError {
  error: ApiErrorDetail;
}
```

All code consuming the health endpoint must use these canonical types.

---

# 16. Frontend State Contract

Canonical status values and their displayed text — this is the single source of truth for both; no other section may restate or vary this mapping:

| State       | Displayed text        |
|-------------|------------------------|
| `loading`   | `Backend: Loading`     |
| `connected` | `Backend: Connected`   |
| `error`     | `Backend: Unavailable` |

Canonical UI behavior:

```text
Initial request
    ↓
loading

HTTP 200 + status="ok"
    ↓
connected

HTTP failure / network failure / invalid response
    ↓
error
```

No component may invent alternative status names (`ready`, `success`, `offline`, `failed`, etc.) or alternative displayed text for this health-state implementation.

---

# 17. Database Layer Contract

Canonical database module:

```text
backend/app/db/
```

Required modules:

```text
backend/app/db/session.py
backend/app/db/base.py
```

Canonical SQLAlchemy engine variable:

```python
engine
```

Canonical session factory:

```python
SessionLocal
```

Canonical declarative base:

```python
Base
```

Expected conceptual structure:

```text
config
  ↓
engine
  ↓
SessionLocal
  ↓
database session
```

Application code must not instantiate raw PostgreSQL connections directly. `Base` is also consumed outside this module by Workstream C's Alembic setup (Interface I-006, §35).

---

# 18. Database URL Contract

The backend must construct its SQLAlchemy connection configuration from:

```text
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD
```

Canonical PostgreSQL URL format:

```text
postgresql+psycopg://<user>:<password>@<host>:<port>/<database>
```

No database URL containing real credentials may be committed to Git.

---

# 19. Database Models

`v0.1.1` defines no application-domain models.

The following must not be implemented:

```text
User
Workspace
Note
Document
KnowledgeNode
KnowledgeEdge
Embedding
Permission
```

`Base` may exist solely to establish SQLAlchemy/Alembic infrastructure.

This is a deliberate scope boundary, not an oversight: authentication, authorization, and all multi-user/collaborative functionality implied by the product name are intentionally deferred to a future contract version (§1).

---

# 20. Migration Contract

Migration framework:

```text
Alembic
```

Canonical directory:

```text
backend/alembic/
```

Canonical configuration:

```text
backend/alembic.ini
```

Canonical command:

```bash
uv run alembic upgrade head
```

Migration revisions must be stored in:

```text
backend/alembic/versions/
```

No manual SQL schema modifications are permitted as part of normal development. Ownership of this directory sits with Workstream C, not Workstream B, despite its location inside `backend/` (§2.2, §2.3).

---

# 21. Docker Compose Contract

Root file:

```text
docker-compose.yml
```

Required services:

```yaml
services:
  frontend:
  backend:
  postgres:
```

Required exposed ports:

```text
frontend:
  5173:5173

backend:
  8080:8080

postgres:
  5432:5432
```

Required PostgreSQL persistent volume:

```text
postgres_data
```

Canonical database name:

```text
knowledge_atlas
```

Canonical database user:

```text
knowledge_atlas
```

Container image versions are fixed in §8 (Toolchain & Pinned Versions Contract). No workstream may substitute a different image or a floating tag without a contract amendment (§36).

---

# 22. Docker Dependency Behavior

The intended runtime dependency graph:

```text
postgres
   ↑
backend
   ↑
frontend
```

The backend must not be considered ready merely because the PostgreSQL container process has started. PostgreSQL readiness must be checked using a Compose `healthcheck`, and the backend service must declare:

```yaml
depends_on:
  postgres:
    condition: service_healthy
```

Example PostgreSQL healthcheck:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER} -d ${DATABASE_NAME}"]
  interval: 5s
  timeout: 5s
  retries: 5
```

---

# 23. CORS Contract

Development frontend origin:

```text
http://localhost:5173
```

Canonical backend configuration source:

```text
FRONTEND_URL
```

The FastAPI CORS middleware must use the configured origin. Wildcard origins must not be used as the default configuration.

---

# 24. Logging Contract

Backend logging must use Python's standard logging infrastructure or an equivalent structured logging solution.

Canonical logger naming root:

```text
app
```

Examples:

```python
logger = logging.getLogger("app")
```

or module-scoped child loggers:

```text
app.api.v1.health
app.db.session
```

Sensitive configuration values must never be logged.

**Verification.** Logging conformance is checked by code review, not by an automated test, and is not a Definition of Done gate for `v0.1.1`.

---

# 25. Frontend UI Contract

Canonical initial page:

```text
HomePage
```

Canonical file:

```text
frontend/src/pages/HomePage.tsx
```

Canonical layout:

```text
RootLayout
```

Canonical file:

```text
frontend/src/layouts/RootLayout.tsx
```

The initial route:

```text
/
```

must render `HomePage`. The page must expose system status using the state → displayed-text mapping defined in §16. No component may introduce alternate wording here.

---

# 26. Backend Testing Contract

Backend test directory:

```text
backend/tests/
```

Required files:

```text
backend/tests/test_health.py
backend/tests/test_config.py
```

Canonical test names should clearly correspond to contract behavior. Examples:

```python
test_get_health_returns_ok()
test_settings_load_from_environment()
```

---

# 27. Frontend Testing Contract

Frontend tests should reside close to the feature under test or under:

```text
frontend/src/**/*.test.ts
frontend/src/**/*.test.tsx
```

Required health behavior tests:

```text
health success
health loading
health failure
```

Canonical conceptual test names:

```text
renders loading state
renders connected state
renders unavailable state
```

---

# 28. Integration Test Contract

Root integration tests:

```text
tests/integration/
```

At least one integration test must validate:

```text
Backend
   ↓
SQLAlchemy
   ↓
Psycopg
   ↓
PostgreSQL
```

The integration environment must not depend on a developer's personal PostgreSQL instance. **Testcontainers (`testcontainers-python`, PostgreSQL module) must be used** to provision an isolated PostgreSQL instance for this test. Ad-hoc `docker run` scripts and a shared always-on database are not acceptable substitutes.

---

# 29. Frontend Routing Scope

Only one route (`/`) is required for `v0.1.1`. A routing library (e.g. `react-router-dom`) is not required for this release, and its absence must not fail Definition of Done (§37). If a routing library is introduced ahead of schedule for future-proofing, it must be documented in `docs/architecture/` and does not itself require a contract amendment, provided it does not change the canonical route (`/`) or component (`HomePage`).

---

# 30. Git & Review Contract

## 30.1 Branching

Branch names must follow:

```text
<workstream>/<short-description>
```

Examples:

```text
frontend/health-ui
backend/error-handlers
infra/alembic-setup
```

`main` is protected. No direct commits to `main` — all changes land via pull request.

## 30.2 Review Requirements

Every pull request requires at least one approval before merge.

Pull requests touching any of the following require approval from a member of **every** workstream, not only the author's own:

```text
docker-compose.yml
.env.example
frontend/.env.example
CONTRACT.md
backend/app/core/**
backend/app/schemas/**
```

These paths carry the canonical names and interfaces defined in this contract; a change to them is a contract-level change under §36 regardless of how small it looks.

## 30.3 CI Gate

A pull request must not merge unless, at minimum:

```text
backend tests (§26) pass
frontend tests (§27) pass
integration tests (§28) pass
```

CI failures block merge; they are not advisory.

---

# 31. AI-Agent Implementation Constraints

Where an AI coding agent, rather than a human developer, implements any part of this contract, the following apply in addition to everything above:

- The agent must not rename any identifier marked canonical in §4 or §35, even if it believes an alternative name is clearer.
- The agent must not introduce dependencies, endpoints, database models, or files beyond what this contract specifies — including anything listed as forbidden (§19) or explicitly deferred (§1, §19).
- The agent must not weaken a stated security or correctness default (widening CORS beyond `FRONTEND_URL`, catching and discarding an error to make a test pass, disabling a healthcheck) in order to make a task appear complete.
- Where this contract is ambiguous or silent on a needed decision, the agent must flag the ambiguity for human resolution rather than silently choosing an interpretation.
- Any deviation from this contract, however small, must be stated explicitly in the pull request description with a reference to the relevant section.

---

# 32. Workstream A — Frontend Deliverables

```text
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   └── health.ts
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   │   └── RootLayout.tsx
│   ├── pages/
│   │   └── HomePage.tsx
│   ├── types/
│   │   ├── health.ts
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

Acceptance:

```text
npm install
        ↓
frontend build succeeds
        ↓
frontend starts (Vite dev server, §14)
        ↓
GET /api/v1/health
        ↓
status displayed per the §16 mapping
```

The frontend workstream must not create backend routes or PostgreSQL schema.

---

# 33. Workstream B — Backend Deliverables

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       └── health.py
│   ├── core/
│   │   ├── config.py
│   │   └── exception_handlers.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   ├── schemas/
│   │   ├── health.py
│   │   └── errors.py
│   ├── services/
│   └── main.py
├── tests/
├── pyproject.toml
├── uv.lock
└── Dockerfile
```

Acceptance:

```text
FastAPI starts
        ↓
GET /api/v1/health → HealthResponse → {"status":"ok"}
        ↓
Any error path → ErrorResponse (§12), never a raw traceback
```

The backend workstream must not create frontend components, must not modify Compose service topology without an agreed interface change, and must not modify files under `backend/alembic/` (§2.2).

---

# 34. Workstream C — Infrastructure & Database Deliverables

```text
docker-compose.yml
.env.example
.gitignore
backend/alembic/
backend/alembic.ini
tests/integration/
scripts/
└── dev.sh
```

`scripts/dev.sh` must, at minimum, bring up the full stack (`docker compose up --build`).

Acceptance:

```text
docker compose up --build
        ↓
postgres healthy (§22)
        ↓
backend resolves "postgres", connects
        ↓
alembic upgrade head succeeds
```

The infrastructure/database workstream must not define application-domain tables and must not modify files under `backend/app/` outside `backend/alembic/`.

---

# 35. Cross-Workstream Interfaces

The following interfaces are fixed.

## Interface I-001 — Frontend → Backend

```text
Protocol:  HTTP
Format:    JSON
Base URL:  VITE_API_BASE_URL (frontend/.env.example, §5.2)
API prefix: /api/v1
```

---

## Interface I-002 — Health

```text
Method:   GET
Path:     /api/v1/health
Request body: none
Response: HealthResponse
Response: {"status": "ok"}
```

---

## Interface I-003 — Error

```text
ErrorResponse
    └── error: ErrorDetail
             ├── code: string
             └── message: string
```

Mandatory coverage of this shape across all error paths is defined in §12.

---

## Interface I-004 — Backend → PostgreSQL

```text
Driver:     Psycopg 3
ORM:        SQLAlchemy 2
Connection: postgresql+psycopg
Host:       DATABASE_HOST
Port:       DATABASE_PORT
Database:   DATABASE_NAME
User:       DATABASE_USER
Password:   DATABASE_PASSWORD
```

---

## Interface I-005 — Compose Networking

```text
Frontend service: frontend
Backend service:  backend
Database service: postgres
```

The hostname `postgres` is the canonical database hostname within the Compose network.

---

## Interface I-006 — Alembic ↔ ORM Coupling

```text
Owner of Base / settings:     Workstream B
Owner of backend/alembic/env.py: Workstream C

Fixed imports required in env.py:
  from app.db.base import Base
  from app.core.config import settings

Fixed usage:
  target_metadata = Base.metadata
```

This is the only case in this contract where one workstream's file must import directly from another workstream's module. The import path is fixed regardless of implementation order (§2.3).

---

# 36. Change Management

A cross-workstream contract change requires agreement before implementation, proposed and approved via pull request per §30.2, in addition to written agreement among affected workstreams.

Examples of contract-level changes:

- Renaming `HealthResponse`
- Renaming `get_health`
- Changing `/api/v1/health`
- Renaming environment variables
- Changing Docker service names
- Changing database host conventions
- Changing API response structure

Internal implementation changes that preserve the contract do not require cross-workstream changes.

---

# 37. Definition of Done

`v0.1.1` is complete when:

```text
1.  Repository structure exists (§3)
2.  Frontend builds
3.  Backend builds/starts
4.  PostgreSQL starts
5.  Docker Compose starts the complete stack
6.  Backend resolves PostgreSQL through "postgres"
7.  SQLAlchemy connects through Psycopg 3
8.  Alembic is operational (env.py per Interface I-006)
9.  GET /api/v1/health returns 200
10. HealthResponse matches the canonical schema
11. All backend error paths return ErrorResponse (§12) — no raw tracebacks
12. Frontend consumes getHealth()
13. Frontend displays loading/connected/error states per the §16 mapping
14. CORS permits http://localhost:5173
15. Environment configuration is externalized across both .env.example files (§5)
16. Frontend dependencies are installed via npm only; package-lock.json is committed
17. Toolchain versions match §8; no floating tags in Dockerfiles or Compose
18. Basic frontend tests pass
19. Basic backend tests pass
20. PostgreSQL integration test passes using Testcontainers (§28)
21. No application-domain functionality is implemented
22. No secrets are committed
23. README documents the complete setup
```

---

# 38. Release Output

The observable result of `v0.1.1` is:

```text
Open browser
     ↓
http://localhost:5173
     ↓
Collaborative Second Brain application loads
     ↓
Frontend calls:
GET /api/v1/health
     ↓
FastAPI responds:
{"status":"ok"}
     ↓
Application displays connected system status
```

From an engineering perspective, the release establishes:

```text
Frontend Contract
        │
        ▼
REST API Contract
        │
        ▼
Backend Contract
        │
        ▼
Database Contract
        │
        ▼
Infrastructure Contract
```

No knowledge, graph, retrieval, or AI functionality is part of this release.

---

**Revision 2 summary.** This revision adds canonical identifiers that Revision 1 was silent on:

```text
api_router
register_exception_handlers
scripts/dev.sh
frontend/.env.example
```

on top of correcting:

- The Alembic ownership overlap between Workstream B and C (§2, I-006)
- The undefined home of `VITE_API_BASE_URL` (§5)
- Error responses that only worked for the happy path, not the whole API (§12)
- An unpinned frontend package manager and unpinned container images (§8)
- Ambiguity between the frontend's Docker image and its actual runtime mode (§14)
- A state contract and a UI contract that each described their own display strings (§16, §25)
- "Should"-language on PostgreSQL readiness gating and image pinning, now "must" (§8, §22)
- An integration test with an optional testing strategy (§28)
- The complete absence of Git/PR rules (§30) and AI-agent constraints (§31)

Sections not called out above kept their original requirements — only numbering shifted to make room for the sections above.