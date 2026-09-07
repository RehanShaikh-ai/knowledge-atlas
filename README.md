# Collaborative Second Brain

> An AI-powered knowledge workspace that connects notes, ideas, and information into a living knowledge graph.

## Overview

Collaborative Second Brain is a workspace for capturing, connecting, and exploring knowledge with the help of AI.

Instead of treating information as isolated notes, the system represents knowledge as connected **nodes** and **relationships**. These connections can be used alongside documents to retrieve relevant context and provide better answers through an LLM.

---

# V1 Scope

V1 focuses on building the **core knowledge and AI pipeline**.

## V1 Features

* Create and manage notes/documents
* Store documents and their metadata
* Represent knowledge as nodes and relationships
* Visualize the knowledge graph
* Search the knowledge base
* Retrieve relevant information using RAG
* Provide retrieved context to an LLM
* Ask questions about the knowledge base

## V1 Architecture

```text
                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Web Client  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Backend   │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌───────────┐
        │Documents │  │ Knowledge│  │ Retrieval │
        │          │  │  Graph   │  │   / RAG   │
        └──────────┘  └──────────┘  └─────┬─────┘
                                         │
                                         ▼
                                    ┌──────────┐
                                    │   LLM    │
                                    └──────────┘
```

## Core Concepts

### Knowledge Graph

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

### RAG

**Retrieval-Augmented Generation (RAG)** allows the system to retrieve relevant information from the knowledge base before generating an answer.

```text
Question
   │
   ▼
Retrieval
   │
   ├── Relevant documents
   ├── Relevant nodes
   └── Graph context
   │
   ▼
  LLM
   │
   ▼
 Answer
```

The V1 goal is to establish this basic pipeline reliably.

---

# Future Plans

These features are **not part of V1** and are intentionally deferred until the core system is working.

### Collaboration

* Multi-user workspaces
* Real-time collaborative editing
* Permissions and access control
* Shared knowledge graphs

### Advanced Knowledge Processing

* Automatic concept extraction
* Automatic relationship discovery
* Knowledge graph enrichment
* Graph-based retrieval improvements
* Knowledge versioning and history

### AI & Agents

* Agentic workflows
* AI-assisted organization
* Autonomous knowledge maintenance
* More advanced retrieval strategies

### Integrations

* External knowledge connectors
* Cloud storage integrations
* Third-party productivity tools
* Additional data sources

The future direction is intentionally flexible. Features will be prioritized based on what proves useful during V1 rather than being treated as a fixed specification.

---

# Development

## Requirements

* Docker
* Docker Compose
* Git
* An LLM API or compatible local model

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
├── tests/
├── docker-compose.yml
└── README.md
```

The structure may evolve during development.

---

# Status

🚧 **Early development**

V1 is focused on establishing the core knowledge graph, retrieval, and LLM pipeline. Architecture and implementation details may change as the project develops.
