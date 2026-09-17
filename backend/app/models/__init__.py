"""Models package.

Canonical module per contract §9.2.
Exports User and Workspace so they are registered on Base.metadata.
"""

from app.models.user import User
from app.models.workspace import Workspace

__all__ = ["User", "Workspace"]
