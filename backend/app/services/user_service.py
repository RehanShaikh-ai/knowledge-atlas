"""User service module.

Canonical service per contract §15.
"""

import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate


def create_user(db: Session, user_in: UserCreate) -> User:
    """Create a new user record in the database."""
    user = User(
        display_name=user_in.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user(db: Session, user_id: uuid.UUID) -> User | None:
    """Retrieve a user by ID."""
    statement = select(User).where(User.id == user_id)
    return db.scalars(statement).first()


def list_users(db: Session) -> tuple[Sequence[User], int]:
    """List all users and the total count."""
    count_stmt = select(func.count(User.id))
    total = db.scalar(count_stmt) or 0

    stmt = select(User).order_by(User.created_at.asc())
    users = db.scalars(stmt).all()
    return users, total
