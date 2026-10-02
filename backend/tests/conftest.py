"""PostgreSQL fixtures: tests run on the local finance_test database.

The URL comes from TEST_DATABASE_URL, or from DATABASE_URL in web/.env.local
(created by `npm run db:up`) pointed at finance_test. Every test works with
its own users and removes them afterwards.
"""

import os
import re
from pathlib import Path
from uuid import uuid4

import psycopg
import pytest
from psycopg.rows import dict_row


def test_database_url() -> str | None:
    if url := os.environ.get("TEST_DATABASE_URL"):
        return url
    env_file = Path(__file__).resolve().parents[2] / "web" / ".env.local"
    if not env_file.exists():
        return None
    for line in env_file.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip().strip('"')
            return re.sub(r"/[^/?]+(\?|$)", r"/finance_test\1", url, count=1)
    return None


@pytest.fixture
def conn():
    url = test_database_url()
    if url is None:
        pytest.skip("No test database: run `npm run db:up` in web/")
    with psycopg.connect(url, row_factory=dict_row, autocommit=True) as connection:
        yield connection


@pytest.fixture
def make_conn():
    """Extra connections, for checks that need two workers at once."""
    url = test_database_url()
    opened = []

    def open_connection():
        connection = psycopg.connect(url, row_factory=dict_row, autocommit=True)
        opened.append(connection)
        return connection

    yield open_connection
    for connection in opened:
        connection.close()


@pytest.fixture
def users(conn):
    """Creates isolated users; deleting them cascades to their data."""
    created, browsers = [], []

    def create():
        uid = f"reminder_test_{uuid4()}"
        conn.execute("INSERT INTO users (id) VALUES (%s)", (uid,))
        created.append(uid)
        return uid

    create.browsers = browsers
    yield create
    if browsers:
        conn.execute(
            "DELETE FROM notification_browsers WHERE id = ANY(%s)", (browsers,)
        )
    if created:
        conn.execute("DELETE FROM users WHERE id = ANY(%s)", (created,))
