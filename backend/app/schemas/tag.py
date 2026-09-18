"""Tag request and response schemas."""

import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class TagCreate(BaseModel):
    """Request to add a normalized tag to a note."""

    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip().lower()
        if not name:
            raise ValueError("name must not be empty or contain only whitespace")
        if len(name) > 50:
            raise ValueError("name must not exceed 50 characters")
        if any(character.isspace() for character in name):
            raise ValueError("name must not contain whitespace")
        return name


class TagResponse(BaseModel):
    """Tag API response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str


class TagListResponse(BaseModel):
    """Workspace tag list API response."""

    items: list[TagResponse]
    total: int
