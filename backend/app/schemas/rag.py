"""RAG schemas for retrieval-augmented generation.

Canonical schemas per CONTRACT v0.3.1 §5.2, §10.2, §10.3.
"""

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RAGRequest(BaseModel):
    """RAG request body per CONTRACT §10.2."""

    query: str = Field(min_length=1, max_length=500)
    search_mode: Literal["semantic", "lexical", "hybrid"] = "hybrid"
    rerank: bool = True
    context_limit: int = Field(default=5, ge=1, le=20)
    stream: bool = False


class CitedSource(BaseModel):
    """Cited source item linking answer to note chunk per CONTRACT §10.3."""

    chunk_id: uuid.UUID
    note_id: uuid.UUID
    title: str
    excerpt: str
    score: float

    model_config = ConfigDict(from_attributes=True)


class RAGResponse(BaseModel):
    """Grounded RAG response with citations per CONTRACT §10.3."""

    answer: str
    citations: list[CitedSource]
    context_chunk_count: int
    provider: str
    model: str
    latency_ms: int
    reranking_applied: bool = False
    pending_ai_edit: str | None = None
