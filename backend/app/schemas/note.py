"""Note request and response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.tag import TagResponse


class NoteCreate(BaseModel):
    """Request to create a note."""

    title: str
    content: str
    created_by: uuid.UUID

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        title = value.strip()
        if not title:
            raise ValueError("title must not be empty or contain only whitespace")
        if len(title) > 255:
            raise ValueError("title must not exceed 255 characters")
        return title

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        if len(value) > 100_000:
            raise ValueError("content must not exceed 100000 characters")
        return value


class NoteUpdate(BaseModel):
    """Partial note update request containing only editable fields."""

    model_config = ConfigDict(extra="forbid")

    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None
    is_archived: bool | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        title = value.strip()
        if not title:
            raise ValueError("title must not be empty or contain only whitespace")
        if len(title) > 255:
            raise ValueError("title must not exceed 255 characters")
        return title

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str | None) -> str | None:
        if value is not None and len(value) > 100_000:
            raise ValueError("content must not exceed 100000 characters")
        return value


class NoteResponse(BaseModel):
    """Full note API response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    created_by: uuid.UUID
    title: str
    content: str
    is_pinned: bool
    is_archived: bool
    tags: list[TagResponse]
    created_at: datetime
    updated_at: datetime


class NoteListResponse(BaseModel):
    """Paginated note list API response."""

    items: list[NoteResponse]
    total: int
    page: int
    page_size: int


class NoteSearchResponse(NoteListResponse):
    """Paginated note search API response."""

    query: str
