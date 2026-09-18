"""Note-link request and response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NoteLinkCreate(BaseModel):
    """Request to link one note to another."""

    target_note_id: uuid.UUID


class NoteLinkResponse(BaseModel):
    """Note-link API response."""

    model_config = ConfigDict(from_attributes=True)

    source_note_id: uuid.UUID
    target_note_id: uuid.UUID
    created_at: datetime


class NoteLinksResponse(BaseModel):
    """Incoming and outgoing note-link response."""

    outgoing: list[NoteLinkResponse]
    incoming: list[NoteLinkResponse]
