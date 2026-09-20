"""Knowledge Graph Pydantic schemas.

Canonical schemas per contract §4.2 and §8.
"""

import uuid

from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    """A node in the knowledge graph representing a note."""

    id: uuid.UUID
    title: str
    is_pinned: bool = False
    tag_names: list[str] = Field(default_factory=list)
    degree: int = 0


class GraphEdge(BaseModel):
    """An edge representing an explicit link between two notes."""

    source_note_id: uuid.UUID
    target_note_id: uuid.UUID


class GraphStats(BaseModel):
    """Factual statistics about the graph structure."""

    node_count: int
    edge_count: int
    isolated_count: int
    truncated: bool = False


class GraphResponse(BaseModel):
    """Response schema for workspace and note neighborhood graph endpoints."""

    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
    stats: GraphStats
