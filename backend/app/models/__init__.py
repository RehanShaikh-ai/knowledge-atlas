"""Models package.

Canonical module per contract §8.1.
Exports all domain models so they are registered on Base.metadata.
"""

from app.models.note import Note
from app.models.note_link import NoteLink
from app.models.note_tag import NoteTag
from app.models.tag import Tag
from app.models.user import User
from app.models.workspace import Workspace

__all__ = [
    "Note",
    "NoteLink",
    "NoteTag",
    "Tag",
    "User",
    "Workspace",
]
