# v0.1.1 — Foundation Engineering Contract

## 1. Objective

Establish the minimum executable application platform for Collaborative Second Brain.

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
````

The three workstreams are implemented independently against the interfaces defined in this contract.

---

# 2. Workstream Ownership

## Workstream A — Frontend

Responsible for:

* React application
* TypeScript configuration
* Vite configuration
* application shell
* frontend routing
* frontend API client
* health-status UI
* loading/error states
* frontend tests
* frontend Docker image

Primary directory:

```text
frontend/
```

---

## Workstream B — Backend

Responsible for:

* FastAPI application
* API routing
* API schemas
* application configuration
* database access layer
* health endpoint
* error handling
* backend logging
* backend tests

Primary directory:

```text
backend/
```

---

## Workstream C — Infrastructure & Database

Responsible for:

* Docker Compose
* PostgreSQL service
* PostgreSQL persistent volume
* environment template
* Alembic infrastructure
* database connectivity validation
* integration-test infrastructure
* root development scripts
* root infrastructure documentation

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

---

# 3. Shared Repository Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── core/
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
│   ├── package.json
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
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 4. Canonical Naming Contract

The following identifiers are canonical for `v0.1.1`.

Do not rename them independently between workstreams.

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

---

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

---

# 5. Environment Variable Contract

The following variable names are canonical:

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

These exact names must be used by all workstreams.

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

# 8. API Contract

## 8.1 API Base Path

All application endpoints must use:

```text
/api/v1
```

---

## 8.2 Health Endpoint

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

# 9. Backend Health Implementation Contract

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

Expected conceptual implementation:

```python
@router.get(
    "/health",
    response_model=HealthResponse,
    name="get_health"
)
def get_health() -> HealthResponse:
    return HealthResponse(status="ok")
```

The exact framework implementation may differ, but the following interface is fixed:

```text
Route:
GET /api/v1/health

Function:
get_health

Response model:
HealthResponse

Response field:
status

Response type:
string

Success value:
"ok"
```

---

# 10. API Error Contract

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

Internal exceptions must never be serialized directly into `message`.

---

# 11. Frontend API Contract

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

The frontend must not manually construct this request inside React components.

The component must call:

```typescript
getHealth()
```

---

# 12. Frontend Configuration Contract

Frontend backend URL must come from Vite environment configuration.

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

Because the base URL already contains `/api/v1`, the health module must request:

```text
/health
```

rather than:

```text
/api/v1/health
```

This avoids duplicate version prefixes.

---

# 13. Frontend Type Contract

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

# 14. Frontend State Contract

Canonical status values:

```text
loading
connected
error
```

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

No component should invent alternative status names such as:

```text
ready
success
offline
failed
```

for this specific health-state implementation.

---

# 15. Database Layer Contract

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

Application code must not instantiate raw PostgreSQL connections directly.

---

# 16. Database URL Contract

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

# 17. Database Models

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

---

# 18. Migration Contract

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

No manual SQL schema modifications are permitted as part of normal development.

---

# 19. Docker Compose Contract

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

The exact container image versions may be selected during implementation, but must be pinned rather than using uncontrolled floating versions where practical.

---

# 20. Docker Dependency Behavior

The intended runtime dependency graph:

```text
postgres
   ↑
backend
   ↑
frontend
```

Backend must not be considered ready merely because the PostgreSQL container process has started.

PostgreSQL readiness should be checked using a health check.

The backend container should depend on PostgreSQL readiness where supported by Compose configuration.

---

# 21. CORS Contract

Development frontend origin:

```text
http://localhost:5173
```

Canonical backend configuration source:

```text
FRONTEND_URL
```

The FastAPI CORS middleware must use the configured origin.

Wildcard origins must not be used as the default configuration.

---

# 22. Logging Contract

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

---

# 23. Frontend UI Contract

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

must render:

```text
HomePage
```

The initial page must expose system status.

Canonical displayed states:

```text
Backend: Connected
Backend: Unavailable
Backend: Loading
```

The UI wording may be refined visually, but the underlying state model must follow the canonical states defined above.

---

# 24. Testing Contract

## 24.1 Backend Test Directory

```text
backend/tests/
```

Required files:

```text
backend/tests/test_health.py
backend/tests/test_config.py
```

Canonical test names should clearly correspond to contract behavior.

Examples:

```python
test_get_health_returns_ok()
test_settings_load_from_environment()
```

---

# 25. Frontend Test Directory

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

# 26. Integration Test Contract

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

The integration environment must not depend on a developer's personal PostgreSQL instance.

Testcontainers or isolated Docker infrastructure may be used.

---

# 27. Workstream A — Frontend Deliverables

The frontend workstream must produce:

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
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

Acceptance:

```text
npm/pnpm install
        ↓
frontend build succeeds
        ↓
frontend starts
        ↓
GET /api/v1/health
        ↓
status displayed
```

The frontend workstream must not create backend routes or PostgreSQL schema.

---

# 28. Workstream B — Backend Deliverables

The backend workstream must produce:

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       └── health.py
│   ├── core/
│   │   └── config.py
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
GET /api/v1/health
        ↓
HealthResponse
        ↓
{"status":"ok"}
```

The backend workstream must not create frontend components or modify Compose service topology unless required by an agreed interface change.

---

# 29. Workstream C — Infrastructure & Database Deliverables

The infrastructure/database workstream must establish:

```text
docker-compose.yml
.env.example
.gitignore
backend/alembic/
backend/alembic.ini
tests/integration/
scripts/
```

Acceptance:

```text
docker compose up --build
        ↓
postgres ready
        ↓
backend can resolve "postgres"
        ↓
database connection succeeds
        ↓
alembic upgrade head succeeds
```

The infrastructure/database workstream must not define application-domain tables.

---

# 30. Cross-Workstream Interfaces

The following interfaces are fixed.

## Interface I-001 — Frontend → Backend

```text
Protocol:
HTTP

Format:
JSON

Base URL:
VITE_API_BASE_URL

API prefix:
 /api/v1
```

---

## Interface I-002 — Health

```text
Method:
GET

Path:
 /api/v1/health

Request body:
none

Response:
HealthResponse

Response:
{
  "status": "ok"
}
```

---

## Interface I-003 — Error

```text
ErrorResponse
    └── error: ErrorDetail
             ├── code: string
             └── message: string
```

---

## Interface I-004 — Backend → PostgreSQL

```text
Driver:
Psycopg 3

ORM:
SQLAlchemy 2

Connection:
postgresql+psycopg

Host:
DATABASE_HOST

Port:
DATABASE_PORT

Database:
DATABASE_NAME

User:
DATABASE_USER

Password:
DATABASE_PASSWORD
```

---

## Interface I-005 — Compose Networking

```text
Frontend service:
frontend

Backend service:
backend

Database service:
postgres
```

The hostname:

```text
postgres
```

is the canonical database hostname within the Compose network.

---

# 31. Change Management

A cross-workstream contract change requires agreement before implementation.

Examples of contract-level changes:

* Renaming `HealthResponse`
* Renaming `get_health`
* Changing `/api/v1/health`
* Renaming environment variables
* Changing Docker service names
* Changing database host conventions
* Changing API response structure

Internal implementation changes that preserve the contract do not require cross-workstream changes.

---

# 32. Definition of Done

`v0.1.1` is complete when:

```text
1. Repository structure exists
2. Frontend builds
3. Backend builds/starts
4. PostgreSQL starts
5. Docker Compose starts the complete stack
6. Backend resolves PostgreSQL through "postgres"
7. SQLAlchemy connects through Psycopg 3
8. Alembic is operational
9. GET /api/v1/health returns 200
10. HealthResponse matches the canonical schema
11. Frontend consumes getHealth()
12. Frontend displays loading/connected/error states
13. CORS permits http://localhost:5173
14. Environment configuration is externalized
15. Basic frontend tests pass
16. Basic backend tests pass
17. PostgreSQL integration test passes
18. No application-domain functionality is implemented
19. No secrets are committed
20. README documents the complete setup
```

---

# 33. Release Output

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

````


The key improvement is that **the contract now has identifiers that belong to the system rather than to whoever happens to implement it**:

```text
get_health()
HealthResponse
ErrorResponse
ErrorDetail
Settings
settings
engine
SessionLocal
Base
getHealth()
VITE_API_BASE_URL
DATABASE_HOST
DATABASE_PORT
...
````