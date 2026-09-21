"""Saved search schemas.

Canonical schemas per CONTRACT v0.3.1 §5.2, §13.3.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SavedSearchCreate(BaseModel):
    """Create saved search payload per CONTRACT §13.3."""

    name: str = Field(min_length=1, max_length=150)
    query: str = Field(min_length=1, max_length=500)
    search_mode: Literal["semantic", "lexical", "hybrid"]


class SavedSearchResponse(BaseModel):
    """Saved search item response per CONTRACT §13.3."""

    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    query: str
    search_mode: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SavedSearchListResponse(BaseModel):
    """List of saved searches."""

    items: list[SavedSearchResponse]
    total: int
