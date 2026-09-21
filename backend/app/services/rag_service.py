"""RAG pipeline service.

Canonical service per CONTRACT v0.3.1 §5.3, §10.1-§10.5.
Provides run_rag, assemble_context, build_prompt.
"""

import logging
import time
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import RAGContextEmptyError
from app.schemas.rag import CitedSource, RAGRequest, RAGResponse
from app.schemas.search import SearchResultItem
from app.services import llm_service, reranking_service, retrieval_service

logger = logging.getLogger("app.services.rag_service")


def assemble_context(
    results: list[SearchResultItem],
    token_limit: int = 4096,
) -> tuple[str, list[CitedSource]]:
    """Assemble context text and cited sources bounded by token limit per CONTRACT §10.1, §10.3."""
    context_parts: list[str] = []
    citations: list[CitedSource] = []
    accumulated_chars = 0
    char_limit = token_limit * 4

    for item in results:
        chunk_text = item.excerpt.strip()
        if not chunk_text:
            continue
        # Estimate char budget
        item_chars = len(chunk_text) + len(item.title) + 50
        if accumulated_chars + item_chars > char_limit and context_parts:
            break

        c_id = item.chunk_id or item.note_id
        citation = CitedSource(
            chunk_id=c_id,
            note_id=item.note_id,
            title=item.title,
            excerpt=chunk_text,
            score=item.score,
        )
        citations.append(citation)

        part = f"### Note: {item.title} (ID: {item.note_id})\n{chunk_text}\n"
        context_parts.append(part)
        accumulated_chars += item_chars

    full_context = "\n---\n".join(context_parts)
    return full_context, citations


def build_prompt(query: str, context_text: str) -> list[dict[str, str]]:
    """Construct prompt messages instructing model to ground answers in provided context."""
    system_prompt = (
        "You are an AI assistant for Knowledge Atlas. Answer the user's question using ONLY "
        "the provided notes and excerpts below. Ground your claims in the context. If the "
        "context does not contain sufficient information, state clearly what is missing."
    )
    user_content = f"Context:\n{context_text}\n\nQuestion: {query}"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]


def run_rag(
    db: Session,
    workspace_id: uuid.UUID,
    request: RAGRequest,
) -> RAGResponse:
    """Run full RAG pipeline per CONTRACT §10.1."""
    start_time = time.perf_counter()

    # 1. Retrieval
    if request.search_mode == "semantic":
        candidates = retrieval_service.search_semantic(
            db, workspace_id, request.query, limit=request.context_limit
        )
    elif request.search_mode == "lexical":
        candidates = retrieval_service.search_lexical(
            db, workspace_id, request.query, limit=request.context_limit
        )
    else:
        candidates = retrieval_service.search_hybrid(
            db, workspace_id, request.query, limit=request.context_limit
        )

    # 2. Check empty context
    if not candidates:
        raise RAGContextEmptyError("No relevant context found in workspace.")

    # 3. Optional reranking
    reranked = False
    if request.rerank:
        try:
            candidates = reranking_service.rerank(request.query, candidates)
            reranked = True
        except Exception as e:
            logger.warning("Reranking failed or unavailable: %s", e)
            reranked = False

    # 4. Context assembly
    context_text, citations = assemble_context(candidates, token_limit=settings.CONTEXT_TOKEN_LIMIT)
    if not citations:
        raise RAGContextEmptyError("No text content could be extracted for context.")

    # 5. Build prompt & LLM generation
    messages = build_prompt(request.query, context_text)
    provider = llm_service.get_llm_provider()
    answer = provider.generate(messages)

    latency = int((time.perf_counter() - start_time) * 1000)

    return RAGResponse(
        answer=answer,
        citations=citations,
        context_chunk_count=len(citations),
        provider=provider.provider_name(),
        model=provider.model_name(),
        latency_ms=latency,
        reranking_applied=reranked,
        pending_ai_edit=None,
    )
