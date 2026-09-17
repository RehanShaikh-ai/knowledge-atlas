"""User Pydantic schemas.

Canonical schemas per contract §7.3, §7.4, §11.3.
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator


class UserCreate(BaseModel):
    """User creation request schema.

    Contract §7.2, §7.3:
        display_name: Required, non-empty, trimmed, <= 100 chars, not whitespace-only.
        Must not accept id, created_at, updated_at.
    """

    display_name: str

    @field_validator("display_name", mode="before")
    @classmethod
    def validate_display_name(cls, v: Any) -> str:
        if not isinstance(v, str):
            raise ValueError("display_name must be a string")
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("display_name must not be empty or contain only whitespace")
        if len(v_stripped) > 100:
            raise ValueError("display_name must not exceed 100 characters")
        return v_stripped


class UserResponse(BaseModel):
    """User response schema.

    Contract §7.4:
        id: UUID
        display_name: str
        created_at: datetime
        updated_at: datetime
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str
    created_at: datetime
    updated_at: datetime


class UserListResponse(BaseModel):
    """User list response schema.

    Contract §11.3:
        items: list[UserResponse]
        total: int
    """

    items: list[UserResponse]
    total: int
