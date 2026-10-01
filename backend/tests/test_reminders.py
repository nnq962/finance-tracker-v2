"""Deterministic worker checks without credentials, Firestore or FCM calls."""

import copy
import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from firebase_admin import exceptions, firestore, messaging

from finance_backend.workers.reminders import ReminderWorker, next_reminder

NOW = datetime(2026, 10, 1, 13, 10, tzinfo=UTC)


class Snapshot:
    def __init__(self, ref):
        self.reference = ref
        self.id = ref.id
        self.data = copy.deepcopy(ref.db.data.get(ref.path))

    def to_dict(self):
        return copy.deepcopy(self.data)


class Ref:
    def __init__(self, db, path):
        self.db, self.path = db, path
        self.id = path.split("/")[-1]

    @property
    def parent(self):
        return Ref(self.db, self.path.rsplit("/", 1)[0])

    def get(self, transaction=None):
        if transaction:
            assert not transaction.writes, "Firestore disallows reads after writes"
        return Snapshot(self)


class Query:
    def __init__(self, db, path=None):
        self.db, self.path = db, path
        self.filters = []
        self.cursor = None
        self.maximum = 1000

    def where(self, *, filter):
        query = copy.copy(self)
        query.filters = [*self.filters, filter]
        return query

    def order_by(self, field):
        return self

    def start_after(self, snapshot):
        query = copy.copy(self)
        query.cursor = (snapshot.data["nextReminderAt"], snapshot.reference.path)
        return query

    def limit(self, maximum):
        query = copy.copy(self)
        query.maximum = maximum
        return query

    def stream(self):
        results = []
        for path, data in self.db.data.items():
            if self.path:
                if path.rsplit("/", 1)[0] != self.path:
                    continue
            elif path.split("/")[-2] != "notificationSettings":
                continue
            matches = True
            for condition in self.filters:
                value = data.get(condition.field_path)
                if condition.op_string == "==":
                    matches &= value == condition.value
                elif condition.op_string == "<=":
                    matches &= value is not None and value <= condition.value
            if matches:
                results.append(Snapshot(self.db.document(path)))
        if not self.path:
            results.sort(key=lambda s: (s.data["nextReminderAt"], s.reference.path))
            if self.cursor:
                results = [
                    s
                    for s in results
                    if (s.data["nextReminderAt"], s.reference.path) > self.cursor
                ]
        return iter(results[: self.maximum])


class Transaction:
    def __init__(self, db):
        self.db, self.writes = db, False

    def set(self, ref, data, merge=False):
        self.writes = True
        if not merge:
            self.db.data[ref.path] = {}
        self.db.data.setdefault(ref.path, {}).update(copy.deepcopy(data))

    def update(self, ref, data):
        self.writes = True
        target = self.db.data[ref.path]
        for field, value in data.items():
            current = target
            parts = field.split(".")
            for part in parts[:-1]:
                current = current.setdefault(part, {})
            if value is firestore.DELETE_FIELD:
                current.pop(parts[-1], None)
            else:
                current[parts[-1]] = copy.deepcopy(value)

    def delete(self, ref):
        self.writes = True
        self.db.data.pop(ref.path, None)


class Database:
    def __init__(self):
        self.data = {}
        self.lock = threading.RLock()

    def document(self, path):
        return Ref(self, path)

    def collection(self, path):
        return Query(self, path)

    def collection_group(self, group):
        assert group == "notificationSettings"
        return Query(self)

    def transaction(self):
        return Transaction(self)


@pytest.fixture
def db(monkeypatch):
    database = Database()

    def transactional(function):
        def run(tx):
            with database.lock:
                return function(tx)

        return run

    monkeypatch.setattr(firestore, "transactional", transactional)
    return database


def settings(db, uid="a", **changes):
    ref = db.document(f"users/{uid}/notificationSettings/default")
    db.data[ref.path] = {
        "notificationsEnabled": True,
        "dailyReminderTime": "20:00",
        "timeZone": "Asia/Ho_Chi_Minh",
        "nextReminderAt": NOW - timedelta(minutes=10),
        "updatedAt": NOW - timedelta(hours=1),
        **changes,
    }
    return ref


def device(db, uid="a"):
    fid = "c" + uuid4().hex[:21]
    device_id = hashlib.sha256(fid.encode()).hexdigest()
    browser_id = str(uuid4())
    ref = db.document(f"users/{uid}/pushDevices/{device_id}")
    db.data[ref.path] = {"fid": fid, "browserId": browser_id, "updatedAt": NOW}
    db.data[f"pushInstallations/{device_id}"] = {"uid": uid, "browserId": browser_id}
    db.data[f"notificationBrowsers/{browser_id}"] = {
        "uid": uid,
        "deviceId": device_id,
        "sessionId": str(uuid4()),
    }
    return ref


def worker(db, send=None):
    return ReminderWorker(db, send=send or (lambda _: None), clock=lambda: NOW)


def test_due_query_and_preview_never_write_or_send(db):
    settings(db)
    device(db)
    settings(db, "disabled", notificationsEnabled=False)
    settings(db, "future", nextReminderAt=NOW + timedelta(minutes=1))
    settings(db, "legacy", nextReminderAt=None)
    original = copy.deepcopy(db.data)
    assert worker(db, lambda _: pytest.fail("FCM invoked")).run_once(dry_run=True) == 1
    assert db.data == original


def test_multi_device_send_and_daily_dedup(db):
    ref = settings(db)
    device(db)
    device(db)
    messages = []
    instance = worker(db, messages.append)
    assert instance.run_once() == 1
    assert len(messages) == 2
    assert all(m.fid and m.token is None for m in messages)
    assert db.data[ref.path]["nextReminderAt"] == datetime(2026, 10, 2, 13, tzinfo=UTC)
    instance.process(ref, NOW)
    assert len(messages) == 2


def test_claim_is_exclusive_and_expired_lease_recovers(db):
    ref = settings(db)
    instance = worker(db)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: instance.claim(ref, NOW), range(2)))
    assert sum(r is not None for r in results) == 1
    assert instance.claim(ref, NOW + timedelta(minutes=6)) is not None


def test_retry_only_failed_device(db):
    ref = settings(db)
    first, second = device(db), device(db)
    seen = []

    def send(message):
        seen.append(message.fid)
        if message.fid == db.data[second.path]["fid"] and seen.count(message.fid) == 1:
            raise exceptions.UnavailableError("Temporary failure")

    instance = worker(db, send)
    instance.run_once()
    assert db.data[ref.path]["nextReminderAt"] <= NOW
    instance.run_once()
    assert len(seen) == 2  # Not due for a retry yet.
    instance.clock = lambda: NOW + timedelta(minutes=10)
    instance.run_once()
    assert seen.count(db.data[first.path]["fid"]) == 1
    assert seen.count(db.data[second.path]["fid"]) == 2
    assert db.data[ref.path]["nextReminderAt"] > NOW


def test_disabled_or_edited_after_claim_cannot_send(db):
    ref = settings(db)
    target = device(db)
    instance = worker(db)
    claimed, log_ref, attempt_id, _ = instance.claim(ref, NOW)
    db.data[ref.path]["notificationsEnabled"] = False
    assert instance.preflight(ref, claimed, log_ref, attempt_id, target) is None
    db.data[ref.path]["notificationsEnabled"] = True
    db.data[ref.path]["updatedAt"] = NOW
    assert instance.preflight(ref, claimed, log_ref, attempt_id, target) is None


def test_old_day_is_skipped_and_missing_device_is_not_sent(db):
    ref = settings(db, nextReminderAt=NOW - timedelta(days=1))
    assert worker(db).claim(ref, NOW) is None
    assert db.data[ref.path]["nextReminderAt"] > NOW
    ref = settings(db)
    worker(db).run_once()
    assert db.data[ref.path]["nextReminderAt"] <= NOW
    assert db.data["users/a/notificationLogs/2026-10-01"]["status"] == "waiting"


def test_unregistered_cleanup_and_ownership_transfer(db):
    settings(db)
    target = device(db)
    original = copy.deepcopy(db.data[target.path])

    def unregistered(_):
        raise messaging.UnregisteredError("Gone")

    worker(db, unregistered).run_once()
    assert target.path not in db.data
    assert f"pushInstallations/{target.id}" not in db.data
    assert db.data[f"notificationBrowsers/{original['browserId']}"]["deviceId"] is None


def test_cleanup_does_not_delete_new_registration(db):
    settings(db)
    target = device(db)

    def refreshed(_):
        db.data[target.path]["updatedAt"] = NOW + timedelta(seconds=1)
        raise messaging.UnregisteredError("Old registration")

    worker(db, refreshed).run_once()
    assert target.path in db.data


def test_switched_account_not_targeted(db):
    settings(db)
    target = device(db)
    db.data[f"pushInstallations/{target.id}"]["uid"] = "b"
    worker(db, lambda _: pytest.fail("Wrong account targeted")).run_once()


def test_retry_stops_after_three_attempts(db):
    ref = settings(db)
    device(db)
    calls = []

    def failed(message):
        calls.append(message)
        raise exceptions.UnavailableError("FCM unavailable")

    instance = worker(db, failed)
    for minutes in (0, 10, 20, 30, 40):
        instance.clock = lambda minutes=minutes: NOW + timedelta(minutes=minutes)
        instance.run_once()
    assert len(calls) == 3
    assert db.data[ref.path]["nextReminderAt"] > NOW


def test_removed_retry_device_does_not_block_schedule(db):
    ref = settings(db)
    target = device(db)
    instance = worker(
        db, lambda _: (_ for _ in ()).throw(exceptions.UnavailableError("Retry"))
    )
    instance.run_once()
    del db.data[target.path]
    instance.run_once()
    assert db.data[ref.path]["nextReminderAt"] > NOW


def test_pagination_and_limit(db):
    for i in range(30):
        settings(db, f"user{i:02d}")
        device(db, f"user{i:02d}")
    assert worker(db).run_once(limit=27) == 27
    assert worker(db).run_once() == 3


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
def test_permanent_errors_are_not_retried(db, error):
    ref = settings(db)
    target = device(db)
    calls = []

    def send(message):
        calls.append(message)
        raise error

    instance = worker(db, send)
    instance.run_once()
    instance.clock = lambda: NOW + timedelta(minutes=10)
    instance.run_once()
    assert len(calls) == 1
    log = db.data["users/a/notificationLogs/2026-10-01"]
    assert log["devices"][target.id]["status"] == "failed"
    assert "retryAt" not in log["devices"][target.id]
    assert db.data[ref.path]["nextReminderAt"] > NOW


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
    from finance_backend.workers.reminders import retry_at

    error = error_type("Temporary")
    assert retry_at(error, 1, NOW) == NOW + timedelta(minutes=10)
    assert retry_at(error, 2, NOW) == NOW + timedelta(minutes=20)
    assert retry_at(error, 3, NOW) is None


@pytest.mark.parametrize("header", ["1800", "Thu, 01 Oct 2026 13:40:00 GMT"])
def test_retry_after_is_respected(header):
    from types import SimpleNamespace

    from finance_backend.workers.reminders import retry_at

    error = exceptions.ResourceExhaustedError(
        "Quota", http_response=SimpleNamespace(headers={"Retry-After": header})
    )
    assert retry_at(error, 1, NOW) == NOW + timedelta(minutes=30)


def test_message_persisted_across_retries_and_catalog_changes(db, monkeypatch):
    import finance_backend.workers.reminders as reminders

    settings(db)
    first, second = device(db), device(db)
    messages = []

    def send(message):
        messages.append(message)
        if message.fid == db.data[second.path]["fid"] and len(messages) <= 2:
            raise exceptions.UnavailableError("Retry")

    instance = worker(db, send)
    instance.run_once()
    original = copy.deepcopy(db.data["users/a/notificationLogs/2026-10-01"]["message"])
    monkeypatch.setattr(
        reminders, "daily_message", lambda: pytest.fail("Message chosen again")
    )
    instance.clock = lambda: NOW + timedelta(minutes=10)
    instance.run_once()
    assert len(messages) == 3
    assert sum(m.fid == db.data[first.path]["fid"] for m in messages) == 1
    assert all(m.notification.title == original["title"] for m in messages)
    assert all(m.notification.body == original["body"] for m in messages)


def test_expired_owner_cannot_send_record_cleanup_or_finish(db):
    ref = settings(db)
    target = device(db)
    instance = worker(db)
    claimed, log_ref, attempt_id, _ = instance.claim(ref, NOW)
    linked, attempts = instance.preflight(ref, claimed, log_ref, attempt_id, target)
    instance.clock = lambda: NOW + timedelta(minutes=6)
    assert instance.preflight(ref, claimed, log_ref, attempt_id, target) is None
    original = copy.deepcopy(db.data)
    instance.record(log_ref, attempt_id, target, "unregistered", attempts, linked)
    instance.finish(ref, claimed, log_ref, attempt_id, {target.id})
    assert db.data == original
    new_claim = instance.claim(ref, instance.clock())
    assert new_claim[2] != attempt_id
    original = copy.deepcopy(db.data)
    instance.record(log_ref, attempt_id, target, "sent", attempts, linked)
    instance.finish(ref, claimed, log_ref, attempt_id, {target.id})
    assert db.data == original


def test_cleanup_preserves_changed_browser_session(db):
    settings(db)
    target = device(db)
    browser_path = f"notificationBrowsers/{db.data[target.path]['browserId']}"

    def send(_):
        db.data[browser_path]["sessionId"] = str(uuid4())
        raise messaging.UnregisteredError("Old session")

    worker(db, send).run_once()
    assert target.path in db.data
    assert f"pushInstallations/{target.id}" in db.data
    assert db.data[browser_path]["deviceId"] == target.id


def test_cleanup_preserves_transferred_owner(db):
    settings(db)
    target = device(db)

    def send(_):
        db.data[f"pushInstallations/{target.id}"]["uid"] = "b"
        raise messaging.UnregisteredError("Old owner")

    worker(db, send).run_once()
    assert target.path in db.data
    assert db.data[f"pushInstallations/{target.id}"]["uid"] == "b"
