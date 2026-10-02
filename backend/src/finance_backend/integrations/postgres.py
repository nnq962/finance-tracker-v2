"""PostgreSQL access through DATABASE_URL (the finance_app role)."""

import os

import psycopg
from psycopg.rows import dict_row


def connect(*, autocommit: bool = False) -> psycopg.Connection:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    # Bounded waits: a hung database or a lock held by the web app fails the
    # pass (retried ten minutes later) instead of stalling the worker.
    return psycopg.connect(
        url,
        row_factory=dict_row,
        autocommit=autocommit,
        connect_timeout=10,
        options="-c statement_timeout=30s -c lock_timeout=10s",
    )
