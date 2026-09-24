"""Cluster Pydantic schemas.

Canonical schemas per CONTRACT v0.3.2 §5.2, §9.6.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClusterMemberResponse(BaseModel):
    """A note member within a cluster."""

    model_config = ConfigDict(from_attributes=True)

    note_id: uuid.UUID
    title: str = ""
    score: float = 1.0


class ClusterResponse(BaseModel):
    """Response schema for a single cluster."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    label: str
    description: str | None = None
    member_count: int = 0
    members: list[ClusterMemberResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ClusterListResponse(BaseModel):
    """Response schema for listing clusters."""

    items: list[ClusterResponse] = Field(default_factory=list)
    total: int = 0
