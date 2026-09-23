"""Models package.

Canonical module per contract §8.1 (v0.2.1) and CONTRACT v0.3.1 §5.1.
Exports all domain models so they are registered on Base.metadata
and Alembic can auto-generate accurate migration diffs.

v0.2.x models: Note, NoteLink, NoteTag, Source, Tag, User, Workspace
v0.3.1 models: IndexJob, NoteChunk, NoteVersion, SavedSearch
"""

from app.models.index_job import IndexJob
from app.models.note import Note
from app.models.note_chunk import NoteChunk
from app.models.note_link import NoteLink
from app.models.note_tag import NoteTag
from app.models.note_version import NoteVersion
from app.models.saved_search import SavedSearch
from app.models.source import Source
from app.models.tag import Tag
from app.models.user import User
from app.models.workspace import Workspace

__all__ = [
    # v0.2.x
    "Note",
    "NoteLink",
    "NoteTag",
    "Source",
    "Tag",
    "User",
    "Workspace",
    # v0.3.1
    "IndexJob",
    "NoteChunk",
    "NoteVersion",
    "SavedSearch",
]
