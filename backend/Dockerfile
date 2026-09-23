# syntax=docker/dockerfile:1

FROM python:3.12-slim

WORKDIR /app

# Install git and system utilities
RUN apt-get update && apt-get install -y --no-install-recommends git curl && rm -rf /var/lib/apt/lists/*

# Install uv for dependency management
COPY --from=ghcr.io/astral-sh/uv:0.4.30 /uv /uvx /bin/

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application and migration code
COPY app/ ./app/
COPY alembic.ini ./alembic.ini
COPY alembic/ ./alembic/

# Create /data/workspaces and switch to a dedicated non-root application user
RUN mkdir -p /data/workspaces \
    && adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app /data/workspaces \
    && chmod -R 777 /data/workspaces
USER appuser

# Expose the backend port
EXPOSE 8080

# Run the FastAPI application
CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
