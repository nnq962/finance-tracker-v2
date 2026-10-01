"""Independent ten-minute reminder worker; no HTTP server required."""

import hashlib
import logging
import re
import signal
import threading
import time
from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
from uuid import uuid4
from zoneinfo import ZoneInfo

from firebase_admin import exceptions, firestore, messaging
from google.cloud.firestore_v1.base_query import FieldFilter

from finance_backend.integrations.firebase import get_firebase_app, get_firestore
from finance_backend.workers.reminder_messages import daily_message

LOGGER = logging.getLogger(__name__)
VIETNAM = ZoneInfo("Asia/Ho_Chi_Minh")
INTERVAL_SECONDS = 600
LEASE_DURATION = timedelta(minutes=5)
MAX_ATTEMPTS = 3


def owns_lease(log: dict, attempt_id: str, now: datetime) -> bool:
    until = log.get("leaseUntil")
    return (
        log.get("attemptId") == attempt_id
        and isinstance(until, datetime)
        and until > now
    )


def retry_at(error: Exception, attempts: int, now: datetime) -> datetime | None:
    code = getattr(error, "code", None)
    if not isinstance(error, (TimeoutError, ConnectionError)) and not (
        isinstance(error, exceptions.FirebaseError)
        and code
        in {"UNAVAILABLE", "INTERNAL", "RESOURCE_EXHAUSTED", "DEADLINE_EXCEEDED"}
    ):
        return None
    if attempts >= MAX_ATTEMPTS:
        return None
    result = now + timedelta(seconds=INTERVAL_SECONDS * 2 ** (attempts - 1))
    response = getattr(error, "http_response", None)
    header = response.headers.get("Retry-After") if response is not None else None
    if header:
        try:
            requested = now + timedelta(seconds=max(0, int(header)))
        except ValueError:
            try:
                requested = parsedate_to_datetime(header)
                if requested.tzinfo is None:
                    requested = requested.replace(tzinfo=UTC)
            except (ValueError, TypeError, OverflowError):
                return result
        result = max(result, requested)
    return result


def next_reminder(time_text: str, now: datetime) -> datetime:
    if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", time_text):
        raise ValueError("Invalid reminder time")
    hour, minute = map(int, time_text.split(":"))
    local = now.astimezone(VIETNAM)
    result = local.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if result <= local:
        result += timedelta(days=1)
    return result.astimezone(UTC)


def settings_user(ref) -> str | None:
    parts = ref.path.split("/")
    if (
        len(parts) == 4
        and parts[0] == "users"
        and parts[2:]
        == [
            "notificationSettings",
            "default",
        ]
    ):
        return parts[1]
    return None


def due(settings: dict, now: datetime) -> bool:
    scheduled = settings.get("nextReminderAt")
    return (
        settings.get("notificationsEnabled") is True
        and isinstance(scheduled, datetime)
        and scheduled.tzinfo is not None
        and scheduled <= now
    )


def same_schedule(settings: dict, claimed: dict) -> bool:
    return all(
        settings.get(key) == claimed.get(key)
        for key in (
            "notificationsEnabled",
            "dailyReminderTime",
            "timeZone",
            "nextReminderAt",
            "updatedAt",
        )
    )


class ReminderWorker:
    def __init__(self, db, send=None, clock=None):
        self.db = db
        self.send = send or (
            lambda message: messaging.send(message, app=get_firebase_app())
        )
        self.clock = clock or (lambda: datetime.now(UTC))

    def claim(self, ref, now):
        uid = settings_user(ref)
        if uid is None:
            return None
        log_ref = self.db.document(
            f"users/{uid}/notificationLogs/{now.astimezone(VIETNAM).date()}"
        )

        @firestore.transactional
        def acquire(tx):
            settings = ref.get(transaction=tx).to_dict() or {}
            log = log_ref.get(transaction=tx).to_dict() or {}
            if not due(settings, now):
                return None
            # Never replay reminders from previous calendar days.
            if settings["nextReminderAt"].astimezone(VIETNAM).date() < (
                now.astimezone(VIETNAM).date()
            ) or log.get("status") in {"sent", "failed"}:
                tx.update(
                    ref,
                    {
                        "nextReminderAt": next_reminder(
                            settings["dailyReminderTime"], now
                        ),
                    },
                )
                return None
            if log.get("leaseUntil", datetime.min.replace(tzinfo=UTC)) > now:
                return None
            content = log.get("message") or daily_message()
            attempt_id = str(uuid4())
            tx.set(
                log_ref,
                {
                    "status": "processing",
                    "attemptId": attempt_id,
                    "message": content,
                    "leaseUntil": now + LEASE_DURATION,
                    "updatedAt": now,
                },
                merge=True,
            )
            return (
                settings,
                log_ref,
                attempt_id,
                (content),
            )

        return acquire(self.db.transaction())

    def linked_device(self, uid, device_ref, *, tx=None):
        device = device_ref.get(transaction=tx).to_dict() or {}
        fid, browser_id = device.get("fid"), device.get("browserId")
        if not isinstance(fid, str) or not re.fullmatch(r"[A-Za-z0-9_-]{22}", fid):
            return None
        if hashlib.sha256(fid.encode()).hexdigest() != device_ref.id:
            return None
        if not isinstance(browser_id, str) or not re.fullmatch(
            r"[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}", browser_id
        ):
            return None
        owner_ref = self.db.document(f"pushInstallations/{device_ref.id}")
        browser_ref = self.db.document(f"notificationBrowsers/{browser_id}")
        owner = owner_ref.get(transaction=tx).to_dict() or {}
        browser = browser_ref.get(transaction=tx).to_dict() or {}
        if owner.get("uid") != uid or owner.get("browserId") != browser_id:
            return None
        if browser.get("uid") != uid or browser.get("deviceId") != device_ref.id:
            return None
        return device, browser, owner_ref, browser_ref

    def preflight(self, ref, claimed, log_ref, attempt_id, device_ref):
        @firestore.transactional
        def prepare(tx):
            settings = ref.get(transaction=tx).to_dict() or {}
            log = log_ref.get(transaction=tx).to_dict() or {}
            if (
                not same_schedule(settings, claimed)
                or not settings.get("notificationsEnabled")
                or not owns_lease(log, attempt_id, self.clock())
            ):
                return None
            if self.clock().astimezone(VIETNAM).date().isoformat() != log_ref.id:
                return None
            previous = log.get("devices", {}).get(device_ref.id, {})
            if previous.get("status") in {"sent", "unregistered", "failed"}:
                return None
            if (
                previous.get("status") == "retry"
                and previous.get("retryAt", self.clock()) > self.clock()
            ):
                return None
            linked = self.linked_device(settings_user(ref), device_ref, tx=tx)
            if linked is None:
                if previous.get("status") in {"retry", "sending"}:
                    tx.update(
                        log_ref,
                        {
                            f"devices.{device_ref.id}": {
                                "status": "detached",
                                "attempts": previous.get("attempts", 0),
                            },
                        },
                    )
                return None
            count = previous.get("attempts", 0) + 1
            tx.update(
                log_ref,
                {
                    "leaseUntil": self.clock() + LEASE_DURATION,
                    f"devices.{device_ref.id}": {
                        "status": "sending",
                        "attempts": count,
                    },
                },
            )
            return linked, count

        return prepare(self.db.transaction())

    def record(
        self,
        log_ref,
        attempt_id,
        device_ref,
        status,
        attempts,
        linked,
        *,
        error_code=None,
        retry_time=None,
    ):
        @firestore.transactional
        def save(tx):
            log = log_ref.get(transaction=tx).to_dict() or {}
            if not owns_lease(log, attempt_id, self.clock()):
                return
            # Read all cleanup dependencies before issuing any write.
            current = (
                self.linked_device(device_ref.parent.parent.id, device_ref, tx=tx)
                if status == "unregistered"
                else None
            )
            if current and current[0] == linked[0] and current[1] == linked[1]:
                tx.delete(device_ref)
                tx.delete(current[2])
                tx.update(current[3], {"deviceId": None, "updatedAt": self.clock()})
            tx.update(
                log_ref,
                {
                    f"devices.{device_ref.id}": {
                        "status": status,
                        "attempts": attempts,
                        "updatedAt": self.clock(),
                        **({"errorCode": error_code} if error_code else {}),
                        **({"retryAt": retry_time} if retry_time else {}),
                    },
                },
            )

        save(self.db.transaction())

    def finish(self, ref, claimed, log_ref, attempt_id, device_ids):
        @firestore.transactional
        def complete(tx):
            settings = ref.get(transaction=tx).to_dict() or {}
            log = log_ref.get(transaction=tx).to_dict() or {}
            if not owns_lease(log, attempt_id, self.clock()):
                return
            results = log.get("devices", {})
            for device_id, result in results.items():
                if device_id not in device_ids and result.get("status") in {
                    "retry",
                    "sending",
                }:
                    result["status"] = "detached"
            results_list = list(results.values())
            pending = any(r.get("status") in {"sending", "retry"} for r in results_list)
            status = (
                "retry"
                if pending
                else (
                    "sent"
                    if any(r.get("status") == "sent" for r in results_list)
                    else "failed"
                    if results
                    else "waiting"
                )
            )
            tx.update(
                log_ref,
                {
                    "status": status,
                    "devices": results,
                    "leaseUntil": firestore.DELETE_FIELD,
                    "updatedAt": self.clock(),
                },
            )
            if results and not pending and same_schedule(settings, claimed):
                tx.update(
                    ref,
                    {
                        "nextReminderAt": next_reminder(
                            settings["dailyReminderTime"],
                            self.clock(),
                        ),
                    },
                )

        complete(self.db.transaction())

    def process(self, ref, now):
        claim = self.claim(ref, now)
        if claim is None:
            return
        claimed, log_ref, attempt_id, content = claim
        uid = settings_user(ref)
        devices = self.db.collection(f"users/{uid}/pushDevices")
        snapshots = list(devices.stream())
        for snapshot in snapshots:
            prepared = self.preflight(
                ref,
                claimed,
                log_ref,
                attempt_id,
                snapshot.reference,
            )
            if prepared is None:
                continue
            linked, attempts = prepared
            if attempts > MAX_ATTEMPTS:
                self.record(
                    log_ref, attempt_id, snapshot.reference, "failed", attempts, linked
                )
                continue
            message = messaging.Message(
                fid=linked[0]["fid"],
                notification=messaging.Notification(
                    title=content["title"], body=content["body"]
                ),
                data={"type": "daily-reminder", "date": log_ref.id},
                webpush=messaging.WebpushConfig(
                    headers={"TTL": "600"},
                    notification=messaging.WebpushNotification(
                        tag=f"daily-reminder-{log_ref.id}",
                    ),
                ),
            )
            error_code, retry_time = None, None
            try:
                self.send(message)
                status = "sent"
            except messaging.UnregisteredError:
                error_code = "UNREGISTERED"
                status = "unregistered"
            except Exception as error:
                # Avoid logging payloads, FIDs or service-account contents.
                LOGGER.warning("FCM send failed (%s)", type(error).__name__)
                error_code = getattr(error, "code", type(error).__name__)
                retry_time = retry_at(error, attempts, self.clock())
                status = "retry" if retry_time else "failed"
            self.record(
                log_ref,
                attempt_id,
                snapshot.reference,
                status,
                attempts,
                linked,
                error_code=error_code,
                retry_time=retry_time,
            )
        self.finish(ref, claimed, log_ref, attempt_id, {s.id for s in snapshots})

    def run_once(self, *, dry_run=False, limit=100):
        now = self.clock()
        query = (
            self.db.collection_group("notificationSettings")
            .where(filter=FieldFilter("notificationsEnabled", "==", True))
            .where(filter=FieldFilter("nextReminderAt", "<=", now))
            .order_by("nextReminderAt")
        )
        # Snapshot pagination preserves the cursor even when processed schedules move.
        count, cursor = 0, None
        while count < limit:
            page = query.start_after(cursor) if cursor else query
            snapshots = list(page.limit(min(25, limit - count)).stream())
            if not snapshots:
                break
            for snapshot in snapshots:
                uid = settings_user(snapshot.reference)
                if uid:
                    if dry_run:
                        linked = sum(
                            self.linked_device(uid, device.reference) is not None
                            for device in self.db.collection(
                                f"users/{uid}/pushDevices"
                            ).stream()
                        )
                        LOGGER.info(
                            "Preview due reminder: user=%s linked_devices=%d",
                            uid,
                            linked,
                        )
                    else:
                        try:
                            self.process(snapshot.reference, self.clock())
                        except Exception as error:
                            LOGGER.error(
                                "Reminder processing failed: user=%s error=%s",
                                uid,
                                type(error).__name__,
                            )
                count += 1
            cursor = snapshots[-1]
        LOGGER.info("Reminder pass completed: settings=%d dry_run=%s", count, dry_run)
        return count


def run(*, once=False, dry_run=False, limit=100):
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )
    worker = ReminderWorker(get_firestore())
    if once:
        worker.run_once(dry_run=dry_run, limit=limit)
        return
    stop = threading.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: stop.set())
    while not stop.is_set():
        try:
            worker.run_once(dry_run=dry_run, limit=limit)
        except Exception as error:
            LOGGER.error(
                "Reminder query failed (%s); check credentials/index",
                type(error).__name__,
            )
        # Align subsequent passes to :00, :10, :20, :30, :40 and :50.
        stop.wait(INTERVAL_SECONDS - time.time() % INTERVAL_SECONDS)
