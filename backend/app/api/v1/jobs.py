"""Job management API routes.

Canonical endpoints per CONTRACT v0.3.1 §12.1-§12.3, §13.1.
POST /api/v1/workspaces/{workspace_id}/index
GET  /api/v1/jobs/{job_id}
POST /api/v1/jobs/{job_id}/retry
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.job import IndexJobRequest, IndexJobResponse, JobStatusResponse
from app.services import job_service

router = APIRouter()


@router.post(
    "/workspaces/{workspace_id}/index",
    response_model=IndexJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def enqueue_index(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    request: IndexJobRequest | None = None,
) -> IndexJobResponse:
    """Enqueue indexing job for workspace or specified note IDs per CONTRACT §12.1."""
    note_ids = request.note_ids if request else None
    job = job_service.enqueue_index_job(db, workspace_id, note_ids=note_ids)
    return IndexJobResponse(job_id=job.id, status=job.status)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(
    job_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> JobStatusResponse:
    """Retrieve job status per CONTRACT §12.2."""
    job = job_service.get_job(db, job_id)
    return JobStatusResponse.model_validate(job)


@router.post("/jobs/{job_id}/retry", response_model=JobStatusResponse)
def retry_job(
    job_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> JobStatusResponse:
    """Retry failed job per CONTRACT §12.3."""
    job = job_service.retry_job(db, job_id)
    return JobStatusResponse.model_validate(job)
