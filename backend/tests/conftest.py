"""Pytest configuration and fixtures for backend testing.

Provides an in-memory SQLite database and test client fixtures.
"""

import os
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app

os.environ["APP_ENV"] = "testing"
settings.APP_ENV = "testing"

# Create in-memory SQLite engine for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


# Enforce foreign key constraints in SQLite
@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(autouse=True)
def setup_test_env(tmp_path: Path) -> Generator[None, None, None]:
    """Ensure test environment and temporary Git repository root are set."""
    old_env = settings.APP_ENV
    old_git_root = settings.GIT_REPOSITORY_ROOT
    settings.APP_ENV = "testing"
    settings.GIT_REPOSITORY_ROOT = str(tmp_path / "git_repos")
    yield
    settings.APP_ENV = old_env
    settings.GIT_REPOSITORY_ROOT = old_git_root


@pytest.fixture(autouse=True)
def setup_db() -> Generator[None, None, None]:
    """Create fresh database tables before each test and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Provide a transactional database session for tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Provide a TestClient with overridden get_db dependency."""

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
