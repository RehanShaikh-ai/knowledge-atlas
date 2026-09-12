# Knowledge Atlas — Technology Stack

## Frontend

- Language: TypeScript
- Framework: React
- Build Tool: Vite
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- Routing: React Router
- Server State: TanStack Query
- Client State: Zustand
- 2D/3D Visualization: Three.js
- React 3D: React Three Fiber
- Graph/Layout Utilities: D3.js
- Testing:
  - Vitest
  - React Testing Library
  - Playwright


## Backend

- Language: Python
- Runtime: Python 3.13+
- API Framework: FastAPI
- Data Validation: Pydantic
- ORM / Database Layer: SQLAlchemy 2
- Database Driver: Psycopg 3
- Migrations: Alembic
- Package / Project Manager: uv
- Testing: pytest


## API

- Architecture: REST
- Format: JSON
- API Versioning: /api/v1
- API Specification: OpenAPI
- Authentication / Authorization: FastAPI-compatible security layer
  - Introduced when collaboration/authentication is implemented


## Primary Database

- Database: PostgreSQL
- Vector Extension: pgvector

PostgreSQL is the primary source of truth.

It stores:
- Users
- Workspaces
- Notes
- Sources
- Knowledge Nodes
- Relationships
- Permissions
- Revisions / History
- Metadata
- Embeddings

pgvector provides:
- Semantic similarity search
- Vector storage
- Approximate nearest-neighbor search

No separate vector database initially.


## Knowledge Graph

- Canonical Graph Storage: PostgreSQL
- Graph Extraction / Analysis: Graphify
- Graph Representation:
  - Nodes
  - Edges
  - Relationship types
  - Provenance
  - Extracted vs inferred relationships

Graphify is used as a graph extraction / graph tooling component,
not as the permanent owner of the Knowledge Atlas graph.

Knowledge Atlas owns its own graph model and retrieval layer.


## Search & Retrieval

Hybrid retrieval:

1. PostgreSQL full-text search
2. pgvector semantic search
3. Graph traversal
4. Optional reranking

Pipeline:

User Query
    ↓
Query Understanding
    ↓
┌──────────────┬──────────────┬──────────────┐
│ Keyword      │ Vector       │ Graph        │
│ Search       │ Search       │ Retrieval    │
└──────────────┴──────────────┴──────────────┘
                    ↓
                Reranking
                    ↓
             Context Assembly
                    ↓
                  RAG


## LLM Layer

The application does NOT directly depend on one LLM provider.

Internal abstraction:

LLMService
    ├── FreeLLMAPI
    ├── OmniRoute
    └── Local Models

Primary goal:
- Free to use
- Provider-independent
- Replaceable backends
- Open-source/self-hosted options


## Local LLM Serving

- Development / simple local inference: Ollama
- High-performance GPU inference: vLLM

These are optional deployment targets, not mandatory dependencies
for every installation.


## Embeddings

- Open-source embedding models
- Local inference
- Sentence Transformers ecosystem
- Stored using pgvector

No paid embedding API required.


## AI Orchestration

- Normal Python for deterministic application logic
- LangGraph only where stateful / multi-step AI workflows are
  actually required

Examples:
- GraphRAG pipelines
- Agent workflows
- Multi-step research
- AI-assisted knowledge operations


## Document Ingestion

### Primary document processor

- Docling

Supported / planned formats include:
- PDF
- DOCX
- PPTX
- XLSX
- HTML
- EPUB
- Images
- Audio

Docling converts documents into structured representations suitable
for downstream processing and RAG.


### Obsidian

- Obsidian vault importer
- Markdown
- Wikilinks
- Frontmatter / properties
- Folder structure
- Attachments

Obsidian is treated as an IMPORT SOURCE / FORMAT,
not as the document-processing engine.


### OCR

- Tesseract
- Docling OCR integrations

Added when image/scanned-document ingestion is implemented.


### Audio

- Whisper / open-source Whisper implementations

Added when audio ingestion is implemented.


### Video

- FFmpeg
- Whisper

Added when video ingestion is implemented.


### Code

- Tree-sitter

Used for:
- Code parsing
- Structure extraction
- Code relationships
- Knowledge graph generation


## File / Object Storage

- S3-compatible storage
- MinIO for self-hosted deployments

PostgreSQL stores file metadata.
Object storage stores large files such as:
- PDFs
- Images
- Audio
- Video
- Other uploaded files


## Background Processing

Introduced when ingestion becomes asynchronous.

- Redis
- Background worker system

Potential worker:
- Celery
- Dramatiq

Do not introduce this in the foundation release unless required.


## Caching

- Redis

Potential uses:
- API caching
- LLM response caching
- Job coordination
- Rate limiting
- Temporary state

Introduced when needed.


## Authentication

Potential self-hosted solution:

- Keycloak

Alternative:
- Native FastAPI authentication

Final choice should be made when collaboration/authentication
is implemented rather than prematurely.


## Observability

When the system becomes complex enough:

- OpenTelemetry
- Prometheus
- Grafana

AI-specific observability:

- Langfuse

Used for:
- LLM traces
- Retrieval traces
- Latency
- Token usage
- Prompt / response debugging
- RAG evaluation


## Infrastructure

- Docker
- Docker Compose
- Linux
- GitHub Actions

Development:

Docker Compose
    ├── Frontend
    ├── Backend
    └── PostgreSQL

Additional services are introduced only when required.


## Testing

### Frontend
- Vitest
- React Testing Library
- Playwright

### Backend
- pytest
- FastAPI test client

### Integration
- Docker Compose
- Testcontainers

Test:
- API
- Database
- Authentication
- Retrieval
- Ingestion
- AI pipelines


## Development Tooling

- Git
- GitHub
- GitHub Actions
- uv
- npm / pnpm
- Docker
- Docker Compose


# Core Architecture

                    KNOWLEDGE ATLAS
                           │
                    React + TypeScript
                           │
                      REST / JSON
                           │
                    FastAPI + Python
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      PostgreSQL       AI Services      Ingestion
          │                │                │
      ┌───┴───┐       ┌────┴────┐       ┌──┴─────┐
      │       │       │         │       │        │
   pgvector Graph    LLM      Local   Docling  Obsidian
      │       │       │       Models     │        │
      │       │       │                  │        │
      └───────┴───────┴──────────────────┴────────┘
                           │
                    Knowledge System
                           │
                 ┌─────────┴─────────┐
                 │                   │
           Vector Retrieval    Graph Retrieval
                 │                   │
                 └─────────┬─────────┘
                           │
                          RAG
                           │
                          LLM
                           │
                    Knowledge Answer


# Design Principles

1. Open-source first
2. Self-hostable
3. No mandatory paid APIs
4. Provider-independent AI layer
5. PostgreSQL as the initial source of truth
6. Modular integrations
7. Add infrastructure only when a feature requires it
8. Knowledge Atlas owns its core data model
9. External tools provide capabilities, not the application's core architecture
10. Every major component should be replaceable without rewriting
    the rest of the system