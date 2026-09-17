"""Schemas package.

Exports canonical schemas per contract §5.2.
"""

from app.schemas.errors import ErrorDetail, ErrorResponse
from app.schemas.health import HealthResponse
from app.schemas.user import UserCreate, UserListResponse, UserResponse
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceListResponse,
    WorkspaceResponse,
)

__all__ = [
    "ErrorDetail",
    "ErrorResponse",
    "HealthResponse",
    "UserCreate",
    "UserListResponse",
    "UserResponse",
    "WorkspaceCreate",
    "WorkspaceListResponse",
    "WorkspaceResponse",
]
