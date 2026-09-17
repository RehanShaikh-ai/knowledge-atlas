"""Unit tests for backend service layer.

Contract §15.
"""

import uuid

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import UserNotFoundError
from app.schemas.user import UserCreate
from app.schemas.workspace import WorkspaceCreate
from app.services import user_service, workspace_service


def test_user_service_create_and_get(db_session: Session):
    """Test user_service create_user and get_user."""
    user_in = UserCreate(display_name="Service Test User")
    created = user_service.create_user(db=db_session, user_in=user_in)

    assert created.id is not None
    assert isinstance(created.id, uuid.UUID)
    assert created.display_name == "Service Test User"

    fetched = user_service.get_user(db=db_session, user_id=created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.display_name == "Service Test User"


def test_user_service_get_nonexistent(db_session: Session):
    """Test user_service get_user returns None for unknown ID."""
    result = user_service.get_user(db=db_session, user_id=uuid.uuid4())
    assert result is None


def test_user_service_list_users(db_session: Session):
    """Test user_service list_users returns all items and count."""
    users, total = user_service.list_users(db=db_session)
    assert total == 0
    assert len(users) == 0

    user_service.create_user(db=db_session, user_in=UserCreate(display_name="User Alpha"))
    user_service.create_user(db=db_session, user_in=UserCreate(display_name="User Beta"))

    users, total = user_service.list_users(db=db_session)
    assert total == 2
    assert len(users) == 2
    assert users[0].display_name == "User Alpha"
    assert users[1].display_name == "User Beta"


def test_workspace_service_create_and_get(db_session: Session):
    """Test workspace_service create_workspace and get_workspace."""
    owner = user_service.create_user(
        db=db_session, user_in=UserCreate(display_name="Workspace Owner")
    )
    ws_in = WorkspaceCreate(
        name="Service Workspace",
        description="Service description",
        owner_id=owner.id,
    )
    created = workspace_service.create_workspace(db=db_session, workspace_in=ws_in)

    assert created.id is not None
    assert isinstance(created.id, uuid.UUID)
    assert created.name == "Service Workspace"
    assert created.description == "Service description"
    assert created.owner_id == owner.id

    fetched = workspace_service.get_workspace(db=db_session, workspace_id=created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.name == "Service Workspace"


def test_workspace_service_create_missing_owner_raises(db_session: Session):
    """Test workspace_service create_workspace raises UserNotFoundError when owner missing."""
    ws_in = WorkspaceCreate(
        name="Orphan WS",
        owner_id=uuid.uuid4(),
    )
    with pytest.raises(UserNotFoundError) as exc_info:
        workspace_service.create_workspace(db=db_session, workspace_in=ws_in)

    assert exc_info.value.status_code == 404
    assert exc_info.value.code == "USER_NOT_FOUND"


def test_workspace_service_get_nonexistent(db_session: Session):
    """Test workspace_service get_workspace returns None for unknown ID."""
    result = workspace_service.get_workspace(db=db_session, workspace_id=uuid.uuid4())
    assert result is None


def test_workspace_service_list_workspaces(db_session: Session):
    """Test workspace_service list_workspaces returns all items and count."""
    owner = user_service.create_user(db=db_session, user_in=UserCreate(display_name="Multi Owner"))

    workspaces, total = workspace_service.list_workspaces(db=db_session)
    assert total == 0
    assert len(workspaces) == 0

    workspace_service.create_workspace(
        db=db_session, workspace_in=WorkspaceCreate(name="WS 1", owner_id=owner.id)
    )
    workspace_service.create_workspace(
        db=db_session, workspace_in=WorkspaceCreate(name="WS 2", owner_id=owner.id)
    )

    workspaces, total = workspace_service.list_workspaces(db=db_session)
    assert total == 2
    assert len(workspaces) == 2
