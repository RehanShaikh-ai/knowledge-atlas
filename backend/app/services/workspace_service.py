"""Workspace service module.

Canonical service per contract §15.
"""

import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import UserNotFoundError
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate
from app.services import user_service


def create_workspace(db: Session, workspace_in: WorkspaceCreate) -> Workspace:
    """Create a new workspace record after validating owner existence.

    Contract §8.2, §12.1:
        Validates that owner_id references an existing User.
        If owner does not exist, raises UserNotFoundError (404, USER_NOT_FOUND).
    """
    owner = user_service.get_user(db, workspace_in.owner_id)
    if not owner:
        raise UserNotFoundError("Workspace owner does not exist.")

    workspace = Workspace(
        name=workspace_in.name,
        description=workspace_in.description,
        owner_id=workspace_in.owner_id,
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


def get_workspace(db: Session, workspace_id: uuid.UUID) -> Workspace | None:
    """Retrieve a workspace by ID."""
    statement = select(Workspace).where(Workspace.id == workspace_id)
    return db.scalars(statement).first()


def list_workspaces(db: Session) -> tuple[Sequence[Workspace], int]:
    """List all workspaces and the total count."""
    count_stmt = select(func.count(Workspace.id))
    total = db.scalar(count_stmt) or 0

    stmt = select(Workspace).order_by(Workspace.created_at.asc())
    workspaces = db.scalars(stmt).all()
    return workspaces, total
