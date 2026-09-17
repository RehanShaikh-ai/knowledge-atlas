"""Tests for SQLAlchemy models and database-level constraints.

Contract §6, §7, §8, §9, §22.1.
"""

import uuid

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.user import User
from app.models.workspace import Workspace


def test_models_registered_on_base_metadata():
    """Verify that User and Workspace tables are registered on Base.metadata per contract §9.2."""
    table_names = Base.metadata.tables.keys()
    assert "users" in table_names
    assert "workspaces" in table_names


def test_user_model_uuid_default(db_session: Session):
    """Verify that User generates UUID primary key automatically per contract §6.1."""
    user = User(display_name="Auto UUID User")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert isinstance(user.id, uuid.UUID)
    assert user.display_name == "Auto UUID User"
    assert user.created_at is not None
    assert user.updated_at is not None


def test_workspace_model_uuid_default(db_session: Session):
    """Verify that Workspace generates UUID primary key automatically per contract §6.2."""
    user = User(display_name="Workspace Owner")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    workspace = Workspace(name="Test WS", owner_id=user.id)
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)

    assert workspace.id is not None
    assert isinstance(workspace.id, uuid.UUID)
    assert workspace.name == "Test WS"
    assert workspace.owner_id == user.id
    assert workspace.created_at is not None
    assert workspace.updated_at is not None


def test_user_workspaces_relationship(db_session: Session):
    """Verify 1-to-N relationship between User and Workspaces per contract §9."""
    user = User(display_name="Multi WS Owner")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    ws1 = Workspace(name="Workspace 1", owner_id=user.id)
    ws2 = Workspace(name="Workspace 2", owner_id=user.id)
    db_session.add_all([ws1, ws2])
    db_session.commit()
    db_session.refresh(user)

    assert len(user.workspaces) == 2
    ws_names = [w.name for w in user.workspaces]
    assert "Workspace 1" in ws_names
    assert "Workspace 2" in ws_names
    assert ws1.owner.id == user.id
    assert ws2.owner.id == user.id


def test_foreign_key_on_delete_restrict(db_session: Session):
    """Deleting a user with an existing workspace is rejected by ON DELETE RESTRICT constraint.

    Contract §9.1, §22.1:
        Foreign key from workspaces.owner_id to users.id must enforce ON DELETE RESTRICT.
        Verified directly at the SQLAlchemy session level.
    """
    user = User(display_name="Restrict Test User")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    workspace = Workspace(name="Owned Workspace", owner_id=user.id)
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)

    # Attempt to delete user who has a workspace
    db_session.delete(user)
    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_foreign_key_nonexistent_owner_rejected(db_session: Session):
    """Inserting a workspace with a non-existent owner_id violates foreign key constraint."""
    random_owner_id = uuid.uuid4()
    workspace = Workspace(name="Invalid Owner Workspace", owner_id=random_owner_id)
    db_session.add(workspace)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()
