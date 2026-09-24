"""GraphRAG Pydantic schemas.

Canonical schemas per CONTRACT v0.3.2 §5.2, §9.7.
"""

import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.rag import CitedSource


class GraphRAGRequest(BaseModel):
    """Request payload for GraphRAG."""

    query: str = Field(min_length=1, max_length=500)
    max_hops: int = Field(default=2, ge=1, le=2)
    context_limit: int = Field(default=10, ge=1, le=50)
    rerank: bool = True
    stream: bool = False


class GraphTraversedEntity(BaseModel):
    """Entity traversed during GraphRAG multi-hop retrieval."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    entity_type: str


class GraphUsedRelationship(BaseModel):
    """Relationship utilized during GraphRAG graph context expansion."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    relationship_type: str
    source: str
    target: str


class GraphRAGContext(BaseModel):
    """Graph context attached to GraphRAG response."""

    entities_traversed: list[GraphTraversedEntity] = Field(default_factory=list)
    relationships_used: list[GraphUsedRelationship] = Field(default_factory=list)
    hops: int = 0


class GraphRAGResponse(BaseModel):
    """Response payload for GraphRAG."""

    answer: str
    citations: list[CitedSource] = Field(default_factory=list)
    graph_context: GraphRAGContext = Field(default_factory=GraphRAGContext)
    provider: str
    model: str
    latency_ms: int
