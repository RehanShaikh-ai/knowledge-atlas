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


class NoteNotFoundError(AppException):
    """Raised when a note is not found (404, NOTE_NOT_FOUND)."""

    def __init__(self, message: str = "Note not found.") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, "NOTE_NOT_FOUND", message)


class TagNotFoundError(AppException):
    """Raised when a tag is not found (404, TAG_NOT_FOUND)."""

    def __init__(self, message: str = "Tag not found.") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, "TAG_NOT_FOUND", message)


class ConflictError(AppException):
    """Raised when a note link duplicates an existing link (409, CONFLICT)."""

    def __init__(self, message: str = "The requested link already exists.") -> None:
        super().__init__(status.HTTP_409_CONFLICT, "CONFLICT", message)


class DuplicateTagError(AppException):
    """Raised when a tag is already assigned to a note (409, DUPLICATE_TAG)."""

    def __init__(self, message: str = "The tag is already assigned to this note.") -> None:
        super().__init__(status.HTTP_409_CONFLICT, "DUPLICATE_TAG", message)


class ValidationError(AppException):
    """Raised for domain validation failures (422, VALIDATION_ERROR)."""

    def __init__(self, message: str) -> None:
        super().__init__(status.HTTP_422_UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", message)
