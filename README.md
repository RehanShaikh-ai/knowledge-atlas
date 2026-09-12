# Collaborative Second Brain

> An AI-powered knowledge workspace that connects notes, ideas, and information into a living knowledge graph.

> 🚧 **This project is currently under active development.**
> Architecture, features, and implementation details may change as the project evolves.

## Overview

Collaborative Second Brain is a workspace for capturing, connecting, and exploring knowledge with the help of AI.

Instead of treating information as isolated notes, the system represents knowledge as connected **nodes** and **relationships**. These connections can be used alongside documents and semantic search to retrieve relevant context and provide better answers through an LLM.

The long-term goal is to build a collaborative, AI-powered knowledge system that combines structured knowledge, source material, graph retrieval, and AI-assisted reasoning.

---

# V1 Scope

V1 focuses on building the **core knowledge and AI pipeline**.

## V1 Features

- Create and manage notes and documents
- Store documents and their metadata
- Represent knowledge as nodes and relationships
- Visualize the knowledge graph
- Search the knowledge base
- Retrieve relevant information using hybrid retrieval
- Perform Retrieval-Augmented Generation (RAG)
- Retrieve graph context alongside source information
- Provide retrieved context to an LLM
- Ask questions about the knowledge base

V1 is divided into **10 development divisions**, from `v0.1` through `v1.0`. Each division is further split into two parts:

```text
v0.1
├── v0.1.1
└── v0.1.2

v0.2
├── v0.2.1
└── v0.2.2

...

v1.0
├── v1.0.1
└── v1.0.2
````

Each part represents a concrete development increment that should result in a usable improvement to the product.

---

# V1 Architecture

```text
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Frontend   │
                         │ React + TS   │
                         └──────┬───────┘
                                │
                           REST / JSON
                                │
                                ▼
                         ┌──────────────┐
                         │   Backend    │
                         │ FastAPI +    │
                         │   Python     │
                         └──────┬───────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │  Documents   │      │    Knowledge │      │  Retrieval   │
   │  & Sources   │      │    Graph     │      │   / RAG      │
   └──────────────┘      └──────────────┘      └──────┬───────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │     LLM      │
                                               └──────────────┘
```

PostgreSQL acts as the primary source of truth, with `pgvector` used for semantic retrieval.

---

# Core Concepts

## Knowledge Graph

Knowledge is represented as a graph of connected concepts.

```text
[Machine Learning]
        │
        ├── [Neural Networks]
        │        │
        │        └── [Transformers]
        │
        └── [Supervised Learning]
```

**Nodes** represent pieces of knowledge.

**Edges** represent relationships between them.

The graph is intended to preserve both the structure of the knowledge and its relationship to the sources from which it was derived.

## Retrieval

The system combines multiple retrieval methods rather than relying on a single search mechanism.

```text
                    Question
                        │
                        ▼
                  Query Processing
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
  Keyword Search   Vector Search   Graph Retrieval
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                    Context
                        │
                        ▼
                       LLM
                        │
                        ▼
                      Answer
```

This allows retrieved context to include:

* Relevant documents
* Semantically similar content
* Relevant knowledge nodes
* Relationships between concepts
* Source/provenance information

## RAG

**Retrieval-Augmented Generation (RAG)** allows the system to retrieve relevant information from the knowledge base before generating an answer.

The V1 goal is to establish this pipeline reliably and provide grounded answers based on the stored knowledge and sources.

---

# Technology Stack

## Frontend

* TypeScript
* React
* Vite
* Tailwind CSS
* shadcn/ui
* React Router
* TanStack Query
* Zustand
* Three.js
* React Three Fiber
* D3.js

## Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy 2
* Psycopg 3
* Alembic
* uv
* pytest

## Database

* PostgreSQL
* pgvector

PostgreSQL is the primary source of truth for application data, knowledge data, relationships, metadata, and embeddings.

## AI / LLM

* FreeLLMAPI
* OmniRoute
* Ollama
* vLLM
* Open-source embedding models
* LangGraph where multi-step AI workflows require it

The application is designed around a provider-independent AI layer so that LLM providers and local models can be changed without restructuring the application.

## Knowledge Processing

* Graphify
* Docling
* Obsidian vault import
* Tesseract / OCR tooling
* Whisper
* Tree-sitter

These components will be introduced progressively as the relevant features are implemented.

## Infrastructure

* Docker
* Docker Compose
* GitHub Actions
* Linux

Additional infrastructure such as Redis, MinIO, or dedicated observability services will only be introduced when required by the product.

---

# Open-Source & Free-First Approach

The project is intended to remain **free to use and open-source**.

The architecture therefore prioritizes:

* Open-source software
* Self-hostable components
* Local inference where practical
* Free/open-source embedding models
* Replaceable external integrations
* No mandatory paid APIs

External services may be supported through adapters, but the core application should not depend on a paid provider to function.

---

# Future Plans

These features are **not necessarily part of the initial V1 implementation** and may change as development progresses.

## Collaboration

* Multi-user workspaces
* Real-time collaborative editing
* Permissions and access control
* Shared knowledge graphs
* Comments and discussions
* Contribution history

## Advanced Knowledge Processing

* Automatic concept extraction
* Automatic relationship discovery
* Knowledge graph enrichment
* Advanced graph retrieval
* Knowledge versioning and history
* Knowledge gap detection
* Source provenance and confidence tracking

## AI & Agents

* Agentic workflows
* AI-assisted organization
* Autonomous knowledge maintenance
* More advanced retrieval strategies
* AI-assisted graph editing

## Study & Learning

* Study mode
* Question generation
* Quizzes
* Knowledge-gap tracking
* Adaptive learning
* Prerequisite discovery

## Integrations

* Additional document formats
* Obsidian vault import
* External knowledge connectors
* Cloud storage integrations
* Additional data sources
* Import/export functionality

The future direction is intentionally flexible. Features will be prioritized based on what proves useful during development rather than being treated as a fixed specification.

---

# Development

## Requirements

* Git
* Docker
* Docker Compose

Additional requirements may be introduced as specific features are implemented.

## Run

```bash
git clone <repository-url>
cd <repository-directory>

docker compose up --build
```

Development instructions will be expanded as the system is implemented.

---

# Project Structure

```text
.
├── backend/
├── frontend/
├── docs/
│   ├── contracts/
│   └── architecture/
├── tests/
├── docker/
├── scripts/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

The structure may evolve during development.

---

# Development Status

🚧 **Active Development**

Collaborative Second Brain is currently in the early development stage.

The current work is focused on establishing the project's foundation and progressively implementing the V1 knowledge, graph, retrieval, and AI pipeline.

Development is organized into incremental releases:

```text
v0.1 → v0.2 → v0.3 → ... → v1.0
```

Each division contains two development parts:

```text
v0.x
├── v0.x.1
└── v0.x.2
```

Architecture, technologies, features, and implementation details may change as the project develops.