"""Schemas package.

Exports canonical schemas per contract §5.2.
"""

from app.schemas.errors import ErrorDetail, ErrorResponse
from app.schemas.health import HealthResponse
from app.schemas.note import (
    NoteCreate,
    NoteListResponse,
    NoteResponse,
    NoteSearchResponse,
    NoteUpdate,
)
from app.schemas.note_link import NoteLinkCreate, NoteLinkResponse, NoteLinksResponse
from app.schemas.tag import TagCreate, TagListResponse, TagResponse
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
    "NoteCreate",
    "NoteLinkCreate",
    "NoteLinkResponse",
    "NoteLinksResponse",
    "NoteListResponse",
    "NoteResponse",
    "NoteSearchResponse",
    "NoteUpdate",
    "TagCreate",
    "TagListResponse",
    "TagResponse",
    "UserCreate",
    "UserListResponse",
    "UserResponse",
    "WorkspaceCreate",
    "WorkspaceListResponse",
    "WorkspaceResponse",
]
