"""Schemas package.

Exports canonical schemas per contract §5.2.
"""

from app.schemas.activity import ActivityItem, ActivityResponse
from app.schemas.dashboard import DashboardResponse
from app.schemas.errors import ErrorDetail, ErrorResponse
from app.schemas.graph import GraphEdge, GraphNode, GraphResponse, GraphStats
from app.schemas.health import HealthResponse
from app.schemas.job import IndexJobRequest, IndexJobResponse, JobStatusResponse
from app.schemas.note import (
    NoteCreate,
    NoteListResponse,
    NoteResponse,
    NoteSearchResponse,
    NoteSourceAttribution,
    NoteUpdate,
)
from app.schemas.note_link import NoteLinkCreate, NoteLinkResponse, NoteLinksResponse
from app.schemas.rag import CitedSource, RAGRequest, RAGResponse
from app.schemas.saved_search import SavedSearchCreate, SavedSearchListResponse, SavedSearchResponse
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
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
from app.schemas.version import (
    AIEditApproveRequest,
    AIEditResponse,
    DiffResponse,
    NoteVersionListResponse,
    NoteVersionResponse,
    RestoreRequest,
)
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceListResponse,
    WorkspaceResponse,
)

__all__ = [
    # v0.2.x
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
    # v0.3.1 (CONTRACT §5.2)
    "ActivityItem",
    "ActivityResponse",
    "AIEditApproveRequest",
    "AIEditResponse",
    "CitedSource",
    "DiffResponse",
    "IndexJobRequest",
    "IndexJobResponse",
    "JobStatusResponse",
    "NoteVersionListResponse",
    "NoteVersionResponse",
    "RAGRequest",
    "RAGResponse",
    "RestoreRequest",
    "SavedSearchCreate",
    "SavedSearchListResponse",
    "SavedSearchResponse",
    "SearchRequest",
    "SearchResponse",
    "SearchResultItem",
]
