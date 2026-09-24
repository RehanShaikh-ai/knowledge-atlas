"""GraphEntity Pydantic schemas.

Canonical schemas per CONTRACT v0.3.2 §5.2, §9.2.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EntityType = Literal["concept", "person", "technology", "project", "place", "event", "unknown"]


class GraphEntityCreate(BaseModel):
    """Schema for creating an entity manually."""

    name: str = Field(min_length=1, max_length=200)
    entity_type: EntityType = "concept"
    description: str | None = Field(default=None, max_length=5000)


class GraphEntityUpdate(BaseModel):
    """Schema for updating an entity (PATCH)."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    entity_type: EntityType | None = None
    description: str | None = Field(default=None, max_length=5000)


class GraphEntityResponse(BaseModel):
    """Response schema for a single entity."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    entity_type: str
    description: str | None = None
    is_manual: bool = False
    cluster_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
