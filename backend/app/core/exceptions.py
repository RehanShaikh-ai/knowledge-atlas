"""Domain exception classes.

Canonical exceptions per contract §13.
"""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception with explicit error code."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.code = code
        self.message = message


class UserNotFoundError(AppException):
    """Raised when a user is not found (404, USER_NOT_FOUND)."""

    def __init__(self, message: str = "User not found.") -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message=message,
        )


class WorkspaceNotFoundError(AppException):
    """Raised when a workspace is not found (404, WORKSPACE_NOT_FOUND)."""

    def __init__(self, message: str = "Workspace not found.") -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="WORKSPACE_NOT_FOUND",
            message=message,
        )
