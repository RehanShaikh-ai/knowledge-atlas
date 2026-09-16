# Infrastructure Architecture & Guide

This document describes the infrastructure, database configuration, local development tooling, and CI pipeline for **Collaborative Second Brain** (Release `v0.1.1`).

## 1. Overview & Service Topology

The local application stack is orchestrated via Docker Compose (`docker-compose.yml`), comprising three isolated services:

```text
               Browser
                  │
                  ▼
         frontend (:5173)
                  │
                  ▼
          backend (:8080)
                  │
                  ▼
         postgres (:5432)
                  │
                  ▼
         [postgres_data]
```

### Pinned Image & Toolchain Versions (CONTRACT §8)
- **PostgreSQL**: `postgres:16-alpine`
- **Backend Runtime**: `python:3.12-slim` (managed via `uv`)
- **Frontend Runtime**: `node:20-alpine` (managed via `npm`)

Floating tags (`latest`, unversioned tags) are strictly forbidden in Dockerfiles and Compose files.

---

## 2. Port Mappings & Network Topology

| Service | Internal Port | Host Port | Contract URL |
|---|---|---|---|
| **frontend** | 5173 | 5173 | `http://localhost:5173` |
| **backend** | 8080 | 8080 | `http://localhost:8080` (API: `http://localhost:8080/api/v1`) |
| **postgres** | 5432 | 5432 | `postgres://knowledge_atlas@localhost:5432/knowledge_atlas` |

Within the Docker network, backend connects to PostgreSQL using the canonical service hostname `postgres`.

---

## 3. Environment Variables & Configuration

Two environment templates exist and are strictly separated:

1. **Root `.env.example`** (Workstream C):
   - Configures backend and database parameters.
   - Variables: `APP_ENV`, `APP_HOST`, `APP_PORT`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `FRONTEND_URL`.
2. **Frontend `frontend/.env.example`** (Workstream A):
   - Contains Vite-specific client variables (`VITE_API_BASE_URL`).

---

## 4. PostgreSQL Persistence & Healthchecks

- Data persistence is managed via the named volume `postgres_data` mapped to `/var/lib/postgresql/data`.
- A healthcheck is configured on the `postgres` service using `pg_isready`:
  ```yaml
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER:-knowledge_atlas} -d ${DATABASE_NAME:-knowledge_atlas}"]
    interval: 5s
    timeout: 5s
    retries: 5
    start_period: 5s
  ```
- The backend service waits for database readiness with `depends_on: postgres: condition: service_healthy`.

---

## 5. Alembic Database Migrations

- **Configuration File**: `backend/alembic.ini`
- **Environment & Metadata Hook**: `backend/alembic/env.py`
- **Migration Scripts Directory**: `backend/alembic/versions/`

### Running Migrations
```bash
# Run migrations to latest head
uv run alembic -c backend/alembic.ini upgrade head

# Generate a new migration
uv run alembic -c backend/alembic.ini revision --autogenerate -m "description"
```

---

## 6. Integration Testing with Testcontainers

Integration tests reside in `tests/integration/` and validate:
$$\text{Backend} \longrightarrow \text{SQLAlchemy 2} \longrightarrow \text{Psycopg 3} \longrightarrow \text{PostgreSQL 16}$$

All integration tests dynamically provision an isolated `postgres:16-alpine` container using `testcontainers-python`. Tests do not rely on local developer state or external shared databases.

### Running Integration Tests Locally
```bash
uv run pytest tests/integration
```

---

## 7. Local Development Script

The canonical dev startup script is `scripts/dev.sh`:
```bash
./scripts/dev.sh
```
This script automatically copies `.env.example` to `.env` if missing and runs `docker compose up --build`.

---

## 8. Continuous Integration (CI)

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on all PRs and pushes to `main`, validating:
- Backend code formatting and linting (`ruff check`, `ruff format`)
- Backend unit tests
- Isolated PostgreSQL integration tests with Testcontainers
- Alembic configuration and migration health
- Docker Compose configuration (`docker compose config`)
- Security & secret checks (preventing committed `.env` files)
- Frontend linting, testing, and production build
