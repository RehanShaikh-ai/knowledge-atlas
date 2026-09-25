"""GraphRAG service.

Canonical service per CONTRACT v0.3.2 §5.3, §9.7, §10.
Executes multi-hop graph traversal combined with vector retrieval for grounded reasoning.
"""

import logging
import time
import uuid
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ValidationError, WorkspaceNotFoundError
from app.models.entity_chunk import EntityChunk
from app.models.graph_entity import GraphEntity
from app.models.graph_relationship import GraphRelationship
from app.models.workspace import Workspace
from app.schemas.graph_rag import (
    GraphRAGContext,
    GraphRAGRequest,
    GraphRAGResponse,
    GraphTraversedEntity,
    GraphUsedRelationship,
)
from app.schemas.rag import CitedSource
from app.services import llm_service, retrieval_service

logger = logging.getLogger("app.services.graph_rag_service")

GRAPHRAG_SYSTEM_PROMPT = """You are an intelligent knowledge graph reasoning assistant.
You answer user queries by combining direct source text excerpts and
structured relationships between concepts in the knowledge graph.
Always ground your answers in the provided context. If the context does not contain
enough information, state what is known and what is missing.
"""


def traverse_graph(
    db: Session,
    workspace_id: uuid.UUID,
    entity_ids: list[uuid.UUID],
    max_hops: int = 2,
) -> tuple[list[GraphEntity], list[GraphRelationship], int]:
    """Traverse graph from seed entity IDs up to max_hops per CONTRACT §10."""
    if not entity_ids:
        return [], [], 0

    if max_hops < 1 or max_hops > 2:
        raise ValidationError(f"max_hops must be 1 or 2, got {max_hops}.")

    visited_entity_ids: set[uuid.UUID] = set(entity_ids)
    all_relationships: list[GraphRelationship] = []
    current_level_ids: set[uuid.UUID] = set(entity_ids)
    actual_hops = 0

    for hop in range(1, max_hops + 1):
        if not current_level_ids:
            break

        rels = db.scalars(
            select(GraphRelationship).where(
                GraphRelationship.workspace_id == workspace_id,
                or_(
                    GraphRelationship.source_entity_id.in_(current_level_ids),
                    GraphRelationship.target_entity_id.in_(current_level_ids),
                ),
            )
        ).all()

        if not rels:
            break

        actual_hops = hop
        next_level_ids: set[uuid.UUID] = set()

        for r in rels:
            if r.id not in [existing.id for existing in all_relationships]:
                all_relationships.append(r)
            if r.source_entity_id not in visited_entity_ids:
                next_level_ids.add(r.source_entity_id)
            if r.target_entity_id not in visited_entity_ids:
                next_level_ids.add(r.target_entity_id)

        visited_entity_ids.update(next_level_ids)
        current_level_ids = next_level_ids

    # Fetch all visited entity models
    traversed_entities = db.scalars(
        select(GraphEntity).where(
            GraphEntity.workspace_id == workspace_id,
            GraphEntity.id.in_(visited_entity_ids),
        )
    ).all()

    return list(traversed_entities), all_relationships, actual_hops


def assemble_graph_context(
    retrieved_items: list[dict[str, Any]],
    traversed_entities: list[GraphEntity],
    relationships: list[GraphRelationship],
    token_limit: int = 2048,
) -> tuple[str, list[CitedSource], GraphRAGContext]:
    """Combine text chunks, entity descriptions, and relationship triples into context."""
    entity_map = {e.id: e.name for e in traversed_entities}

    # Format graph section
    graph_lines = []
    if traversed_entities:
        graph_lines.append("### Relevant Concepts & Entities:")
        for e in traversed_entities[:15]:
            desc = f": {e.description}" if e.description else ""
            graph_lines.append(f"- **{e.name}** ({e.entity_type}){desc}")

    if relationships:
        graph_lines.append("\n### Concept Relationships:")
        for r in relationships[:20]:
            src = entity_map.get(r.source_entity_id, "Unknown")
            tgt = entity_map.get(r.target_entity_id, "Unknown")
            graph_lines.append(f"- {src} --[{r.relationship_type}]--> {tgt}")

    # Format text chunk section
    chunk_lines = ["\n### Source Notes Excerpts:"]
    citations: list[CitedSource] = []

    for i, item in enumerate(retrieved_items, start=1):
        note_id = item.get("note_id")
        note_title = item.get("note_title", "Untitled Note")
        content = item.get("content", "")
        chunk_id = item.get("chunk_id")
        score = float(item.get("score", 1.0))

        chunk_lines.append(f"\n[Source {i}: {note_title}]\n{content}")
        citations.append(
            CitedSource(
                chunk_id=uuid.UUID(str(chunk_id)) if chunk_id else uuid.uuid4(),
                note_id=uuid.UUID(str(note_id)) if note_id else uuid.uuid4(),
                title=note_title,
                excerpt=content[:250] + ("..." if len(content) > 250 else ""),
                score=score,
            )
        )

    full_context = "\n".join(graph_lines + chunk_lines)
    # Token estimation (approx 4 chars per token)
    char_limit = token_limit * 4
    if len(full_context) > char_limit:
        full_context = full_context[:char_limit] + "\n[Context truncated...]"

    traversed_entity_responses = [
        GraphTraversedEntity(id=e.id, name=e.name, entity_type=e.entity_type)
        for e in traversed_entities
    ]
    used_relationship_responses = [
        GraphUsedRelationship(
            id=r.id,
            relationship_type=r.relationship_type,
            source=entity_map.get(r.source_entity_id, "Unknown"),
            target=entity_map.get(r.target_entity_id, "Unknown"),
        )
        for r in relationships
    ]

    graph_context = GraphRAGContext(
        entities_traversed=traversed_entity_responses,
        relationships_used=used_relationship_responses,
        hops=0,
    )

    return full_context, citations, graph_context


def run_graph_rag(
    db: Session,
    workspace_id: uuid.UUID,
    request: GraphRAGRequest,
) -> GraphRAGResponse:
    """Execute GraphRAG pipeline per CONTRACT §9.7, §10."""
    start_time = time.perf_counter()

    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError("Workspace not found.")

    if request.max_hops > 2:
        raise ValidationError("max_hops cannot exceed 2.")

    # 1. Vector retrieval using hybrid search
    search_results = retrieval_service.search_hybrid(
        db=db,
        workspace_id=workspace_id,
        query=request.query,
        limit=request.context_limit,
    )
    retrieved_items = [
        {
            "chunk_id": item.chunk_id,
            "note_id": item.note_id,
            "note_title": item.title,
            "content": item.excerpt,
            "score": item.score,
        }
        for item in search_results
    ]

    # Collect entity IDs from retrieved chunks
    seed_entity_ids: list[uuid.UUID] = []
    chunk_ids = [item["chunk_id"] for item in retrieved_items if item.get("chunk_id")]

    if chunk_ids:
        prov_rows = db.scalars(
            select(EntityChunk.entity_id).where(
                EntityChunk.workspace_id == workspace_id,
                EntityChunk.chunk_id.in_(chunk_ids),
            )
        ).all()
        seed_entity_ids = list(set(prov_rows))

    # Also check if query mentions any entity names directly
    direct_entities = db.scalars(
        select(GraphEntity).where(
            GraphEntity.workspace_id == workspace_id,
            GraphEntity.name.ilike(f"%{request.query.strip()}%"),
        )
    ).all()
    for de in direct_entities:
        if de.id not in seed_entity_ids:
            seed_entity_ids.append(de.id)

    # 2. Graph traversal (graceful degradation if seed_entity_ids is empty)
    traversed_entities: list[GraphEntity] = []
    traversed_rels: list[GraphRelationship] = []
    hops = 0

    if seed_entity_ids:
        traversed_entities, traversed_rels, hops = traverse_graph(
            db=db,
            workspace_id=workspace_id,
            entity_ids=seed_entity_ids,
            max_hops=request.max_hops,
        )

    # 3. Assemble graph context
    context_str, citations, graph_ctx = assemble_graph_context(
        retrieved_items=retrieved_items,
        traversed_entities=traversed_entities,
        relationships=traversed_rels,
        token_limit=getattr(settings, "CONTEXT_TOKEN_LIMIT", 2048),
    )
    graph_ctx.hops = hops

    # 4. Generate answer via LLM
    provider = llm_service.get_llm_provider()
    messages = [
        {"role": "system", "content": GRAPHRAG_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Context:\n{context_str}\n\nQuestion: {request.query}\n\nAnswer:",
        },
    ]

    answer = provider.generate(messages)

    latency_ms = int((time.perf_counter() - start_time) * 1000)

    return GraphRAGResponse(
        answer=answer,
        citations=citations,
        graph_context=graph_ctx,
        provider=provider.provider_name(),
        model=provider.model_name(),
        latency_ms=latency_ms,
    )
