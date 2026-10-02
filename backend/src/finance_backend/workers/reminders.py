"""Independent ten-minute reminder worker; no HTTP server required.

Each due user gets one reminder run per scheduled day (the Vietnam date of
next_reminder_at), recorded in notification_logs. A run is leased to one
worker at a time and every step runs in its own database transaction with row
locks, so a second worker never sends the same run. Every device is sent to
at most MAX_ATTEMPTS times; a crash between a send and its record can repeat
that send once (the notification tag lets the browser collapse the two).
A reminder more than STALE_AFTER late is skipped rather than sent late.
"""

import hashlib
import logging
import re
import signal
import threading
import time
from datetime import UTC, date, datetime, timedelta
from email.utils import parsedate_to_datetime
from uuid import uuid4
from zoneinfo import ZoneInfo

from firebase_admin import exceptions, messaging

from finance_backend.integrations.firebase import get_firebase_app
from finance_backend.integrations.postgres import connect
from finance_backend.workers.reminder_messages import daily_message

LOGGER = logging.getLogger(__name__)
VIETNAM = ZoneInfo("Asia/Ho_Chi_Minh")
INTERVAL_SECONDS = 600
LEASE_DURATION = timedelta(minutes=5)
MAX_ATTEMPTS = 3
LOG_RETENTION_DAYS = 90
# Past this, a missed reminder (worker down, retries exhausted) is skipped.
STALE_AFTER = timedelta(hours=2)
# Debt request ids only guard against retries of a just-sent request.
OPERATION_RETENTION = timedelta(days=30)
# Browser rows without a device; far longer than a login session lasts.
BROWSER_RETENTION = timedelta(days=30)
# Daily housekeeping runs in the pass that starts in this Vietnam hour.
CLEANUP_HOUR = 3
# A claimed run only continues while these settings are unchanged.
SCHEDULE_COLUMNS = (
    "notifications_enabled",
    "daily_reminder_time",
    "time_zone",
    "next_reminder_at",
    "updated_at",
)


def owns_lease(log: dict | None, attempt_id, now: datetime) -> bool:
    return (
        log is not None
        and log["attempt_id"] == attempt_id
        and log["lease_until"] is not None
        and log["lease_until"] > now
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


def due(settings: dict | None, now: datetime) -> bool:
    scheduled = settings and settings["next_reminder_at"]
    return bool(settings and settings["notifications_enabled"] and scheduled) and (
        scheduled <= now
    )


def stale(settings: dict, now: datetime) -> bool:
    return now - settings["next_reminder_at"] > STALE_AFTER


def run_day(settings: dict) -> date:
    """The day a run belongs to: when it was scheduled, so a reminder due at
    23:55 and sent at 00:00 still counts for the day it was due."""
    return settings["next_reminder_at"].astimezone(VIETNAM).date()


def same_schedule(settings: dict | None, claimed: dict) -> bool:
    return settings is not None and all(
        settings[key] == claimed[key] for key in SCHEDULE_COLUMNS
    )


def reminder_time(settings: dict) -> str:
    return settings["daily_reminder_time"].strftime("%H:%M")


class ReminderWorker:
    def __init__(self, conn, send=None, clock=None):
        # An autocommit connection; each step opens its own transaction.
        self.conn = conn
        self.send = send or (
            lambda message: messaging.send(message, app=get_firebase_app())
        )
        self.clock = clock or (lambda: datetime.now(UTC))

    # --- Locked reads -------------------------------------------------------

    def _settings(self, cur, uid: str) -> dict | None:
        cur.execute(
            f"SELECT {', '.join(SCHEDULE_COLUMNS)} FROM notification_settings "
            "WHERE user_id = %s FOR UPDATE",
            (uid,),
        )
        return cur.fetchone()

    def _log(self, cur, uid: str, day: date) -> dict | None:
        cur.execute(
            "SELECT status, attempt_id, lease_until, message_title, message_body "
            "FROM notification_logs WHERE user_id = %s AND date = %s FOR UPDATE",
            (uid, day),
        )
        return cur.fetchone()

    def _result(self, cur, uid: str, day: date, device_id: str) -> dict | None:
        cur.execute(
            "SELECT status, attempts, retry_at FROM notification_log_devices "
            "WHERE user_id = %s AND date = %s AND device_id = %s",
            (uid, day, device_id),
        )
        return cur.fetchone()

    def _save_result(self, cur, uid, day, device_id, status, attempts, **extra):
        cur.execute(
            "INSERT INTO notification_log_devices "
            "(user_id, date, device_id, status, attempts, error_code, retry_at, "
            "updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (user_id, date, device_id) DO UPDATE SET "
            "status = EXCLUDED.status, attempts = EXCLUDED.attempts, "
            "error_code = EXCLUDED.error_code, retry_at = EXCLUDED.retry_at, "
            "updated_at = EXCLUDED.updated_at",
            (
                uid,
                day,
                device_id,
                status,
                attempts,
                extra.get("error_code"),
                extra.get("retry_time"),
                self.clock(),
            ),
        )

    def _bump_schedule(self, cur, uid: str, settings: dict, now: datetime) -> None:
        cur.execute(
            "UPDATE notification_settings SET next_reminder_at = %s WHERE user_id = %s",
            (next_reminder(reminder_time(settings), now), uid),
        )

    def linked_device(self, cur, uid: str, device_id: str) -> dict | None:
        """The device's FCM registration, if it is still linked to this user's
        browser session; registrations of other users or ended sessions are
        never targeted."""
        cur.execute(
            "SELECT d.fid, d.browser_id, d.updated_at, b.session_id "
            "FROM push_devices d "
            "JOIN notification_browsers b ON b.id = d.browser_id "
            "WHERE d.id = %s AND d.user_id = %s "
            "AND b.user_id = %s AND b.device_id = d.id",
            (device_id, uid, uid),
        )
        device = cur.fetchone()
        if device is None or not re.fullmatch(r"[A-Za-z0-9_-]{22}", device["fid"]):
            return None
        if hashlib.sha256(device["fid"].encode()).hexdigest() != device_id:
            return None
        return device

    # --- Steps --------------------------------------------------------------

    def claim(self, uid: str, now: datetime):
        with self.conn.transaction(), self.conn.cursor() as cur:
            settings = self._settings(cur, uid)
            if not due(settings, now):
                return None
            today = run_day(settings)
            log = self._log(cur, uid, today)
            # Never send a reminder long after it was due.
            if stale(settings, now) or (log and log["status"] in {"sent", "failed"}):
                self._bump_schedule(cur, uid, settings, now)
                return None
            if log and log["lease_until"] and log["lease_until"] > now:
                return None
            content = (
                {"title": log["message_title"], "body": log["message_body"]}
                if log
                else daily_message()
            )
            attempt_id = uuid4()
            cur.execute(
                "INSERT INTO notification_logs (user_id, date, status, attempt_id, "
                "lease_until, message_title, message_body, updated_at) "
                "VALUES (%s, %s, 'processing', %s, %s, %s, %s, %s) "
                "ON CONFLICT (user_id, date) DO UPDATE SET status = 'processing', "
                "attempt_id = EXCLUDED.attempt_id, "
                "lease_until = EXCLUDED.lease_until, updated_at = EXCLUDED.updated_at",
                (
                    uid,
                    today,
                    attempt_id,
                    now + LEASE_DURATION,
                    content["title"],
                    content["body"],
                    now,
                ),
            )
            return settings, today, attempt_id, content

    def preflight(self, uid, claimed, day, attempt_id, device_id):
        with self.conn.transaction(), self.conn.cursor() as cur:
            settings = self._settings(cur, uid)
            log = self._log(cur, uid, day)
            now = self.clock()
            if (
                not same_schedule(settings, claimed)
                or not settings["notifications_enabled"]
                or not owns_lease(log, attempt_id, now)
            ):
                return None
            if stale(claimed, now):
                return None
            previous = self._result(cur, uid, day, device_id)
            if previous and previous["status"] in {"sent", "unregistered", "failed"}:
                return None
            if (
                previous
                and previous["status"] == "retry"
                and (previous["retry_at"] or now) > now
            ):
                return None
            linked = self.linked_device(cur, uid, device_id)
            attempts = previous["attempts"] if previous else 0
            if linked is None:
                if previous and previous["status"] in {"retry", "sending"}:
                    self._save_result(cur, uid, day, device_id, "detached", attempts)
                return None
            cur.execute(
                "UPDATE notification_logs SET lease_until = %s "
                "WHERE user_id = %s AND date = %s",
                (now + LEASE_DURATION, uid, day),
            )
            self._save_result(cur, uid, day, device_id, "sending", attempts + 1)
            return linked, attempts + 1

    def record(
        self, uid, day, attempt_id, device_id, status, attempts, linked, **extra
    ):
        with self.conn.transaction(), self.conn.cursor() as cur:
            if not owns_lease(self._log(cur, uid, day), attempt_id, self.clock()):
                return
            if status == "unregistered":
                # Remove the registration only if it is still exactly the one
                # sent to; a re-registration, new browser session or new owner
                # since then is kept.
                cur.execute(
                    "DELETE FROM push_devices d USING notification_browsers b "
                    "WHERE d.id = %s AND d.user_id = %s AND d.fid = %s "
                    "AND d.browser_id = %s AND d.updated_at = %s "
                    "AND b.id = d.browser_id AND b.user_id = %s "
                    "AND b.device_id = d.id AND b.session_id = %s",
                    (
                        device_id,
                        uid,
                        linked["fid"],
                        linked["browser_id"],
                        linked["updated_at"],
                        uid,
                        linked["session_id"],
                    ),
                )
            self._save_result(cur, uid, day, device_id, status, attempts, **extra)

    def finish(self, uid, claimed, day, attempt_id, device_ids):
        with self.conn.transaction(), self.conn.cursor() as cur:
            settings = self._settings(cur, uid)
            log = self._log(cur, uid, day)
            now = self.clock()
            if not owns_lease(log, attempt_id, now):
                return
            # Devices removed during the run no longer hold it open.
            cur.execute(
                "UPDATE notification_log_devices SET status = 'detached', "
                "updated_at = %s WHERE user_id = %s AND date = %s "
                "AND status IN ('retry', 'sending') AND NOT (device_id = ANY(%s))",
                (now, uid, day, list(device_ids)),
            )
            cur.execute(
                "SELECT status FROM notification_log_devices "
                "WHERE user_id = %s AND date = %s",
                (uid, day),
            )
            results = [row["status"] for row in cur.fetchall()]
            pending = any(status in {"sending", "retry"} for status in results)
            status = (
                "retry"
                if pending
                else "sent"
                if "sent" in results
                else "failed"
                if results
                else "waiting"
            )
            cur.execute(
                "UPDATE notification_logs SET status = %s, attempt_id = NULL, "
                "lease_until = NULL, updated_at = %s WHERE user_id = %s AND date = %s",
                (status, now, uid, day),
            )
            if results and not pending and same_schedule(settings, claimed):
                self._bump_schedule(cur, uid, settings, now)

    def devices(self, uid: str) -> list[str]:
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM push_devices WHERE user_id = %s "
                "ORDER BY created_at, id",
                (uid,),
            )
            return [row["id"] for row in cur.fetchall()]

    def process(self, uid: str, now: datetime, stop=None) -> None:
        claim = self.claim(uid, now)
        if claim is None:
            return
        claimed, day, attempt_id, content = claim
        device_ids = self.devices(uid)
        for device_id in device_ids:
            # On shutdown, leave the rest: the lease expires and the next
            # pass resumes from the recorded results.
            if stop is not None and stop.is_set():
                return
            prepared = self.preflight(uid, claimed, day, attempt_id, device_id)
            if prepared is None:
                continue
            linked, attempts = prepared
            if attempts > MAX_ATTEMPTS:
                self.record(uid, day, attempt_id, device_id, "failed", attempts, linked)
                continue
            message = messaging.Message(
                fid=linked["fid"],
                notification=messaging.Notification(
                    title=content["title"], body=content["body"]
                ),
                data={"type": "daily-reminder", "date": day.isoformat()},
                webpush=messaging.WebpushConfig(
                    headers={"TTL": "600"},
                    notification=messaging.WebpushNotification(
                        tag=f"daily-reminder-{day.isoformat()}",
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
                error_code = str(getattr(error, "code", type(error).__name__))[:100]
                retry_time = retry_at(error, attempts, self.clock())
                status = "retry" if retry_time else "failed"
            self.record(
                uid,
                day,
                attempt_id,
                device_id,
                status,
                attempts,
                linked,
                error_code=error_code,
                retry_time=retry_time,
            )
        self.finish(uid, claimed, day, attempt_id, device_ids)

    def cleanup(self, now: datetime) -> None:
        """Daily housekeeping: old reminder logs, debt request ids and browser
        rows that no longer hold a device."""
        cutoff = now.astimezone(VIETNAM).date() - timedelta(days=LOG_RETENTION_DAYS)
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM notification_logs WHERE date < %s", (cutoff,))
            cur.execute(
                "DELETE FROM debt_operations WHERE created_at < %s",
                (now - OPERATION_RETENTION,),
            )
            cur.execute(
                "DELETE FROM notification_browsers "
                "WHERE device_id IS NULL AND updated_at < %s",
                (now - BROWSER_RETENTION,),
            )

    def run_once(self, *, dry_run=False, limit=100, stop=None):
        now = self.clock()
        with self.conn.cursor() as cur:
            # Users not yet tried for their due run come first; those already
            # tried (no device yet, waiting to retry) go last, so they cannot
            # fill every pass and hold back users who just became due.
            cur.execute(
                "SELECT s.user_id FROM notification_settings s "
                "LEFT JOIN notification_logs l ON l.user_id = s.user_id "
                "AND l.date = (s.next_reminder_at AT TIME ZONE %s)::date "
                "WHERE s.notifications_enabled AND s.next_reminder_at <= %s "
                "ORDER BY l.updated_at NULLS FIRST, s.next_reminder_at, s.user_id "
                "LIMIT %s",
                (VIETNAM.key, now, limit),
            )
            due_users = [row["user_id"] for row in cur.fetchall()]
        for uid in due_users:
            if stop is not None and stop.is_set():
                break
            if dry_run:
                with self.conn.cursor() as cur:
                    linked = sum(
                        self.linked_device(cur, uid, device_id) is not None
                        for device_id in self.devices(uid)
                    )
                LOGGER.info(
                    "Preview due reminder: user=%s linked_devices=%d", uid, linked
                )
                continue
            try:
                self.process(uid, self.clock(), stop)
            except Exception as error:
                LOGGER.error(
                    "Reminder processing failed: user=%s error=%s",
                    uid,
                    type(error).__name__,
                )
        if (
            not dry_run
            and now.astimezone(VIETNAM).hour == CLEANUP_HOUR
            and (now.astimezone(VIETNAM).minute < INTERVAL_SECONDS // 60)
        ):
            self.cleanup(now)
        LOGGER.info(
            "Reminder pass completed: settings=%d dry_run=%s", len(due_users), dry_run
        )
        return len(due_users)


def run(*, once=False, dry_run=False, limit=100):
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )

    stop = threading.Event()

    def run_pass():
        # A fresh connection per pass survives database restarts.
        with connect(autocommit=True) as conn:
            ReminderWorker(conn).run_once(dry_run=dry_run, limit=limit, stop=stop)

    if once:
        run_pass()
        return
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: stop.set())
    while not stop.is_set():
        try:
            run_pass()
        except Exception as error:
            LOGGER.error(
                "Reminder pass failed (%s); check DATABASE_URL and credentials",
                type(error).__name__,
            )
        # Align subsequent passes to :00, :10, :20, :30, :40 and :50.
        stop.wait(INTERVAL_SECONDS - time.time() % INTERVAL_SECONDS)
