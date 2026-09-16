"""Application configuration.

Loads settings from environment variables using pydantic-settings.
Canonical module per contract §4.2.
"""

import logging

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("app.core.config")


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All canonical environment variable names are defined in contract §5.1.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Application
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8080

    # Database
    DATABASE_HOST: str = "postgres"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "knowledge_atlas"
    DATABASE_USER: str = "knowledge_atlas"
    DATABASE_PASSWORD: str = "change_me"
    DATABASE_URL: str | None = None

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def database_url(self) -> str:
        """Construct the canonical PostgreSQL URL (contract §18).

        Format: postgresql+psycopg://<user>:<password>@<host>:<port>/<database>
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL

        from sqlalchemy import URL
        url = URL.create(
            drivername="postgresql+psycopg",
            username=self.DATABASE_USER,
            password=self.DATABASE_PASSWORD,
            host=self.DATABASE_HOST,
            port=self.DATABASE_PORT,
            database=self.DATABASE_NAME,
        )
        return url.render_as_string(hide_password=False)


settings = Settings()
