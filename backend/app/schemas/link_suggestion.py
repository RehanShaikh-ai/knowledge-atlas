"""LinkSuggestion Pydantic schemas.

Canonical schemas per CONTRACT v0.3.2 §5.2, §9.5.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LinkSuggestionResponse(BaseModel):
    """Response schema for a single link suggestion."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_note_id: uuid.UUID
    source_note_title: str = ""
    target_note_id: uuid.UUID
    target_note_title: str = ""
    confidence: float = 1.0
    reason: str | None = None
    status: str = "pending"
    shared_entity_ids: list[Any] | None = None
    created_at: datetime
    decided_at: datetime | None = None


class LinkSuggestionListResponse(BaseModel):
    """Paginated list of link suggestions."""

    items: list[LinkSuggestionResponse] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20


class LinkSuggestionDecisionRequest(BaseModel):
    """Optional payload for suggestion decision (not strictly required if endpoints are separate)."""

    decision: str | None = None
