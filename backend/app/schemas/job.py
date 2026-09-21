"""Index job schemas.

Canonical schemas per CONTRACT v0.3.1 §5.2, §12.1, §12.2.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IndexJobRequest(BaseModel):
    """Index job request payload per CONTRACT §12.1."""

    note_ids: list[uuid.UUID] | None = None


class IndexJobResponse(BaseModel):
    """Index job enqueue response per CONTRACT §12.1."""

    job_id: uuid.UUID
    status: str = "queued"


class JobStatusResponse(BaseModel):
    """Index job status response per CONTRACT §12.2."""

    id: uuid.UUID
    job_type: str
    status: str
    workspace_id: uuid.UUID
    retry_count: int
    max_retries: int
    enqueued_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None

    model_config = ConfigDict(from_attributes=True)
