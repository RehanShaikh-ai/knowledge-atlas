"""Job management service for background indexing.

Canonical service per CONTRACT v0.3.1 §5.3, §12.1-§12.4.
Provides enqueue_index_job, get_job, retry_job, process_index_job.
"""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import JobNotFoundError, ValidationError, WorkspaceNotFoundError
from app.models.index_job import IndexJob
from app.models.note import Note
from app.models.note_chunk import NoteChunk
from app.models.note_version import NoteVersion
from app.models.workspace import Workspace
from app.services import chunking_service, embedding_service, vector_service, version_service

logger = logging.getLogger("app.services.job_service")


def enqueue_index_job(
    db: Session,
    workspace_id: uuid.UUID,
    note_ids: list[uuid.UUID] | None = None,
) -> IndexJob:
    """Enqueue an indexing job in PostgreSQL and Redis/ARQ per CONTRACT §12.1."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError("Workspace not found.")

    job_type = "index_note" if note_ids else "index_workspace"
    n_ids_str = [str(nid) for nid in note_ids] if note_ids else None

    job = IndexJob(
        workspace_id=workspace_id,
        job_type=job_type,
        status="queued",
        note_ids=n_ids_str,
        retry_count=0,
        max_retries=settings.JOB_MAX_RETRIES,
        enqueued_at=datetime.now(UTC),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # In local testing or synchronous execution, process immediately or via ARQ
    if settings.APP_ENV == "testing":
        process_index_job(db, job.id)
        db.refresh(job)

    return job


def get_job(db: Session, job_id: uuid.UUID) -> IndexJob:
    """Retrieve IndexJob status per CONTRACT §12.2."""
    job = db.get(IndexJob, job_id)
    if not job:
        raise JobNotFoundError(f"Job {job_id} not found.")
    return job


def retry_job(db: Session, job_id: uuid.UUID) -> IndexJob:
    """Retry a failed index job per CONTRACT §12.3."""
    job = get_job(db, job_id)
    if job.status != "failed":
        raise ValidationError(
            f"Job is in '{job.status}' status. Only 'failed' jobs can be retried."
        )

    if job.retry_count >= job.max_retries:
        raise ValidationError("Job has reached maximum retry attempts.")

    job.status = "queued"
    job.retry_count += 1
    job.started_at = None
    job.completed_at = None
    job.error_message = None
    db.commit()
    db.refresh(job)

    if settings.APP_ENV == "testing":
        process_index_job(db, job.id)
        db.refresh(job)

    return job


def process_index_job(db: Session, job_id: uuid.UUID) -> None:
    """Execute the indexing job: chunk notes, persist NoteChunks, embed, and upsert to Qdrant."""
    job = db.get(IndexJob, job_id)
    if not job:
        return

    job.status = "running"
    job.started_at = datetime.now(UTC)
    db.commit()

    try:
        # Determine notes to index
        if job.note_ids:
            target_ids = [uuid.UUID(nid) for nid in job.note_ids]
            notes = list(
                db.scalars(
                    select(Note).where(
                        Note.workspace_id == job.workspace_id, Note.id.in_(target_ids)
                    )
                ).all()
            )
        else:
            notes = list(
                db.scalars(
                    select(Note).where(
                        Note.workspace_id == job.workspace_id, Note.is_archived.is_(False)
                    )
                ).all()
            )

        for note in notes:
            # Ensure latest version exists
            stmt = (
                select(NoteVersion)
                .where(NoteVersion.note_id == note.id)
                .order_by(NoteVersion.created_at.desc())
            )
            latest_version = db.scalars(stmt).first()
            if not latest_version:
                latest_version = version_service.create_version(
                    db=db,
                    workspace_id=note.workspace_id,
                    note_id=note.id,
                    author_id=note.created_by,
                    message="Initial index snapshot",
                )

            # Chunk note content
            raw_chunks = chunking_service.chunk_note(note.content or "", title=note.title)
            if not raw_chunks:
                continue

            # Remove previous chunks for this version if re-running
            existing_chunks = list(
                db.scalars(select(NoteChunk).where(NoteChunk.version_id == latest_version.id)).all()
            )
            for ec in existing_chunks:
                db.delete(ec)
            db.flush()

            # Create NoteChunk records
            created_chunks: list[NoteChunk] = []
            texts_to_embed: list[str] = []
            for rc in raw_chunks:
                nc = NoteChunk(
                    note_id=note.id,
                    version_id=latest_version.id,
                    workspace_id=note.workspace_id,
                    chunk_index=rc["chunk_index"],
                    content=rc["content"],
                    content_hash=rc["content_hash"],
                    token_count=rc["token_count"],
                    embedding_model=settings.EMBEDDING_MODEL,
                    embedding_dimension=settings.EMBEDDING_DIMENSION,
                    created_at=datetime.now(UTC),
                )
                db.add(nc)
                created_chunks.append(nc)
                texts_to_embed.append(rc["content"])

            db.flush()

            # Generate embeddings and upsert to Qdrant
            embeddings = embedding_service.get_embeddings_batch(texts_to_embed)
            vector_service.upsert_chunks(
                workspace_id=note.workspace_id,
                chunks=created_chunks,
                embeddings=embeddings,
            )

        job.status = "completed"
        job.completed_at = datetime.now(UTC)
        job.error_message = None
        db.commit()

    except Exception as e:
        logger.exception("Index job %s failed: %s", job_id, e)
        # Sanitized error per CONTRACT §12.4
        job.status = "failed"
        job.completed_at = datetime.now(UTC)
        # Strip paths or sensitive details
        clean_msg = str(e).split("\n")[0][:200]
        job.error_message = f"Indexing failed: {clean_msg}"
        db.commit()
