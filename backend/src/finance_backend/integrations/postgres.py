"""PostgreSQL access through DATABASE_URL (the finance_app role)."""

import os

import psycopg
from psycopg.rows import dict_row


def connect(*, autocommit: bool = False) -> psycopg.Connection:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg.connect(url, row_factory=dict_row, autocommit=autocommit)
