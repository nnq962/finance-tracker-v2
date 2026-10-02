"""Reminder worker checks on PostgreSQL (finance_test); FCM is always faked."""

import hashlib
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, date, datetime, time, timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest
from firebase_admin import exceptions, messaging

import finance_backend.workers.reminders as reminders
from finance_backend.workers.reminders import ReminderWorker, next_reminder, retry_at

NOW = datetime(2026, 10, 1, 13, 10, tzinfo=UTC)  # 20:10 in Vietnam
TODAY = date(2026, 10, 1)
TOMORROW_AT_20 = datetime(2026, 10, 2, 13, tzinfo=UTC)


def settings(conn, uid, **changes):
    values = {
        "notifications_enabled": True,
        "daily_reminder_time": time(20, 0),
        "time_zone": "Asia/Ho_Chi_Minh",
        "next_reminder_at": NOW - timedelta(minutes=10),
        **changes,
    }
    conn.execute(
        "INSERT INTO notification_settings (user_id, notifications_enabled, "
        "daily_reminder_time, time_zone, next_reminder_at) "
        "VALUES (%s, %s, %s, %s, %s)",
        (uid, *values.values()),
    )


def device(conn, users, uid):
    """A push registration linked to one of the user's browser sessions."""
    fid = "c" + uuid4().hex[:21]
    device_id = hashlib.sha256(fid.encode()).hexdigest()
    browser_id = uuid4()
    users.browsers.append(browser_id)
    conn.execute(
        "INSERT INTO notification_browsers (id, user_id, session_id) "
        "VALUES (%s, %s, %s)",
        (browser_id, uid, uuid4()),
    )
    conn.execute(
        "INSERT INTO push_devices (id, user_id, fid, name, browser_id) "
        "VALUES (%s, %s, %s, 'Test', %s)",
        (device_id, uid, fid, browser_id),
    )
    conn.execute(
        "UPDATE notification_browsers SET device_id = %s WHERE id = %s",
        (device_id, browser_id),
    )
    return SimpleNamespace(id=device_id, fid=fid, browser_id=browser_id)


def worker(conn, send=None, at=NOW):
    return ReminderWorker(conn, send=send or (lambda _: None), clock=lambda: at)


def next_at(conn, uid):
    return conn.execute(
        "SELECT next_reminder_at FROM notification_settings WHERE user_id = %s", (uid,)
    ).fetchone()["next_reminder_at"]


def log(conn, uid, day=TODAY):
    return conn.execute(
        "SELECT * FROM notification_logs WHERE user_id = %s AND date = %s", (uid, day)
    ).fetchone()


def result(conn, uid, device_id, day=TODAY):
    return conn.execute(
        "SELECT * FROM notification_log_devices "
        "WHERE user_id = %s AND date = %s AND device_id = %s",
        (uid, day, device_id),
    ).fetchone()


def exists(conn, table, column, value):
    return (
        conn.execute(f"SELECT 1 FROM {table} WHERE {column} = %s", (value,)).fetchone()
        is not None
    )


def test_due_query_and_preview_never_write_or_send(conn, users):
    uid = users()
    settings(conn, uid)
    device(conn, users, uid)
    settings(conn, users(), notifications_enabled=False, next_reminder_at=None)
    settings(conn, users(), next_reminder_at=NOW + timedelta(minutes=1))
    instance = worker(conn, lambda _: pytest.fail("FCM invoked"))
    # Other test users may share the database: count only this test's.
    assert instance.run_once(dry_run=True, limit=1000) >= 1
    assert log(conn, uid) is None
    assert next_at(conn, uid) == NOW - timedelta(minutes=10)


def test_multi_device_send_and_daily_dedup(conn, users):
    uid = users()
    settings(conn, uid)
    first, second = device(conn, users, uid), device(conn, users, uid)
    messages = []
    instance = worker(conn, messages.append)
    instance.process(uid, NOW)
    assert {m.fid for m in messages} == {first.fid, second.fid}
    assert all(m.token is None for m in messages)
    assert messages[0].data == {"type": "daily-reminder", "date": "2026-10-01"}
    assert log(conn, uid)["status"] == "sent"
    assert log(conn, uid)["attempt_id"] is None
    assert next_at(conn, uid) == TOMORROW_AT_20
    # Due again the same day (e.g. a clock change): never a second reminder.
    conn.execute(
        "UPDATE notification_settings SET next_reminder_at = %s WHERE user_id = %s",
        (NOW, uid),
    )
    instance.process(uid, NOW)
    assert len(messages) == 2
    assert next_at(conn, uid) == TOMORROW_AT_20


def test_claim_is_exclusive_and_expired_lease_recovers(conn, users, make_conn):
    uid = users()
    settings(conn, uid)
    # Two workers with their own connections claim at the same moment.
    workers = [worker(make_conn()) for _ in range(2)]
    with ThreadPoolExecutor(max_workers=2) as pool:
        claims = list(pool.map(lambda w: w.claim(uid, NOW), workers))
    assert sum(claim is not None for claim in claims) == 1
    assert worker(conn).claim(uid, NOW + timedelta(minutes=4)) is None
    assert worker(conn).claim(uid, NOW + timedelta(minutes=6)) is not None


def test_retry_only_failed_device(conn, users):
    uid = users()
    settings(conn, uid)
    first, second = device(conn, users, uid), device(conn, users, uid)
    seen = []

    def send(message):
        seen.append(message.fid)
        if message.fid == second.fid and seen.count(message.fid) == 1:
            raise exceptions.UnavailableError("Temporary failure")

    instance = worker(conn, send)
    instance.process(uid, NOW)
    assert log(conn, uid)["status"] == "retry"
    assert result(conn, uid, second.id)["retry_at"] == NOW + timedelta(minutes=10)
    assert next_at(conn, uid) <= NOW
    instance.process(uid, NOW)
    assert len(seen) == 2  # Not due for a retry yet.
    instance.clock = lambda: NOW + timedelta(minutes=10)
    instance.process(uid, NOW + timedelta(minutes=10))
    assert seen.count(first.fid) == 1
    assert seen.count(second.fid) == 2
    assert result(conn, uid, second.id)["attempts"] == 2
    assert log(conn, uid)["status"] == "sent"
    assert next_at(conn, uid) == TOMORROW_AT_20


def test_disabled_or_edited_after_claim_cannot_send(conn, users):
    uid = users()
    settings(conn, uid)
    target = device(conn, users, uid)
    instance = worker(conn)
    claimed, day, attempt_id, _ = instance.claim(uid, NOW)
    conn.execute(
        "UPDATE notification_settings SET notifications_enabled = false, "
        "next_reminder_at = NULL WHERE user_id = %s",
        (uid,),
    )
    assert instance.preflight(uid, claimed, day, attempt_id, target.id) is None
    # Saving the settings again (same values) also invalidates the claim.
    conn.execute(
        "UPDATE notification_settings SET notifications_enabled = true, "
        "next_reminder_at = %s WHERE user_id = %s",
        (claimed["next_reminder_at"], uid),
    )
    assert instance.preflight(uid, claimed, day, attempt_id, target.id) is None


def test_old_day_is_skipped_and_missing_device_is_not_sent(conn, users):
    stale = users()
    settings(conn, stale, next_reminder_at=NOW - timedelta(days=1))
    assert worker(conn).claim(stale, NOW) is None
    assert next_at(conn, stale) == TOMORROW_AT_20
    lonely = users()
    settings(conn, lonely)
    worker(conn).process(lonely, NOW)
    # No device yet: stays due, so a device added later still gets today's.
    assert next_at(conn, lonely) <= NOW
    assert log(conn, lonely)["status"] == "waiting"


def test_unregistered_registration_is_removed(conn, users):
    uid = users()
    settings(conn, uid)
    target = device(conn, users, uid)

    def unregistered(_):
        raise messaging.UnregisteredError("Gone")

    worker(conn, unregistered).process(uid, NOW)
    assert not exists(conn, "push_devices", "id", target.id)
    assert (
        conn.execute(
            "SELECT device_id FROM notification_browsers WHERE id = %s",
            (target.browser_id,),
        ).fetchone()["device_id"]
        is None
    )
    assert result(conn, uid, target.id)["status"] == "unregistered"
    assert next_at(conn, uid) == TOMORROW_AT_20


@pytest.mark.parametrize(
    "change",
    [
        # Re-registered while sending.
        "UPDATE push_devices SET name = 'Refreshed' WHERE id = %(device)s",
        # The browser's session rotated (logout/login).
        "UPDATE notification_browsers SET session_id = gen_random_uuid() "
        "WHERE id = %(browser)s",
    ],
)
def test_cleanup_keeps_a_registration_changed_meanwhile(conn, users, change):
    uid = users()
    settings(conn, uid)
    target = device(conn, users, uid)

    def send(_):
        conn.execute(change, {"device": target.id, "browser": target.browser_id})
        raise messaging.UnregisteredError("Old registration")

    worker(conn, send).process(uid, NOW)
    assert exists(conn, "push_devices", "id", target.id)


def test_cleanup_keeps_a_registration_transferred_to_another_user(conn, users):
    uid, other = users(), users()
    settings(conn, uid)
    target = device(conn, users, uid)

    def send(_):
        conn.execute(
            "UPDATE push_devices SET user_id = %s WHERE id = %s", (other, target.id)
        )
        raise messaging.UnregisteredError("Old owner")

    worker(conn, send).process(uid, NOW)
    assert exists(conn, "push_devices", "id", target.id)


def test_switched_account_not_targeted(conn, users):
    uid, other = users(), users()
    settings(conn, uid)
    target = device(conn, users, uid)
    conn.execute(
        "UPDATE notification_browsers SET user_id = %s WHERE id = %s",
        (other, target.browser_id),
    )
    worker(conn, lambda _: pytest.fail("Wrong account targeted")).process(uid, NOW)


def test_retry_stops_after_three_attempts(conn, users):
    uid = users()
    settings(conn, uid)
    target = device(conn, users, uid)
    calls = []

    def failed(message):
        calls.append(message)
        raise exceptions.UnavailableError("FCM unavailable")

    instance = worker(conn, failed)
    # Backoff: 10 then 20 minutes; the third failure is final.
    for minutes in (0, 10, 30, 40, 60):
        at = NOW + timedelta(minutes=minutes)
        instance.clock = lambda at=at: at
        instance.process(uid, at)
    assert len(calls) == 3
    assert result(conn, uid, target.id)["status"] == "failed"
    assert log(conn, uid)["status"] == "failed"
    assert next_at(conn, uid) == TOMORROW_AT_20


def test_removed_retry_device_does_not_block_schedule(conn, users):
    uid = users()
    settings(conn, uid)
    target = device(conn, users, uid)

    def unavailable(_):
        raise exceptions.UnavailableError("Retry")

    instance = worker(conn, unavailable)
    instance.process(uid, NOW)
    conn.execute("DELETE FROM push_devices WHERE id = %s", (target.id,))
    instance.process(uid, NOW)
    assert result(conn, uid, target.id)["status"] == "detached"
    assert next_at(conn, uid) == TOMORROW_AT_20


def test_limit_caps_one_pass(conn, users):
    created = [users() for _ in range(3)]
    for uid in created:
        # Earlier than any other test user, so these are picked first.
        settings(conn, uid, next_reminder_at=datetime(2000, 1, 1, tzinfo=UTC))
    assert worker(conn).run_once(limit=2) == 2
    remaining = conn.execute(
        "SELECT count(*) AS n FROM notification_settings "
        "WHERE user_id = ANY(%s) AND next_reminder_at < %s",
        (created, datetime(2001, 1, 1, tzinfo=UTC)),
    ).fetchone()["n"]
    assert remaining == 1


def test_timezone_midnight_and_leap_day():
    assert next_reminder("00:10", datetime(2026, 10, 1, 17, 1, tzinfo=UTC)) == (
        datetime(2026, 10, 1, 17, 10, tzinfo=UTC)
    )
    assert next_reminder("20:00", datetime(2028, 2, 28, 13, tzinfo=UTC)) == (
        datetime(2028, 2, 29, 13, tzinfo=UTC)
    )


@pytest.mark.parametrize(
    "error",
    [
        exceptions.InvalidArgumentError("Payload"),
        exceptions.PermissionDeniedError("IAM"),
        exceptions.UnauthenticatedError("Auth"),
        ValueError("Invalid message"),
    ],
)
def test_permanent_errors_are_not_retried(conn, users, error):
    uid = users()
    settings(conn, uid)
    target = device(conn, users, uid)
    calls = []

    def send(message):
        calls.append(message)
        raise error

    instance = worker(conn, send)
    instance.process(uid, NOW)
    instance.clock = lambda: NOW + timedelta(minutes=10)
    instance.process(uid, NOW + timedelta(minutes=10))
    assert len(calls) == 1
    assert result(conn, uid, target.id)["status"] == "failed"
    assert result(conn, uid, target.id)["retry_at"] is None
    assert next_at(conn, uid) == TOMORROW_AT_20


@pytest.mark.parametrize(
    "error_type",
    [
        exceptions.UnavailableError,
        exceptions.InternalError,
        exceptions.ResourceExhaustedError,
        exceptions.DeadlineExceededError,
        TimeoutError,
        ConnectionError,
    ],
)
def test_transient_error_backoff(error_type):
    error = error_type("Temporary")
    assert retry_at(error, 1, NOW) == NOW + timedelta(minutes=10)
    assert retry_at(error, 2, NOW) == NOW + timedelta(minutes=20)
    assert retry_at(error, 3, NOW) is None


@pytest.mark.parametrize("header", ["1800", "Thu, 01 Oct 2026 13:40:00 GMT"])
def test_retry_after_is_respected(header):
    error = exceptions.ResourceExhaustedError(
        "Quota", http_response=SimpleNamespace(headers={"Retry-After": header})
    )
    assert retry_at(error, 1, NOW) == NOW + timedelta(minutes=30)


def test_message_persisted_across_retries_and_catalog_changes(conn, users, monkeypatch):
    uid = users()
    settings(conn, uid)
    first, second = device(conn, users, uid), device(conn, users, uid)
    messages = []

    def send(message):
        messages.append(message)
        if message.fid == second.fid and len(messages) <= 2:
            raise exceptions.UnavailableError("Retry")

    instance = worker(conn, send)
    instance.process(uid, NOW)
    stored = log(conn, uid)
    monkeypatch.setattr(
        reminders, "daily_message", lambda: pytest.fail("Message chosen again")
    )
    instance.clock = lambda: NOW + timedelta(minutes=10)
    instance.process(uid, NOW + timedelta(minutes=10))
    assert len(messages) == 3
    assert sum(m.fid == first.fid for m in messages) == 1
    assert all(m.notification.title == stored["message_title"] for m in messages)
    assert all(m.notification.body == stored["message_body"] for m in messages)


def test_expired_owner_cannot_send_record_cleanup_or_finish(conn, users):
    uid = users()
    settings(conn, uid)
    target = device(conn, users, uid)
    instance = worker(conn)
    claimed, day, attempt_id, _ = instance.claim(uid, NOW)
    linked, attempts = instance.preflight(uid, claimed, day, attempt_id, target.id)
    instance.clock = lambda: NOW + timedelta(minutes=6)
    assert instance.preflight(uid, claimed, day, attempt_id, target.id) is None
    before = (log(conn, uid), result(conn, uid, target.id))
    instance.record(uid, day, attempt_id, target.id, "unregistered", attempts, linked)
    instance.finish(uid, claimed, day, attempt_id, {target.id})
    assert (log(conn, uid), result(conn, uid, target.id)) == before
    assert exists(conn, "push_devices", "id", target.id)
    new_claim = instance.claim(uid, instance.clock())
    assert new_claim[2] != attempt_id
    before = (log(conn, uid), result(conn, uid, target.id))
    instance.record(uid, day, attempt_id, target.id, "sent", attempts, linked)
    instance.finish(uid, claimed, day, attempt_id, {target.id})
    assert (log(conn, uid), result(conn, uid, target.id)) == before


def test_old_logs_are_removed_after_90_days(conn, users):
    uid = users()
    for day in (TODAY - timedelta(days=91), TODAY - timedelta(days=90)):
        conn.execute(
            "INSERT INTO notification_logs (user_id, date, status, message_title, "
            "message_body) VALUES (%s, %s, 'sent', 'Title', 'Body')",
            (uid, day),
        )
    worker(conn).run_once(limit=0)
    assert log(conn, uid, TODAY - timedelta(days=91)) is None
    assert log(conn, uid, TODAY - timedelta(days=90)) is not None
