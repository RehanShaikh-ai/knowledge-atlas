"""Tests for database layer interfaces.

Contract §17: backend/app/db/
Interface I-006: Base and settings imports for Alembic env.py.
"""

from app.db.base import Base
from app.db.session import SessionLocal, engine, get_db


def test_base_declarative_metadata():
    """Base declarative class exists and has metadata per contract §17 and Interface I-006."""
    assert Base is not None
    assert hasattr(Base, "metadata")
    assert Base.metadata is not None


def test_engine_and_session_factory():
    """Engine and SessionLocal factory exist per contract §17."""
    assert engine is not None
    assert SessionLocal is not None
    assert callable(SessionLocal)


def test_get_db_generator():
    """get_db yields a database session and closes it."""
    gen = get_db()
    # It's a generator
    assert hasattr(gen, "__iter__")
