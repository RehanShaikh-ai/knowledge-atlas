# Collaborative Second Brain 🧠

A personal knowledge‑management platform built with a strict multi‑workstream engineering contract. **Infrastructure‑first, features‑second**.

**Current version:** `v0.1.2` – *Identity & Workspace Foundation*  
**Status:** Active development  
**Team:**
- Frontend: Hamza (primary), Rehan (backup)
- Backend: Ali (primary), Hamza (backup)
- Infrastructure & Integration: Rehan (primary), Ali (backup)

---

## 📋 What’s Included

### v0.1.1 – Infrastructure Foundation ✅
- Docker Compose orchestration, PostgreSQL, health checks
- Basic CI / linting pipeline

```http
GET /api/v1/health → {"status": "ok"}
```

### v0.1.2 – Identity & Workspace Foundation ✅
- **Users** – display name, timestamps
- **Workspaces** – owned by users, description

```http
POST /api/v1/users
POST /api/v1/workspaces
GET  /api/v1/users
GET  /api/v1/workspaces
```

Full CRUD for both domains, with SQLAlchemy models, Pydantic schemas and services.

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (frontend dev)
- Python 3.12+ (backend dev)
- `uv` (backend package manager)
- `git`

### 1. Clone & Enter
```bash
git clone https://github.com/RehanShaikh-ai/knowledge-atlas
cd knowledge-atlas
```

### 2. Prepare Environment Files
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```
> **Note:** The root `.env` is used by Docker Compose; the `frontend/.env` is read by Vite (variables must be prefixed with `VITE_`).

### 3. Run the Full Stack (Docker)
```bash
docker compose up --build
```
The stack starts:
- **PostgreSQL** – `localhost:5432`
- **Migration runner** – one‑shot, applies Alembic migrations
- **Backend (FastAPI)** – `localhost:8080`
- **Frontend (Vite)** – `localhost:5173`

Open `http://localhost:5173` in a browser. Wait a minute for all services to report *running*.

### 4. Local Development (Without Docker)
#### Backend
```bash
cd backend
uv sync                     # install deps
export $(cat ../.env | xargs)   # load env vars
uv run alembic upgrade head      # run migrations
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```
#### Frontend
```bash
cd frontend
npm install
npm run dev
```
#### Database (Standalone)
```bash
# Create user & database (Postgres must be installed locally)
createuser -P knowledge_atlas   # password: change_me
createdb -O knowledge_atlas knowledge_atlas
```
Then point `.env` to the local instance (see *Environment Variables* below).

---

## 📁 Project Structure
```text
.
├── backend/                     # Workstream B – Backend
│   ├── app/                     # FastAPI app
│   │   ├── api/v1/              # Endpoints (health, users, workspaces)
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # Business logic
│   │   ├── core/                 # config, exception handling
│   │   └── db/                   # session & base
│   ├── alembic/                 # Workstream C – Migrations
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/                    # Workstream A – Frontend
│   ├─ src/                      # React + TypeScript source
│   ├─ .env.example
│   ├─ Dockerfile
│   └─ vite.config.ts
├── docs/                        # Contracts & tech decisions
├── scripts/                     # Helper scripts (dev.sh, etc.)
├── docker-compose.yml
├── .env.example
└── README.md
```
---

## 🔧 Development Workflow
1. **Create a feature branch** from `main`
```bash
git switch -c <workstream>/feature-name
```
2. **Stay within your workstream** – do not modify another workstream without an explicit contract amendment.
3. **Run tests**
```bash
# Backend
cd backend && uv run pytest
# Frontend
cd frontend && npm test
# Integration (requires Docker)
docker compose up -d
docker compose exec -T backend uv run pytest tests/integration/
```
4. **Push & open a PR** targeting `main`. Include:
   - What changed & why
   - Tested scenarios
   - Cross‑workstream impact (if any)
   - Known limitations
5. **Integration review** – after individual PRs are approved, merge them into an integration branch (e.g. `review/v0.1.2-integration`) and run the full stack smoke test.

---

## 🧪 Testing
### Backend
```bash
cd backend
uv run pytest               # all tests
uv run pytest --cov=app      # with coverage
```
### Frontend
```bash
cd frontend
npm test                     # all tests
npm test -- --watch          # watch mode
```
### Integration (Docker)
```bash
docker compose up -d
docker compose exec -T backend uv run pytest tests/integration/
docker compose down
```
---

## 🌐 API Endpoints
Base URL: `http://localhost:8080/api/v1`

### Health (v0.1.1)
```http
GET /health → {"status": "ok"}
```

### Users (v0.1.2)
| Method | Path | Purpose |
|--------|------|---------|
| POST   | `/users` | Create user |
| GET    | `/users/{user_id}` | Retrieve user |
| GET    | `/users` | List all users |

#### Create a user
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"display_name": "Alice"}'
```
_Response (201):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "display_name": "Alice",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Workspaces (v0.1.2)
| Method | Path | Purpose |
|--------|------|---------|
| POST   | `/workspaces` | Create workspace |
| GET    | `/workspaces/{workspace_id}` | Retrieve workspace |
| GET    | `/workspaces` | List all workspaces |

#### Create a workspace
```bash
curl -X POST http://localhost:8080/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Research",
    "description": "My research notes",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```
_Response (201):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Research",
  "description": "My research notes",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:35:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

### Error Responses
All errors share a common envelope:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human‑readable explanation"
  }
}
```
Common codes:
| Code | Meaning | HTTP |
|------|---------|------|
| `VALIDATION_ERROR` | Invalid request data | 422 |
| `USER_NOT_FOUND` | User does not exist | 404 |
| `WORKSPACE_NOT_FOUND` | Workspace does not exist | 404 |
| `INTERNAL_SERVER_ERROR` | Unexpected server error | 500 |
---

## 📦 Environment Variables
### Root `.env.example`
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
### Frontend `.env.example`
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```
> **Never** commit real credentials – only the `.example` files are version‑controlled.
---

## 🗄️ Database Migrations (Alembic)
```bash
cd backend
uv run alembic current               # show current revision
uv run alembic upgrade head           # apply latest
uv run alembic downgrade -1           # rollback one step
uv run alembic revision --autogenerate -m "Add new_field to User"
```
Commit any new migration files – they are part of the contract.
---

## 🐳 Docker Tips
```bash
# Re‑build a single service
docker compose up --build backend

# Re‑build everything
docker compose up --build

# View logs
docker compose logs -f               # all services
docker compose logs -f backend        # backend only

# Clean up (removes volumes & data)
docker compose down -v
```
---

## 🚧 Known Limitations (v0.1.2)
**✅ Implemented**
- Basic user & workspace CRUD
- UUID primary keys & ownership
- Full test coverage for core flows
- Docker Compose with health checks

**❌ Not yet implemented**
- Authentication / login
- Authorization / permissions
- Workspace membership (only owners)
- Notes, documents, knowledge graphs
- Real‑time collaboration
- File uploads, search, tagging, vector embeddings, RAG

Future contracts (`v0.1.3`, `v0.2.0`, …) will address these.
---

## 📖 Next Steps
### For Contributors
1. Pick a workstream (frontend, backend, infrastructure).
2. Read the relevant contract section in `docs/CONTRACT_v0.1.2.md`.
3. Follow the *Development Workflow* above.
4. Open a PR and request review from the other workstream owners.

### For the Product Roadmap
- **v0.1.3** – Authentication & login
- **v0.2.0** – Basic notes & documents
- **v0.2.1** – Full‑text search
- **v0.3.0** – Knowledge‑graph foundation
- **v0.4.0** – Retrieval‑augmented generation (RAG)
---

## 🤝 Contributing
We enforce strict workstream ownership to let three independent contributors work in parallel without stepping on each other. See the contract for your role:
- Frontend → `docs/CONTRACT_v0.1.2.md` §3.1
- Backend → `docs/CONTRACT_v0.1.2.md` §3.2
- Infrastructure → `docs/CONTRACT_v0.1.2.md` §3.3

Questions? Check the contract first – it’s designed to answer most of them.
---

## 📝 License
This project is licensed under the **MIT License**. See the `LICENSE` file for details.
---

## 🧑‍💻 Team
| Role | Primary | Backup |
|------|---------|--------|
| Frontend | Hamza | Rehan |
| Backend | Ali | Hamza |
| Infrastructure & Integration | Rehan | Ali |
---

## 📚 Resources
- **Engineering Contracts**: `docs/CONTRACT_v0.1.1.md`, `docs/CONTRACT_v0.1.2.md`
- **Tech Stack Decisions**: `docs/tech_stack.md`
- **GitHub Profiles**:
  - [RehanShaikh‑ai](https://github.com/RehanShaikh-ai)
  - [Alibubere](https://github.com/Alibubere)
  - [hamzzaqureshi](https://github.com/hamzzaqureshi)

---

**Made with ☕ and 📋 (lots of spec, minimal hand‑waving).**