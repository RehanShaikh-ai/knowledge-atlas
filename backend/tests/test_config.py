"""Tests for application configuration.

Contract §26: backend/tests/test_config.py
Tests must verify contract §4.2, §5.1, §18 behavior.
"""

import os
from unittest.mock import patch


def test_settings_load_from_environment():
    """Settings class loads values from environment variables per contract §5.1."""
    env_vars = {
        "APP_ENV": "testing",
        "APP_HOST": "127.0.0.1",
        "APP_PORT": "9090",
        "DATABASE_HOST": "testhost",
        "DATABASE_PORT": "5433",
        "DATABASE_NAME": "testdb",
        "DATABASE_USER": "testuser",
        "DATABASE_PASSWORD": "testpass",
        "FRONTEND_URL": "http://localhost:3000",
    }
    with patch.dict(os.environ, env_vars, clear=False):
        # Import Settings class fresh to pick up patched env
        from app.core.config import Settings

        s = Settings()
        assert s.APP_ENV == "testing"
        assert s.APP_HOST == "127.0.0.1"
        assert s.APP_PORT == 9090
        assert s.DATABASE_HOST == "testhost"
        assert s.DATABASE_PORT == 5433
        assert s.DATABASE_NAME == "testdb"
        assert s.DATABASE_USER == "testuser"
        assert s.DATABASE_PASSWORD == "testpass"
        assert s.FRONTEND_URL == "http://localhost:3000"


def test_database_url_format():
    """Database URL uses the canonical postgresql+psycopg:// format per contract §18."""
    env_vars = {
        "DATABASE_HOST": "dbhost",
        "DATABASE_PORT": "5432",
        "DATABASE_NAME": "mydb",
        "DATABASE_USER": "myuser",
        "DATABASE_PASSWORD": "mypass",
    }
    with patch.dict(os.environ, env_vars, clear=False):
        from app.core.config import Settings

        s = Settings()
        url = s.database_url
        assert url == "postgresql+psycopg://myuser:mypass@dbhost:5432/mydb"
        assert url.startswith("postgresql+psycopg://")


def test_settings_default_values():
    """Settings have sensible defaults when no environment variables are set."""
    # Remove DB-related env vars if present, use defaults
    env_clear = {
        "APP_ENV": "development",
        "DATABASE_HOST": "postgres",
        "DATABASE_PORT": "5432",
        "DATABASE_NAME": "knowledge_atlas",
        "DATABASE_USER": "knowledge_atlas",
        "DATABASE_PASSWORD": "change_me",
    }
    with patch.dict(os.environ, env_clear, clear=True):
        from app.core.config import Settings

        s = Settings(_env_file=None)
        assert s.APP_ENV == "development"
        assert s.APP_PORT == 8080
        assert s.DATABASE_HOST == "postgres"
        assert s.DATABASE_NAME == "knowledge_atlas"


def test_settings_singleton_import():
    """The canonical settings singleton is importable per contract §4.2."""
    from app.core.config import settings

    assert settings is not None
    assert hasattr(settings, "APP_ENV")
    assert hasattr(settings, "database_url")
