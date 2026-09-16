"""SQLAlchemy declarative base.

Canonical module per contract §17.
Exports the Base class used by models and by Workstream C's Alembic env.py (Interface I-006).
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """SQLAlchemy declarative base class.

    No application-domain models are defined in v0.1.1 (contract §19).
    This class exists solely to establish the SQLAlchemy/Alembic infrastructure.
    """

    pass
