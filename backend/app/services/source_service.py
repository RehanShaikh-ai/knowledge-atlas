"""Source ingestion and deduplication service.

Canonical service per contract §4.3, §5, §7, and §12.
"""

import hashlib
import io
import logging
import os
import posixpath
import uuid
import zipfile
from dataclasses import dataclass
from datetime import UTC, datetime

from fastapi import UploadFile
from pypdf import PdfReader
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    SourceNotFoundError,
    UserNotFoundError,
    ValidationError,
    WorkspaceNotFoundError,
)
from app.models.note import Note
from app.models.note_link import NoteLink
from app.models.note_tag import NoteTag
from app.models.source import Source
from app.models.tag import Tag
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.source import (
    DetectedNote,
    SourceImportResponse,
    SourceImportResult,
    SourceListResponse,
    SourcePreviewResponse,
    SourceResponse,
)
from app.services.obsidian_parser import ParsedNote, parse_markdown_note

logger = logging.getLogger("app.services.source_service")

# File limit constants per contract §7.4
MAX_INDIVIDUAL_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
MAX_FILES_PER_BATCH = 500
MAX_VAULT_ARCHIVE_SIZE = 250 * 1024 * 1024  # 250 MB
CHUNK_SIZE = 64 * 1024  # 64 KB streaming chunk

SUPPORTED_EXTENSIONS = {".md", ".markdown", ".txt", ".pdf"}


@dataclass
class IngestionItem:
    """An individual file extracted for ingestion."""

    original_path: str
    source_identifier: str
    source_type: str
    content_bytes: bytes
    content_hash: str
    parsed_note: ParsedNote | None = None
    error: str | None = None


def normalize_source_identifier(path: str) -> str:
    """Normalize file path to stable dedup key per contract §5.1, §5.5."""
    clean = path.replace("\\", "/").strip()
    # Normalize posix path
    normalized = posixpath.normpath(clean).lstrip("/")
    return normalized


def is_path_traversal(entry_name: str) -> bool:
    """Check if archive entry attempts directory traversal per contract §12.2."""
    norm = posixpath.normpath(entry_name.replace("\\", "/"))
    return norm.startswith("..") or norm.startswith("/") or posixpath.isabs(norm)


def read_stream_with_limit(file: UploadFile, max_size: int) -> bytes:
    """Read upload stream enforcing max size limit per contract §12.2."""
    total = 0
    chunks: list[bytes] = []
    while True:
        chunk = file.file.read(CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > max_size:
            max_mb = max_size // (1024 * 1024)
            raise ValidationError(
                f"File '{file.filename}' exceeds maximum allowed size of {max_mb} MB."
            )
        chunks.append(chunk)
    return b"".join(chunks)


def detect_file_type_and_validate(filename: str, data: bytes) -> str:
    """Validate file type by content inspection (magic bytes) per contract §12.2."""
    ext = os.path.splitext(filename)[1].lower()

    if data.startswith(b"PK\x03\x04"):
        return "zip"
    if data.startswith(b"%PDF-"):
        return "pdf"

    # Check for text / markdown
    if ext in {".md", ".markdown", ".txt"}:
        try:
            data.decode("utf-8")
            return "markdown" if ext in {".md", ".markdown"} else "text"
        except UnicodeDecodeError:
            try:
                data.decode("latin-1")
                return "markdown" if ext in {".md", ".markdown"} else "text"
            except Exception as e:
                raise ValidationError(f"File '{filename}' contains invalid text encoding.") from e

    if ext == ".zip":
        raise ValidationError(f"File '{filename}' is not a valid zip archive.")
    if ext == ".pdf":
        raise ValidationError(f"File '{filename}' is not a valid PDF file.")

    raise ValidationError(
        f"File '{filename}' has unsupported type. Supported types: .md, .markdown, .txt, .pdf, .zip"
    )


def extract_pdf_content(data: bytes, filename: str) -> ParsedNote:
    """Extract text from PDF using pypdf per contract §14.1."""
    try:
        reader = PdfReader(io.BytesIO(data))
        title = ""
        if reader.metadata and reader.metadata.title:
            title = str(reader.metadata.title).strip()
        if not title:
            stem = os.path.splitext(os.path.basename(filename))[0]
            title = stem.replace("-", " ").replace("_", " ").title()

        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        full_content = "\n\n".join(pages_text)
        return ParsedNote(title=title, content=full_content)
    except Exception as e:
        raise ValueError(f"Failed to extract PDF text: {e}") from e


def process_uploaded_files(files: list[UploadFile]) -> list[IngestionItem]:
    """Parse and validate uploaded files or zip vault into ingestion items."""
    if not files:
        raise ValidationError("Empty upload: at least one file is required.")

    items: list[IngestionItem] = []

    for file in files:
        filename = file.filename or "unnamed_file"
        ext = os.path.splitext(filename)[1].lower()

        is_zip = ext == ".zip"
        limit = MAX_VAULT_ARCHIVE_SIZE if is_zip else MAX_INDIVIDUAL_FILE_SIZE

        try:
            raw_bytes = read_stream_with_limit(file, limit)
        except ValidationError as e:
            items.append(
                IngestionItem(
                    original_path=filename,
                    source_identifier=normalize_source_identifier(filename),
                    source_type="unknown",
                    content_bytes=b"",
                    content_hash="",
                    error=str(e.message),
                )
            )
            continue

        if not raw_bytes:
            items.append(
                IngestionItem(
                    original_path=filename,
                    source_identifier=normalize_source_identifier(filename),
                    source_type="unknown",
                    content_bytes=b"",
                    content_hash="",
                    error="File is empty.",
                )
            )
            continue

        try:
            detected_type = detect_file_type_and_validate(filename, raw_bytes)
        except ValidationError as e:
            items.append(
                IngestionItem(
                    original_path=filename,
                    source_identifier=normalize_source_identifier(filename),
                    source_type="unknown",
                    content_bytes=raw_bytes,
                    content_hash=hashlib.sha256(raw_bytes).hexdigest(),
                    error=str(e.message),
                )
            )
            continue

        if detected_type == "zip":
            # Extract zip entries
            try:
                with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
                    for entry in zf.infolist():
                        if entry.is_dir():
                            continue

                        entry_name = entry.filename
                        if is_path_traversal(entry_name):
                            items.append(
                                IngestionItem(
                                    original_path=entry_name,
                                    source_identifier=normalize_source_identifier(entry_name),
                                    source_type="unknown",
                                    content_bytes=b"",
                                    content_hash="",
                                    error="Archive entry rejected due to path traversal attempt.",
                                )
                            )
                            continue

                        # Skip internal mac/hidden/system files
                        norm_entry = normalize_source_identifier(entry_name)
                        base_entry = posixpath.basename(norm_entry)
                        if (
                            base_entry.startswith(".")
                            or norm_entry.startswith("__MACOSX")
                            or "/.obsidian/" in f"/{norm_entry}/"
                        ):
                            continue

                        entry_ext = os.path.splitext(entry_name)[1].lower()
                        if entry_ext not in SUPPORTED_EXTENSIONS:
                            continue

                        if entry.file_size > MAX_INDIVIDUAL_FILE_SIZE:
                            max_mb = MAX_INDIVIDUAL_FILE_SIZE // (1024 * 1024)
                            items.append(
                                IngestionItem(
                                    original_path=entry_name,
                                    source_identifier=norm_entry,
                                    source_type="unknown",
                                    content_bytes=b"",
                                    content_hash="",
                                    error=f"Archive entry exceeds size limit of {max_mb} MB.",
                                )
                            )
                            continue

                        entry_bytes = zf.read(entry)
                        h = hashlib.sha256(entry_bytes).hexdigest()

                        # Determine source type
                        if entry_ext in {".md", ".markdown"}:
                            stype = "obsidian_note"
                        elif entry_ext == ".pdf":
                            stype = "pdf"
                        else:
                            stype = "text"

                        # Parse content
                        try:
                            if entry_ext in {".md", ".markdown"}:
                                decoded = entry_bytes.decode("utf-8", errors="replace")
                                parsed = parse_markdown_note(decoded, entry_name)
                            elif entry_ext == ".pdf":
                                parsed = extract_pdf_content(entry_bytes, entry_name)
                            else:
                                text = entry_bytes.decode("utf-8", errors="replace")
                                stem = os.path.splitext(base_entry)[0]
                                title_str = stem.replace("-", " ").title()
                                parsed = ParsedNote(title=title_str, content=text)

                            items.append(
                                IngestionItem(
                                    original_path=entry_name,
                                    source_identifier=norm_entry,
                                    source_type=stype,
                                    content_bytes=entry_bytes,
                                    content_hash=h,
                                    parsed_note=parsed,
                                )
                            )
                        except Exception as e:
                            items.append(
                                IngestionItem(
                                    original_path=entry_name,
                                    source_identifier=norm_entry,
                                    source_type=stype,
                                    content_bytes=entry_bytes,
                                    content_hash=h,
                                    error=str(e),
                                )
                            )
            except Exception as e:
                items.append(
                    IngestionItem(
                        original_path=filename,
                        source_identifier=normalize_source_identifier(filename),
                        source_type="obsidian_vault",
                        content_bytes=raw_bytes,
                        content_hash=hashlib.sha256(raw_bytes).hexdigest(),
                        error=f"Failed to read archive: {e}",
                    )
                )
        else:
            # Standalone file
            h = hashlib.sha256(raw_bytes).hexdigest()
            norm = normalize_source_identifier(filename)
            try:
                if detected_type == "markdown":
                    decoded = raw_bytes.decode("utf-8", errors="replace")
                    parsed = parse_markdown_note(decoded, filename)
                elif detected_type == "pdf":
                    parsed = extract_pdf_content(raw_bytes, filename)
                else:
                    text = raw_bytes.decode("utf-8", errors="replace")
                    stem = os.path.splitext(os.path.basename(filename))[0]
                    parsed = ParsedNote(title=stem.replace("-", " ").title(), content=text)

                items.append(
                    IngestionItem(
                        original_path=filename,
                        source_identifier=norm,
                        source_type=detected_type,
                        content_bytes=raw_bytes,
                        content_hash=h,
                        parsed_note=parsed,
                    )
                )
            except Exception as e:
                items.append(
                    IngestionItem(
                        original_path=filename,
                        source_identifier=norm,
                        source_type=detected_type,
                        content_bytes=raw_bytes,
                        content_hash=h,
                        error=str(e),
                    )
                )

    if len(items) > MAX_FILES_PER_BATCH:
        raise ValidationError(
            f"Import batch contains {len(items)} files, exceeding limit of {MAX_FILES_PER_BATCH}."
        )

    return items


def preview_import(
    db: Session,
    workspace_id: uuid.UUID,
    files: list[UploadFile],
) -> SourcePreviewResponse:
    """Preview import without writing to the database per contract §7.1."""
    # Validate workspace
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError()

    items = process_uploaded_files(files)

    detected_notes: list[DetectedNote] = []
    errors: list[str] = []
    warnings: list[str] = []

    # Query existing sources in workspace
    existing_sources = db.scalars(select(Source).where(Source.workspace_id == workspace_id)).all()
    source_map = {s.source_identifier: s for s in existing_sources}

    # Query existing note titles
    existing_notes = db.scalars(
        select(Note).where(Note.workspace_id == workspace_id, Note.is_archived.is_(False))
    ).all()
    existing_titles = {n.title.lower().strip() for n in existing_notes}

    # Batch note titles for resolving intra-batch wikilinks
    batch_titles = {
        item.parsed_note.title.lower().strip()
        for item in items
        if item.parsed_note and not item.error
    }
    all_available_titles = existing_titles | batch_titles

    total_unresolved_links = 0

    for item in items:
        if item.error:
            errors.append(f"{item.original_path}: {item.error}")
            continue

        if not item.parsed_note:
            continue

        existing = source_map.get(item.source_identifier)
        if existing:
            is_dup = existing.content_hash == item.content_hash
            will_update = not is_dup
        else:
            is_dup = False
            will_update = False

        # Calculate unresolved links for this note
        for target in item.parsed_note.wikilinks:
            if target.lower().strip() not in all_available_titles:
                total_unresolved_links += 1

        detected_notes.append(
            DetectedNote(
                original_path=item.original_path,
                title=item.parsed_note.title,
                tag_count=len(item.parsed_note.tags),
                outgoing_link_count=len(item.parsed_note.wikilinks),
                is_duplicate=is_dup,
                will_update_existing=will_update,
            )
        )

    if total_unresolved_links > 0:
        warnings.append(
            f"{total_unresolved_links} wikilink(s) could not be resolved within this batch"
        )

    return SourcePreviewResponse(
        detected_notes=detected_notes,
        unresolved_link_count=total_unresolved_links,
        warnings=warnings,
        errors=errors,
    )


def _sync_note_tags(db: Session, note: Note, tag_names: list[str]) -> None:
    """Ensure tags exist and are associated with the note."""
    if not tag_names:
        return

    for raw_name in tag_names:
        name = raw_name.strip().lower()
        if not name:
            continue

        tag = db.scalars(
            select(Tag).where(Tag.workspace_id == note.workspace_id, Tag.name == name)
        ).first()
        if not tag:
            tag = Tag(workspace_id=note.workspace_id, name=name)
            db.add(tag)
            db.flush()

        # Check association
        nt = db.get(NoteTag, (note.id, tag.id))
        if not nt:
            db.add(NoteTag(note_id=note.id, tag_id=tag.id))


def commit_import(
    db: Session,
    workspace_id: uuid.UUID,
    created_by: uuid.UUID,
    files: list[UploadFile],
) -> SourceImportResponse:
    """Commit an import batch following deduplication and upsert rules per contract §5.5, §7.2."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError()

    user = db.get(User, created_by)
    if not user:
        raise UserNotFoundError()

    items = process_uploaded_files(files)

    import_batch_id = uuid.uuid4()
    imported_count = 0
    updated_count = 0
    skipped_count = 0
    failed_count = 0
    results: list[SourceImportResult] = []

    # Map existing sources
    existing_sources = db.scalars(select(Source).where(Source.workspace_id == workspace_id)).all()
    source_map = {s.source_identifier: s for s in existing_sources}

    # Store notes involved in this import to re-resolve wikilinks
    involved_notes: list[Note] = []
    processed_identifiers: set[str] = set()

    for item in items:
        if item.error:
            failed_count += 1
            results.append(
                SourceImportResult(
                    original_path=item.original_path,
                    status="failed",
                    note_id=None,
                    error=item.error,
                )
            )
            continue

        if not item.parsed_note:
            continue

        processed_identifiers.add(item.source_identifier)
        existing = source_map.get(item.source_identifier)
        now = datetime.now(UTC)

        if existing:
            if existing.content_hash == item.content_hash:
                # Content unchanged -> skipped per contract §5.5
                existing.last_synced_at = now
                existing.import_batch_id = import_batch_id
                existing.import_status = "skipped"
                skipped_count += 1
                results.append(
                    SourceImportResult(
                        original_path=item.original_path,
                        status="skipped",
                        note_id=existing.note_id,
                        error=None,
                    )
                )
            else:
                # Content changed -> upsert note in place per contract §5.5
                note = db.get(Note, existing.note_id) if existing.note_id else None
                if note:
                    note.title = item.parsed_note.title
                    note.content = item.parsed_note.content
                    note.metadata_ = item.parsed_note.frontmatter
                    note.updated_at = now
                    _sync_note_tags(db, note, item.parsed_note.tags)
                    involved_notes.append(note)

                existing.content_hash = item.content_hash
                existing.raw_metadata = item.parsed_note.frontmatter
                existing.import_status = "completed"
                existing.last_synced_at = now
                existing.import_batch_id = import_batch_id
                existing.error_message = None

                updated_count += 1
                results.append(
                    SourceImportResult(
                        original_path=item.original_path,
                        status="completed",
                        note_id=note.id if note else None,
                        error=None,
                    )
                )
        else:
            # Create new Note and Source
            note = Note(
                id=uuid.uuid4(),
                workspace_id=workspace_id,
                created_by=created_by,
                title=item.parsed_note.title,
                content=item.parsed_note.content,
                metadata_=item.parsed_note.frontmatter,
            )
            db.add(note)
            db.flush()

            _sync_note_tags(db, note, item.parsed_note.tags)
            involved_notes.append(note)

            new_source = Source(
                id=uuid.uuid4(),
                workspace_id=workspace_id,
                note_id=note.id,
                source_type=item.source_type,
                original_path=item.original_path,
                source_identifier=item.source_identifier,
                content_hash=item.content_hash,
                import_batch_id=import_batch_id,
                import_status="completed",
                raw_metadata=item.parsed_note.frontmatter,
                imported_at=now,
                last_synced_at=now,
            )
            db.add(new_source)
            source_map[item.source_identifier] = new_source

            imported_count += 1
            results.append(
                SourceImportResult(
                    original_path=item.original_path,
                    status="completed",
                    note_id=note.id,
                    error=None,
                )
            )

    db.flush()

    # Re-resolution of wikilinks per contract §5.3
    # Build complete title lookup for workspace
    workspace_notes = db.scalars(
        select(Note).where(Note.workspace_id == workspace_id, Note.is_archived.is_(False))
    ).all()
    title_to_note = {n.title.lower().strip(): n for n in workspace_notes}

    # Re-scan wikilinks for all notes in workspace that might link to newly created notes,
    # as well as all involved notes
    for note in workspace_notes:
        from app.services.obsidian_parser import parse_wikilinks

        wikilinks = parse_wikilinks(note.content)
        for target_title in wikilinks:
            target = title_to_note.get(target_title.lower().strip())
            if target and target.id != note.id:
                link = db.get(NoteLink, (note.id, target.id))
                if not link:
                    db.add(NoteLink(source_note_id=note.id, target_note_id=target.id))

    # Removed sources calculation per contract §5.6
    removed_count = sum(
        1 for s in existing_sources if s.source_identifier not in processed_identifiers
    )

    db.commit()

    return SourceImportResponse(
        import_batch_id=import_batch_id,
        imported=imported_count,
        updated=updated_count,
        skipped=skipped_count,
        failed=failed_count,
        removed_since_last_import=removed_count,
        results=results,
    )


def list_sources(
    db: Session,
    workspace_id: uuid.UUID,
    page: int = 1,
    page_size: int = 50,
) -> SourceListResponse:
    """List paginated sources for a workspace per contract §7.3."""
    ws = db.get(Workspace, workspace_id)
    if not ws:
        raise WorkspaceNotFoundError()

    offset = (page - 1) * page_size
    total = db.scalar(select(func.count(Source.id)).where(Source.workspace_id == workspace_id)) or 0

    sources = db.scalars(
        select(Source)
        .where(Source.workspace_id == workspace_id)
        .order_by(Source.imported_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    items = [SourceResponse.model_validate(s) for s in sources]
    return SourceListResponse(items=items, total=total, page=page, page_size=page_size)


def get_source(db: Session, source_id: uuid.UUID) -> Source:
    """Retrieve a single source record per contract §7.3."""
    source = db.get(Source, source_id)
    if not source:
        raise SourceNotFoundError()
    return source
