"""User API routes.

Canonical module per contract §11, §14.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.exceptions import UserNotFoundError
from app.db.session import get_db
from app.schemas.user import UserCreate, UserListResponse, UserResponse
from app.services import user_service

router = APIRouter()


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    name="create_user",
)
def create_user(
    user_in: UserCreate,
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Create a new user.

    Contract §11.1:
        POST /api/v1/users -> 201 Created
    """
    user = user_service.create_user(db=db, user_in=user_in)
    return UserResponse.model_validate(user)


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    name="get_user",
)
def get_user(
    user_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Retrieve a single user by ID.

    Contract §11.2:
        GET /api/v1/users/{user_id} -> 200 OK (or 404 USER_NOT_FOUND)
    """
    user = user_service.get_user(db=db, user_id=user_id)
    if not user:
        raise UserNotFoundError()
    return UserResponse.model_validate(user)


@router.get(
    "/users",
    response_model=UserListResponse,
    status_code=status.HTTP_200_OK,
    name="list_users",
)
def list_users(
    db: Annotated[Session, Depends(get_db)],
) -> UserListResponse:
    """List all users.

    Contract §11.3:
        GET /api/v1/users -> 200 OK
    """
    users, total = user_service.list_users(db=db)
    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
    )
