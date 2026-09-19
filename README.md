# Knowledge Atlas 🗺️

> *Build knowledge, not just notes.*

---

## What is Knowledge Atlas?

Most tools help you **store** information. Knowledge Atlas helps you **understand** it.

It's a personal knowledge platform that connects what you know, surfaces what you're missing, and helps you build understanding that actually holds up — not just a pile of notes you'll never read again.

---

## The Problem

You save articles. You write notes. You highlight PDFs.

And then six months later you're starting from scratch because nothing connected.

Standard notes apps are just digital filing cabinets. Knowledge graphs are powerful but hard to maintain. AI chatbots hallucinate and cite nothing. RAG tools return text chunks with no understanding of *why* something matters.

None of them help you **build and verify** understanding over time.

---

## What We're Building

Knowledge Atlas is a system that actively helps you capture, connect, and improve your knowledge — not just retrieve it.

```
Capture
   ↓
Organize
   ↓
Connect
   ↓
Verify
   ↓
Explore
   ↓
Understand
```

At its core it's:

- **A structured notes system** — write naturally, keep it organized
- **A knowledge graph** — concepts, relationships, and how they connect
- **A search and retrieval layer** — find what you need, even when you don't know exactly what to search for
- **An AI layer** — that works *with* your knowledge, not instead of it
- **A learning environment** — that helps you test, improve, and actually retain understanding

The goal isn't to replace thinking. It's to make thinking more reliable.

---

## Current State

Knowledge Atlas is in active early development. The foundation is being built methodically — each layer is tested, contracted, and integrated before the next one begins.

**What exists now:**

- ✅ Users and workspaces
- ✅ Full-stack infrastructure (FastAPI, React, PostgreSQL, Docker)
- ✅ Notes with Markdown, workspace tags, full-text search (`tsvector`), and note-to-note linking (v0.2.1 Knowledge Foundation)

**What's coming:**

- Knowledge graph (concepts, relationships, graph navigation)
- Source ingestion (PDFs, papers, web links, files)
- Semantic search and AI-powered retrieval
- AI assistant grounded in your actual knowledge base
- Study tools, quizzes, and learning progress tracking
- Collaboration and shared workspaces
- And more — the roadmap is ambitious and long-term

---

## Why It's Different

There's no shortage of notes apps. What makes this worth building:

**1. Knowledge, not just storage.**
The system is designed around *concepts and relationships*, not just documents and folders. What you know about a topic and how that connects to everything else is a first-class concept.

**2. Verification, not just retrieval.**
We're building tools to actively surface gaps, contradictions, and unsupported claims — so you know not just what you've captured, but whether it actually holds together.

**3. AI that stays honest.**
AI features are grounded in your own knowledge base with citations. The system doesn't pretend to know things it doesn't, and it doesn't silently replace your thinking.

**4. Built to last.**
Strict engineering contracts, clean migrations, replaceable infrastructure. This is designed as a long-term system, not a prototype.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL, Alembic |
| Infrastructure | Docker Compose, GitHub Actions |
| AI (planned) | Configurable — Ollama, OpenAI-compatible, others |

The AI layer is designed to be provider-agnostic from the start. No hard dependency on any single model or service.

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- `uv` (Python package manager)

### Quick Start

```bash
git clone <repo-url>
cd knowledge-atlas

# Set up environment files
cp .env.example .env
cp frontend/.env.example frontend/.env

# Start the full stack
docker compose up --build
```

Open **http://localhost:5173**.

That's it. PostgreSQL, migrations, backend, and frontend all start in the right order automatically.

### Local Development

If you'd rather run services individually:

```bash
# Backend
cd backend
uv sync
uv run alembic upgrade head
uv run python -m uvicorn app.main:app --reload --port 8080

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

---

## API

Base URL: `http://localhost:8080/api/v1`

**Current endpoints:**

```http
GET    /api/v1/health

POST   /api/v1/users
GET    /api/v1/users
GET    /api/v1/users/{id}

POST   /api/v1/workspaces
GET    /api/v1/workspaces
GET    /api/v1/workspaces/{id}

POST   /api/v1/workspaces/{workspace_id}/notes
GET    /api/v1/workspaces/{workspace_id}/notes
GET    /api/v1/notes/{note_id}
PATCH  /api/v1/notes/{note_id}
DELETE /api/v1/notes/{note_id}

POST   /api/v1/notes/{note_id}/tags
DELETE /api/v1/notes/{note_id}/tags/{tag_id}
GET    /api/v1/workspaces/{workspace_id}/tags

POST   /api/v1/notes/{note_id}/links
DELETE /api/v1/notes/{note_id}/links/{target_note_id}
GET    /api/v1/notes/{note_id}/links

GET    /api/v1/workspaces/{workspace_id}/notes/search?q={query}
```

Full API documentation is generated automatically at `http://localhost:8080/docs` when the backend is running.

---

## Project Structure

```
knowledge-atlas/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── core/     # Config, error handling
│   ├── tests/
│   └── alembic/      # Database migrations
│
├── frontend/         # React + TypeScript application
│   └── src/
│       ├── api/      # API client modules
│       ├── components/
│       ├── pages/
│       └── types/
│
├── tests/
│   └── integration/  # Full-stack integration tests
│
├── docs/             # Engineering contracts and architecture
├── scripts/          # Development utilities
└── docker-compose.yml
```

---

## Engineering Approach

Knowledge Atlas uses a **contract-driven development** process.

Before any feature is built, a formal engineering contract defines:
- Exact API interfaces
- Database schema and relationships
- Ownership boundaries across the team
- Error handling requirements
- Test coverage requirements
- What is and isn't in scope

This keeps three independent contributors from building incompatible things. Every interface is defined before anyone writes code.

Contracts live in `docs/`.

---

## Contributing

The project uses three workstreams:

| Workstream | Scope |
|---|---|
| Frontend | React application, TypeScript, UI |
| Backend | FastAPI, SQLAlchemy, Pydantic, services |
| Infrastructure | Docker, Alembic, CI, integration |

Before contributing to any workstream, read the relevant engineering contract in `docs/`. The contract defines what you can change, what you must use, and what you must not touch.

Branch naming:

```
frontend/<description>
backend/<description>
infra/<description>
```

All changes land via pull request. Cross-workstream files (like `docker-compose.yml` and contracts) require approval from all three workstreams.

---

## Status

This is an early-stage project with an intentionally long build horizon. The foundation is being built to support a system significantly more capable than what currently exists.

If the vision sounds interesting and you want to follow along, watch the repo.

---

## License

[TBD]

---

*Knowledge Atlas — because understanding is more than storage.*