"""Schemas package.

Exports canonical schemas per contract §5.2.
"""

from app.schemas.dashboard import DashboardResponse
from app.schemas.errors import ErrorDetail, ErrorResponse
from app.schemas.graph import GraphEdge, GraphNode, GraphResponse, GraphStats
from app.schemas.health import HealthResponse
from app.schemas.note import (
    NoteCreate,
    NoteListResponse,
    NoteResponse,
    NoteSearchResponse,
    NoteSourceAttribution,
    NoteUpdate,
)
from app.schemas.note_link import NoteLinkCreate, NoteLinkResponse, NoteLinksResponse
from app.schemas.source import (
    DetectedNote,
    SourceImportResponse,
    SourceImportResult,
    SourceListResponse,
    SourcePreviewResponse,
    SourceResponse,
)
from app.schemas.tag import TagCreate, TagListResponse, TagResponse
from app.schemas.user import UserCreate, UserListResponse, UserResponse
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceListResponse,
    WorkspaceResponse,
)

__all__ = [
    "DashboardResponse",
    "DetectedNote",
    "ErrorDetail",
    "ErrorResponse",
    "GraphEdge",
    "GraphNode",
    "GraphResponse",
    "GraphStats",
    "HealthResponse",
    "NoteCreate",
    "NoteLinkCreate",
    "NoteLinkResponse",
    "NoteLinksResponse",
    "NoteListResponse",
    "NoteResponse",
    "NoteSearchResponse",
    "NoteSourceAttribution",
    "NoteUpdate",
    "SourceImportResponse",
    "SourceImportResult",
    "SourceListResponse",
    "SourcePreviewResponse",
    "SourceResponse",
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
