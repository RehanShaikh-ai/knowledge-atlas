"""Source ingestion and management endpoints.

Canonical endpoints per contract §7.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.source import (
    SourceImportResponse,
    SourceListResponse,
    SourcePreviewResponse,
    SourceResponse,
)
from app.services import source_service

router = APIRouter(tags=["sources"])


@router.post(
    "/workspaces/{workspace_id}/sources/preview",
    response_model=SourcePreviewResponse,
    status_code=status.HTTP_200_OK,
)
def preview_sources(
    workspace_id: uuid.UUID,
    files: Annotated[list[UploadFile], File(...)],
    db: Annotated[Session, Depends(get_db)],
) -> SourcePreviewResponse:
    """Preview an import batch without writing to the database."""
    return source_service.preview_import(db, workspace_id, files)


@router.post(
    "/workspaces/{workspace_id}/sources/import",
    response_model=SourceImportResponse,
    status_code=status.HTTP_201_CREATED,
)
def commit_sources(
    workspace_id: uuid.UUID,
    created_by: Annotated[uuid.UUID, Form(...)],
    files: Annotated[list[UploadFile], File(...)],
    db: Annotated[Session, Depends(get_db)],
) -> SourceImportResponse:
    """Commit an import batch with deduplication and upsert handling."""
    return source_service.commit_import(db, workspace_id, created_by, files)


@router.get(
    "/workspaces/{workspace_id}/sources",
    response_model=SourceListResponse,
    status_code=status.HTTP_200_OK,
)
def list_workspace_sources(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
) -> SourceListResponse:
    """List paginated sources for a workspace."""
    return source_service.list_sources(db, workspace_id, page, page_size)


@router.get(
    "/sources/{source_id}",
    response_model=SourceResponse,
    status_code=status.HTTP_200_OK,
)
def get_source(
    source_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> SourceResponse:
    """Get a single source record."""
    source = source_service.get_source(db, source_id)
    return SourceResponse.model_validate(source)
