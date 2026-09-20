# Knowledge Atlas v0.2.2

## Knowledge Expansion Contract

Release

v0.2.2

Status

Planning and architecture

Primary goal

Turn Knowledge Atlas into a structured knowledge workspace that can import existing knowledge, visualize relationships, and provide transparent insights.

## 1. Release Objectives

v0.2.2 will introduce three connected capabilities:

1. Source Ingestion: Import Markdown, text, PDFs, and Obsidian vaults.

2. Knowledge Graph: Visualize notes and their relationships.

3. Knowledge Dashboard: Display useful statistics about the workspace.

All features must work with the existing workspace, notes, users, and relationship architecture.

### Core workflow

```
Obsidian Vault / Files / PDFs
          |
          v
Source Import and Parsing
          |
          v
Notes + Metadata + Relationships
          |
          v
Knowledge Graph
          |
          v
Dashboard + Search + Navigation
```

# 2. Source Ingestion System v1

## 2.1 Supported sources

|
Source

|

Support

|
| --- | --- |
|

Markdown files

|

Required

|
|

Plain text files

|

Required

|
|

PDF documents

|

Required

|
|

Obsidian vault

|

Required

|
|

Individual Obsidian notes

|

Required

|
|

Images and OCR

|

Deferred

|
|

Web pages and URLs

|

Deferred

|
|

Videos and audio

|

Deferred

|
|

Automatic AI summarization

|

Deferred

|

The first release must focus on reliable extraction and preservation of information, not AI-generated interpretation.

## 2.2 Obsidian integration

Knowledge Atlas must support importing an Obsidian vault or selected Markdown files from a vault.

### Required Obsidian features

* Import `.md` notes.

* Preserve note titles.

* Parse Obsidian wikilinks:

  * `[[Machine Learning]]`

  * `[[Machine Learning|ML]]`

  * `[[Machine Learning#Neural Networks]]`

* Parse tags:

  * `#machine-learning`

  * `#research/deep-learning`

* Parse YAML frontmatter.

* Preserve relevant properties and metadata.

* Preserve folder paths.

* Detect internal links between notes.

* Resolve links to imported notes.

* Identify unresolved links.

* Avoid creating duplicate notes during repeated imports.

* Provide an import summary and error report.

### Example

An Obsidian note:

Markdown

```
---
title: Neural Networks
tags:
  - machine-learning
  - deep-learning
status: learning
---

Neural networks are a part of [[Machine Learning]].

Related topic: [[Backpropagation]]
```

Should become:

```
Note: Neural Networks
  |
  ├── Tags: machine-learning, deep-learning
  ├── Property: status = learning
  ├── Relationship → Machine Learning
  └── Relationship → Backpropagation
```

The importer must not silently convert wikilinks into ordinary text and discard their meaning.

## 2.3 Import behavior

The system must support:

* Preview before importing, where practical.

* Selecting files or a vault directory.

* Showing detected notes and relationships.

* Importing notes into a selected workspace.

* Tracking import status.

* Reporting imported, skipped, duplicated, and failed items.

* Re-running an import safely.

* Avoiding accidental deletion of existing notes.

### Duplicate handling

The implementation must define a deterministic strategy, such as:

* Stable source identifier.

* Source path and vault identifier.

* Content hash or modification metadata.

* Explicit behavior for changed files.

The system must not create duplicate notes every time a user imports the same vault.

## 2.4 Source data model

Introduce a source/import model only if it fits the existing architecture.

It should be able to represent:

* Source type.

* Original filename or path.

* Source identifier.

* Workspace ownership.

* Import status.

* Import timestamp.

* Last synchronization timestamp.

* Content hash, where appropriate.

* Error information.

* Relationship to the resulting note.

The design must distinguish between:

* The original source.

* The imported note.

* Relationships extracted from the source.

# 3. Knowledge Graph v1

## 3.1 Graph scope

The first graph version will use explicit, verifiable relationships from:

* Existing `note_links`.

* Obsidian wikilinks.

* Imported note relationships.

* Other relationship types already supported by the database.

It will not automatically invent semantic relationships using an LLM.

## 3.2 Graph requirements

### Backend

Provide endpoints for:

* Fetching a workspace graph.

* Fetching graph nodes.

* Fetching graph relationships.

* Fetching a single note's connected nodes.

* Filtering by relationship type.

* Filtering by selected notes or topics.

* Returning graph statistics.

All graph data must be scoped to the current workspace and respect authorization rules.

### Frontend

Provide:

* Interactive graph visualization.

* Node labels.

* Relationship lines.

* Node selection.

* Note detail panel.

* Navigation from graph node to note.

* Zoom and pan.

* Filtering.

* Handling for isolated notes.

* Loading, empty, and error states.

The graph must remain usable with a large number of nodes. Rendering every possible relationship simultaneously is not a design strategy.

# 4. Knowledge Dashboard v1

The dashboard should provide factual, explainable workspace statistics.

## Required metrics

* Total notes.

* Total relationships.

* Total tags.

* Total imported sources.

* Notes created recently.

* Notes with no relationships.

* Most connected notes.

* Relationship distribution.

* Tag distribution.

* Import status summary.

* Graph node and edge counts.

### Design principles

* Every metric must have a clear definition.

* Counts must be calculated from backend data.

* Workspace filtering must be enforced.

* Empty states must be handled.

* Metrics must not imply intelligence or quality where only quantity is measured.

For example, a note having 50 connections does not automatically make it more valuable. Humans already confuse popularity with importance often enough.

# 5. Search and Navigation Integration

The existing search and notes features must work with imported content.

Required behavior:

* Imported notes appear in search results.

* Search can use note title and content.

* Search results show source information when available.

* Clicking an imported note opens its note view.

* Graph nodes link to the corresponding note.

* Dashboard items link to relevant notes or filtered views.

* Obsidian-originated relationships remain navigable.

Semantic search, embeddings, and RAG remain separate future features unless the existing implementation already supports them safely.

# 6. Database and Migration Requirements

Before implementation, inspect the current schema and determine whether new tables or fields are required.

Potential entities include:

* Sources.

* Import jobs.

* Source-to-note mappings.

* Import errors.

* Source metadata.

* Stable external identifiers.

The implementation must:

* Use Alembic migrations.

* Preserve existing data.

* Avoid destructive migrations.

* Add appropriate indexes.

* Define foreign keys and deletion behavior.

* Ensure workspace isolation.

* Include migration tests.

* Document rollback considerations.

Do not introduce duplicate concepts if existing `notes`, `note_links`, tags, or workspace models can support the requirement.

# 7. API Contract Requirements

Before coding, define and document:

* Request schemas.

* Response schemas.

* Authentication and authorization requirements.

* Error responses.

* Pagination behavior.

* Filtering parameters.

* Import status values.

* Idempotency behavior.

* File size and type limits.

All endpoints must use the project's existing API conventions rather than introducing a separate style.

Validation errors should provide useful development information in logs and appropriate safe details in API responses. The previous hidden `422` problem is precisely why opaque errors are not a feature.

# 8. Frontend Requirements

The frontend must include:

* Source import interface.

* Obsidian import flow.

* Import preview and results.

* Graph view.

* Dashboard view.

* Loading states.

* Empty states.

* Error states.

* Responsive layout.

* Consistent visual design.

* Tests for user-visible behavior.

The frontend must not use hardcoded user IDs, workspace IDs, or fake successful responses.

# 9. Security and Data Integrity

The implementation must ensure:

* Users can only access authorized workspaces.

* Imported files are validated.

* File paths are not trusted blindly.

* Path traversal is prevented.

* Unsupported file types are rejected.

* Upload limits are enforced.

* Malformed files fail safely.

* Importing does not overwrite unrelated notes.

* Duplicate imports are handled predictably.

* Source content is treated as untrusted data.

Obsidian notes may contain arbitrary text, links, and metadata. None of that should be interpreted as executable instructions.

# 10. Testing Requirements

## Backend

* Unit tests for Markdown parsing.

* Unit tests for wikilink parsing.

* Unit tests for frontmatter extraction.

* Unit tests for tags.

* PDF extraction tests.

* Duplicate import tests.

* Re-import and update tests.

* Unresolved-link tests.

* API integration tests.

* Authorization tests.

* Migration tests.

* Graph filtering tests.

* Dashboard metric tests.

## Frontend

* Import form tests.

* Preview and error-state tests.

* Graph rendering tests.

* Node selection tests.

* Dashboard metric tests.

* Navigation tests.

* Empty-state tests.

## Integration

At minimum, test this complete flow:

```
Import Obsidian vault
      ↓
Parse notes and wikilinks
      ↓
Create notes and relationships
      ↓
Retrieve workspace graph
      ↓
Display graph and dashboard metrics
      ↓
Search and open imported note
```

# 11. Explicitly Out of Scope

The following must not be silently added to v0.2.2:

* Automatic AI relationship generation.

* Embedding pipelines.

* Full RAG implementation.

* AI summaries for every imported note.

* OCR.

* Web scraping.

* Video and audio ingestion.

* Real-time bidirectional Obsidian synchronization.

* Automatic conflict resolution.

* Collaborative real-time editing.

* Advanced graph algorithms.

* Knowledge quality scoring.

* Automatic deletion from the original Obsidian vault.

These can be planned for later releases after the ingestion foundation is stable.

# 12. Implementation Workflow

Use separate branches:

```
backend/v0.2.2-knowledge-expansion
frontend/v0.2.2-knowledge-expansion
infra/v0.2.2-knowledge-expansion
review/v0.2.2-integration
```

### Required development sequence

1. Inspect the existing architecture.

2. Identify reusable models and services.

3. Write the technical design.

4. Define database changes.

5. Define API contracts.

6. Implement backend foundation.

7. Implement frontend workflows.

8. Add tests.

9. Integrate branches.

10. Run the complete validation suite.

11. Update documentation and changelog.

12. Merge and tag the release.

The coding agent must not begin implementation before producing a technical plan, including affected files, schema changes, API contracts, risks, and milestones. This contract is the product scope. The agent still needs to determine the correct implementation details from the actual repository.

Recommended release direction

Build Obsidian-aware ingestion + explicit knowledge graph + transparent dashboard as one connected release, while keeping AI inference and RAG for later.
