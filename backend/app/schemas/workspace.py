"""Workspace Pydantic schemas.

Canonical schemas per contract §8.2, §12.1, §12.3.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator


class WorkspaceCreate(BaseModel):
    """Workspace creation request schema.

    Contract §8.2, §12.1:
        name: Required, non-empty, trimmed, <= 150 chars, not whitespace-only.
        description: Optional, <= 1000 chars.
        owner_id: Required UUID referencing an existing user.
    """

    name: str
    description: str | None = None
    owner_id: uuid.UUID

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, v: Any) -> str:
        if not isinstance(v, str):
            raise ValueError("name must be a string")
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("name must not be empty or contain only whitespace")
        if len(v_stripped) > 150:
            raise ValueError("name must not exceed 150 characters")
        return v_stripped

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v: Any) -> str | None:
        if v is None:
            return None
        if not isinstance(v, str):
            raise ValueError("description must be a string or None")
        if len(v) > 1000:
            raise ValueError("description must not exceed 1000 characters")
        return v


class WorkspaceResponse(BaseModel):
    """Workspace response schema.

    Contract §12.1:
        id: UUID
        name: str
        description: str | None
        owner_id: UUID
        created_at: datetime
        updated_at: datetime
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None = None
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class WorkspaceListResponse(BaseModel):
    """Workspace list response schema.

    Contract §12.3:
        items: list[WorkspaceResponse]
        total: int
    """

    items: list[WorkspaceResponse]
    total: int
