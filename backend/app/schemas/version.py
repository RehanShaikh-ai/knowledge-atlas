"""Note versioning and diff schemas.

Canonical schemas per CONTRACT v0.3.1 §5.2, §11.2, §11.3, §11.4.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteVersionResponse(BaseModel):
    """Note snapshot version representation."""

    id: uuid.UUID
    note_id: uuid.UUID
    workspace_id: uuid.UUID
    commit_hash: str
    author_id: uuid.UUID
    message: str | None = None
    is_ai_edit: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteVersionListResponse(BaseModel):
    """List of note versions."""

    items: list[NoteVersionResponse]
    total: int


class DiffResponse(BaseModel):
    """Unified diff between two commits."""

    note_id: uuid.UUID
    from_commit: str
    to_commit: str
    diff: str


class RestoreRequest(BaseModel):
    """Restore version request body."""

    commit_hash: str = Field(min_length=40, max_length=40)
    author_id: uuid.UUID


class AIEditApproveRequest(BaseModel):
    """Approve AI-edit request body."""

    author_id: uuid.UUID


class AIEditResponse(BaseModel):
    """AI edit action response."""

    status: str
    message: str
    commit_hash: str | None = None
