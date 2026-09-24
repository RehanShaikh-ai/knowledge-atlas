"""ARQ background worker settings and job functions.

Canonical jobs per CONTRACT v0.3.1 §5.4, §12.1-§12.4, §16.3 and CONTRACT v0.3.2 §5.4, §12.1-§12.4.
Functions:
    - index_workspace_job
    - index_note_job
    - extract_entities_job
    - extract_relationships_job
    - cluster_notes_job
"""

import logging
import uuid
from typing import Any

from arq.connections import RedisSettings

from app.core.config import settings
from app.db.session import SessionLocal
from app.services import job_service

logger = logging.getLogger("app.jobs.worker")


async def index_workspace_job(ctx: dict[str, Any], workspace_id_str: str, job_id_str: str) -> None:
    """ARQ job: reindex entire workspace per CONTRACT §5.4, §12.1."""
    job_id = uuid.UUID(job_id_str)
    with SessionLocal() as db:
        job_service.process_index_job(db, job_id)


async def index_note_job(ctx: dict[str, Any], workspace_id_str: str, job_id_str: str) -> None:
    """ARQ job: reindex specific notes per CONTRACT §5.4, §12.1."""
    job_id = uuid.UUID(job_id_str)
    with SessionLocal() as db:
        job_service.process_index_job(db, job_id)


async def extract_entities_job(ctx: dict[str, Any], workspace_id_str: str, job_id_str: str) -> None:
    """ARQ job: extract entities per CONTRACT v0.3.2 §5.4, §8.1."""
    job_id = uuid.UUID(job_id_str)
    with SessionLocal() as db:
        job_service.process_index_job(db, job_id)


async def extract_relationships_job(
    ctx: dict[str, Any], workspace_id_str: str, job_id_str: str
) -> None:
    """ARQ job: extract relationships per CONTRACT v0.3.2 §5.4, §8.1."""
    job_id = uuid.UUID(job_id_str)
    with SessionLocal() as db:
        job_service.process_index_job(db, job_id)


async def cluster_notes_job(ctx: dict[str, Any], workspace_id_str: str, job_id_str: str) -> None:
    """ARQ job: cluster workspace notes per CONTRACT v0.3.2 §5.4, §9.6."""
    job_id = uuid.UUID(job_id_str)
    with SessionLocal() as db:
        job_service.process_index_job(db, job_id)


class WorkerSettings:
    """ARQ Worker settings per CONTRACT v0.3.1 §16.3 and v0.3.2 §5.4."""

    functions = [
        index_workspace_job,
        index_note_job,
        extract_entities_job,
        extract_relationships_job,
        cluster_notes_job,
    ]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
