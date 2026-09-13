"""Integration tests validating Backend -> SQLAlchemy -> Psycopg -> PostgreSQL connectivity.

Contract references:
- CONTRACT §18: Database URL Contract (postgresql+psycopg://...)
- CONTRACT §28: Integration Test Contract (Testcontainers PostgreSQL)
- CONTRACT §35: Interface I-004
"""

import pytest
from sqlalchemy import create_engine, text
from testcontainers.postgres import PostgresContainer


@pytest.fixture(scope="module")
def postgres_container():
    """Spin up an isolated PostgreSQL 16 container for integration tests."""
    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres


def test_postgresql_connection_with_psycopg3(postgres_container):
    """Validate direct connectivity via SQLAlchemy 2 + Psycopg 3 to PostgreSQL."""
    # Build canonical connection string format per CONTRACT §18 & Interface I-004
    host = postgres_container.get_container_host_ip()
    port = postgres_container.get_exposed_port(5432)
    user = postgres_container.username
    password = postgres_container.password
    dbname = postgres_container.dbname

    db_url = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{dbname}"

    engine = create_engine(db_url, echo=False)

    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1 AS alive"))
        row = result.fetchone()
        assert row is not None
        assert row[0] == 1


def test_postgresql_table_creation_and_transaction(postgres_container):
    """Validate transactional integrity and table creation in isolated PostgreSQL."""
    host = postgres_container.get_container_host_ip()
    port = postgres_container.get_exposed_port(5432)
    user = postgres_container.username
    password = postgres_container.password
    dbname = postgres_container.dbname

    db_url = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{dbname}"
    engine = create_engine(db_url, echo=False)

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE _test_connectivity (
                    id SERIAL PRIMARY KEY,
                    check_name VARCHAR(50) NOT NULL,
                    status VARCHAR(20) NOT NULL
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO _test_connectivity (check_name, status)
                VALUES ('psycopg3_handshake', 'ok')
                """
            )
        )

    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT status FROM _test_connectivity WHERE check_name = 'psycopg3_handshake'")
        )
        row = result.fetchone()
        assert row is not None
        assert row[0] == "ok"
