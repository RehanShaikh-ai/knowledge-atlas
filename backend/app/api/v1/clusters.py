"""Cluster endpoints.

Canonical endpoints per CONTRACT v0.3.2 §9.6.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.cluster import (
    ClusterMemberResponse,
    ClusterResponse,
)
from app.schemas.job import ExtractionJobResponse
from app.services import cluster_service, job_service

router = APIRouter(tags=["clusters"])


def _format_cluster(cluster) -> ClusterResponse:
    members = [
        ClusterMemberResponse(
            note_id=m.note_id,
            title=m.note.title if m.note else "Untitled Note",
            score=m.score,
        )
        for m in cluster.members
    ]
    return ClusterResponse(
        id=cluster.id,
        workspace_id=cluster.workspace_id,
        label=cluster.label,
        description=cluster.description,
        member_count=len(members),
        members=members,
        created_at=cluster.created_at,
        updated_at=cluster.updated_at,
    )


@router.post(
    "/workspaces/{workspace_id}/clusters/generate",
    response_model=ExtractionJobResponse,
    status_code=status.HTTP_200_OK,
)
def generate_clusters(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> ExtractionJobResponse:
    """Trigger asynchronous workspace clustering per CONTRACT §9.6."""
    job = job_service.enqueue_cluster_job(db, workspace_id)
    return ExtractionJobResponse(job_id=job.id, status=job.status)


@router.get(
    "/workspaces/{workspace_id}/clusters",
    response_model=list[ClusterResponse],
    status_code=status.HTTP_200_OK,
)
def list_clusters(
    workspace_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> list[ClusterResponse]:
    """List all clusters in a workspace per CONTRACT §9.6."""
    clusters = cluster_service.list_clusters(db, workspace_id)
    return [_format_cluster(c) for c in clusters]


@router.get(
    "/workspaces/{workspace_id}/clusters/{cluster_id}",
    response_model=ClusterResponse,
    status_code=status.HTTP_200_OK,
)
def get_cluster(
    workspace_id: uuid.UUID,
    cluster_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> ClusterResponse:
    """Retrieve a cluster with member notes per CONTRACT §9.6."""
    cluster = cluster_service.get_cluster(db, cluster_id)
    return _format_cluster(cluster)
