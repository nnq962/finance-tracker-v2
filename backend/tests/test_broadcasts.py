"""Broadcast worker checks on PostgreSQL (finance_test); FCM is always faked."""

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from firebase_admin import exceptions, messaging
from test_reminders import device

from finance_backend.workers.broadcasts import BroadcastWorker


@pytest.fixture
def broadcasts(conn):
    """Creates broadcasts; removed afterwards with their recipients and deliveries."""
    created = []

    def create(**changes):
        values = {
            "title": "Tin mới",
            "body": "Nội dung",
            "opens": "budgets",
            "push_url": "/overview?screen=budgets",
            "in_bell": True,
            "push": True,
            "audience": "all",
            "send_at": datetime.now(UTC),
            "created_by": "broadcast_test_admin",
            **changes,
        }
        row = conn.execute(
            f"INSERT INTO broadcasts ({', '.join(values)}) "
            f"VALUES ({', '.join(['%s'] * len(values))}) RETURNING id",
            tuple(values.values()),
        ).fetchone()
        created.append(row["id"])
        return row["id"]

    yield create
    if created:
        conn.execute("DELETE FROM broadcasts WHERE id = ANY(%s)", (created,))


class FakeFcm:
    """send_each that records messages and answers each by its fid."""

    def __init__(self, errors=None):
        self.messages = []
        self.errors = errors or {}

    def __call__(self, messages):
        self.messages.extend(messages)
        return SimpleNamespace(
            responses=[
                SimpleNamespace(success=False, exception=self.errors[m.fid])
                if m.fid in self.errors
                else SimpleNamespace(success=True, exception=None)
                for m in messages
            ]
        )


def status(conn, broadcast_id):
    return conn.execute(
        "SELECT status FROM broadcasts WHERE id = %s", (broadcast_id,)
    ).fetchone()["status"]


def delivery(conn, broadcast_id, device_id):
    return conn.execute(
        "SELECT * FROM broadcast_deliveries WHERE broadcast_id = %s AND device_id = %s",
        (broadcast_id, device_id),
    ).fetchone()


def test_due_broadcast_is_released_and_pushed_except_to_opted_out(
    conn, users, broadcasts
):
    reader, quiet = users(), users()
    phone, laptop = device(conn, users, reader), device(conn, users, reader)
    muted = device(conn, users, quiet)
    conn.execute(
        "INSERT INTO notification_settings (user_id, broadcasts_enabled) "
        "VALUES (%s, false)",
        (quiet,),
    )
    later = broadcasts(send_at=datetime.now(UTC) + timedelta(hours=1))
    due = broadcasts(status="scheduled")
    fcm = FakeFcm()
    BroadcastWorker(conn, send_each=fcm).run_once()

    # Set for later: untouched.
    assert status(conn, later) == "scheduled"
    # Due: both users get it in the bell, only the one with pushes on gets pushed.
    recipients = {
        row["user_id"]
        for row in conn.execute(
            "SELECT user_id FROM broadcast_recipients WHERE broadcast_id = %s", (due,)
        ).fetchall()
    }
    assert {reader, quiet} <= recipients
    ours = [m for m in fcm.messages if m.fid in {phone.fid, laptop.fid, muted.fid}]
    assert {m.fid for m in ours} == {phone.fid, laptop.fid}
    assert ours[0].data == {
        "type": "broadcast",
        "id": str(due),
        "url": "/overview?screen=budgets",
    }
    assert ours[0].webpush.notification.tag == f"broadcast-{due}"
    assert delivery(conn, due, phone.id)["status"] == "sent"
    assert delivery(conn, due, muted.id) is None
    assert status(conn, due) == "sent"

    # Nothing is pushed twice.
    fcm.messages.clear()
    BroadcastWorker(conn, send_each=fcm).run_once()
    assert not [m for m in fcm.messages if m.fid in {phone.fid, laptop.fid}]


def test_bell_only_broadcast_pushes_nothing(conn, users, broadcasts):
    uid = users()
    phone = device(conn, users, uid)
    due = broadcasts(push=False)
    fcm = FakeFcm()
    BroadcastWorker(conn, send_each=fcm).run_once()
    assert not [m for m in fcm.messages if m.fid == phone.fid]
    assert status(conn, due) == "sent"


def test_unregistered_removed_temporary_retried_permanent_failed(
    conn, users, broadcasts
):
    uid = users()
    gone, busy, broken = (device(conn, users, uid) for _ in range(3))
    due = broadcasts()
    fcm = FakeFcm(
        {
            gone.fid: messaging.UnregisteredError("Gone"),
            busy.fid: exceptions.UnavailableError("Busy"),
            broken.fid: exceptions.InvalidArgumentError("Payload"),
        }
    )
    BroadcastWorker(conn, send_each=fcm).run_once()
    assert delivery(conn, due, gone.id)["status"] == "unregistered"
    assert (
        conn.execute("SELECT 1 FROM push_devices WHERE id = %s", (gone.id,)).fetchone()
        is None
    )
    retry = delivery(conn, due, busy.id)
    assert retry["status"] == "retry" and retry["retry_at"] is not None
    assert delivery(conn, due, broken.id)["status"] == "failed"
    # A retry still to come keeps it sending, without a lease.
    row = conn.execute(
        "SELECT status, lease_until FROM broadcasts WHERE id = %s", (due,)
    ).fetchone()
    assert row["status"] == "sending" and row["lease_until"] is None

    # Once its time comes, it goes.
    conn.execute(
        "UPDATE broadcast_deliveries SET retry_at = now() - interval '1 second' "
        "WHERE broadcast_id = %s AND device_id = %s",
        (due, busy.id),
    )
    BroadcastWorker(conn, send_each=FakeFcm()).run_once()
    assert delivery(conn, due, busy.id)["status"] == "sent"
    assert status(conn, due) == "sent"


def test_revoked_broadcast_is_not_pushed(conn, users, broadcasts):
    uid = users()
    phone = device(conn, users, uid)
    due = broadcasts()
    conn.execute("SELECT release_broadcast(%s)", (due,))
    conn.execute(
        "UPDATE broadcasts SET revoked_at = now(), status = 'sent' WHERE id = %s",
        (due,),
    )
    fcm = FakeFcm()
    BroadcastWorker(conn, send_each=fcm).run_once()
    assert not [m for m in fcm.messages if m.fid == phone.fid]


def test_lease_held_by_another_worker_is_respected(conn, users, broadcasts):
    uid = users()
    phone = device(conn, users, uid)
    due = broadcasts()
    conn.execute("SELECT release_broadcast(%s)", (due,))
    conn.execute(
        "UPDATE broadcasts SET attempt_id = gen_random_uuid(), "
        "lease_until = now() + interval '5 minutes' WHERE id = %s",
        (due,),
    )
    fcm = FakeFcm()
    BroadcastWorker(conn, send_each=fcm).push(due)
    assert not [m for m in fcm.messages if m.fid == phone.fid]
    assert delivery(conn, due, phone.id)["status"] == "pending"
