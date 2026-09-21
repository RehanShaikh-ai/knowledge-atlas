"""Workspace activity schemas.

Canonical schemas per CONTRACT v0.3.1 §5.2, §13.2.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ActivityItem(BaseModel):
    """Activity feed item per CONTRACT §13.2."""

    id: uuid.UUID
    event_type: str
    note_id: uuid.UUID | None = None
    note_title: str | None = None
    actor_id: uuid.UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityResponse(BaseModel):
    """Activity feed response per CONTRACT §13.2."""

    items: list[ActivityItem]
    total: int
