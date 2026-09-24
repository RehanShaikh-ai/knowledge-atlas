"""GraphRelationship Pydantic schemas.

Canonical schemas per CONTRACT v0.3.2 §5.2, §9.3.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GraphRelationshipCreate(BaseModel):
    """Schema for creating a relationship manually."""

    source_entity_id: uuid.UUID
    target_entity_id: uuid.UUID
    relationship_type: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class GraphRelationshipUpdate(BaseModel):
    """Schema for updating a relationship (PATCH)."""

    relationship_type: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=5000)


class GraphRelationshipResponse(BaseModel):
    """Response schema for a single relationship."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    source_entity_id: uuid.UUID
    target_entity_id: uuid.UUID
    relationship_type: str
    description: str | None = None
    confidence: float = 1.0
    is_manual: bool = False
    created_at: datetime
    updated_at: datetime
