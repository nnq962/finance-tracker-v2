"""Pushes the admin's broadcasts ("Tin từ Timi") to devices, every minute.

The web app writes a broadcast (db: broadcasts). One sent now is released at
once by the web app; one set for later is released here once due: the SQL
function release_broadcast writes its recipients and one delivery per linked
device of those who have not turned "Tin từ Timi" off. This worker then
pushes the deliveries in batches of up to 500 (FCM send_each), each recorded
in broadcast_deliveries. A broadcast's push run is leased to one worker at a
time, as the daily reminders are; a crash between a send and its record can
repeat that send once (the notification tag lets the browser collapse the
two). Temporary FCM errors are retried as for reminders; a registration FCM
no longer knows is removed; a broadcast taken back stops being pushed.
"""

import logging
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from firebase_admin import messaging

from finance_backend.integrations.firebase import get_firebase_app
from finance_backend.workers.reminders import MAX_ATTEMPTS, retry_at

LOGGER = logging.getLogger(__name__)
BATCH_SIZE = 500
LEASE_DURATION = timedelta(minutes=5)
# A day: news a phone was off for is still worth showing when it is back.
PUSH_TTL = "86400"


class BroadcastWorker:
    def __init__(self, conn, send_each=None, clock=None):
        # An autocommit connection; each step opens its own transaction.
        self.conn = conn
        self.send_each = send_each or (
            lambda messages: messaging.send_each(messages, app=get_firebase_app())
        )
        self.clock = clock or (lambda: datetime.now(UTC))

    # --- Releasing ----------------------------------------------------------

    def release_due(self, limit: int = 20) -> int:
        """Sends the broadcasts set for a moment that has come."""
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM broadcasts WHERE status = 'scheduled' "
                "AND revoked_at IS NULL AND send_at <= now() "
                "ORDER BY send_at LIMIT %s",
                (limit,),
            )
            ids = [row["id"] for row in cur.fetchall()]
        released = 0
        for broadcast_id in ids:
            with self.conn.transaction(), self.conn.cursor() as cur:
                cur.execute("SELECT release_broadcast(%s) AS done", (broadcast_id,))
                released += bool(cur.fetchone()["done"])
        return released

    # --- Pushing ------------------------------------------------------------

    def claim(self, broadcast_id, now: datetime):
        with self.conn.transaction(), self.conn.cursor() as cur:
            cur.execute(
                "SELECT title, body, push_url, status, revoked_at, lease_until "
                "FROM broadcasts WHERE id = %s FOR UPDATE",
                (broadcast_id,),
            )
            row = cur.fetchone()
            if (
                row is None
                or row["status"] != "sending"
                or row["revoked_at"] is not None
                or (row["lease_until"] and row["lease_until"] > now)
            ):
                return None
            attempt_id = uuid4()
            cur.execute(
                "UPDATE broadcasts SET attempt_id = %s, lease_until = %s WHERE id = %s",
                (attempt_id, now + LEASE_DURATION, broadcast_id),
            )
            return attempt_id, row

    def _owns(self, cur, broadcast_id, attempt_id) -> bool:
        cur.execute(
            "SELECT attempt_id, lease_until, revoked_at, status FROM broadcasts "
            "WHERE id = %s FOR UPDATE",
            (broadcast_id,),
        )
        row = cur.fetchone()
        return (
            row is not None
            and row["attempt_id"] == attempt_id
            and row["lease_until"] > self.clock()
            and row["revoked_at"] is None
            and row["status"] == "sending"
        )

    def next_batch(self, broadcast_id, attempt_id):
        """The next deliveries due, each counted as tried before it is sent.
        Devices gone or unlinked since, and users who turned "Tin từ Timi"
        off since, are skipped."""
        now = self.clock()
        with self.conn.transaction(), self.conn.cursor() as cur:
            if not self._owns(cur, broadcast_id, attempt_id):
                return None
            cur.execute(
                "UPDATE broadcast_deliveries bd SET status = 'skipped', "
                "retry_at = NULL, updated_at = %s "
                "WHERE bd.broadcast_id = %s AND bd.status IN ('pending', 'retry') "
                "AND (NOT EXISTS (SELECT 1 FROM push_devices d "
                "  JOIN notification_browsers nb ON nb.id = d.browser_id "
                "  AND nb.user_id = d.user_id AND nb.device_id = d.id "
                "  WHERE d.id = bd.device_id AND d.user_id = bd.user_id) "
                "OR EXISTS (SELECT 1 FROM notification_settings s "
                "  WHERE s.user_id = bd.user_id AND NOT s.broadcasts_enabled))",
                (now, broadcast_id),
            )
            cur.execute(
                "SELECT bd.device_id, bd.user_id, bd.attempts, d.fid, d.updated_at "
                "FROM broadcast_deliveries bd "
                "JOIN push_devices d ON d.id = bd.device_id AND d.user_id = bd.user_id "
                "WHERE bd.broadcast_id = %s AND (bd.status = 'pending' "
                "OR (bd.status = 'retry' AND bd.retry_at <= %s)) "
                "ORDER BY bd.device_id LIMIT %s FOR UPDATE OF bd",
                (broadcast_id, now, BATCH_SIZE),
            )
            rows = cur.fetchall()
            if rows:
                cur.execute(
                    "UPDATE broadcast_deliveries SET attempts = attempts + 1, "
                    "updated_at = %s WHERE broadcast_id = %s AND device_id = ANY(%s)",
                    (now, broadcast_id, [row["device_id"] for row in rows]),
                )
                cur.execute(
                    "UPDATE broadcasts SET lease_until = %s WHERE id = %s",
                    (now + LEASE_DURATION, broadcast_id),
                )
            return [{**row, "attempts": row["attempts"] + 1} for row in rows]

    def record(self, broadcast_id, attempt_id, results) -> None:
        with self.conn.transaction(), self.conn.cursor() as cur:
            if not self._owns(cur, broadcast_id, attempt_id):
                return
            for delivery, status, error_code, retry_time in results:
                if status == "unregistered":
                    # Only the registration exactly as it was sent to.
                    cur.execute(
                        "DELETE FROM push_devices WHERE id = %s AND user_id = %s "
                        "AND fid = %s AND updated_at = %s",
                        (
                            delivery["device_id"],
                            delivery["user_id"],
                            delivery["fid"],
                            delivery["updated_at"],
                        ),
                    )
                cur.execute(
                    "UPDATE broadcast_deliveries SET status = %s, error_code = %s, "
                    "retry_at = %s, updated_at = %s "
                    "WHERE broadcast_id = %s AND device_id = %s",
                    (
                        status,
                        error_code,
                        retry_time,
                        self.clock(),
                        broadcast_id,
                        delivery["device_id"],
                    ),
                )

    def finish(self, broadcast_id, attempt_id) -> None:
        """Gives the lease back; once no push is left to try, it is sent."""
        with self.conn.transaction(), self.conn.cursor() as cur:
            cur.execute(
                "SELECT attempt_id FROM broadcasts WHERE id = %s FOR UPDATE",
                (broadcast_id,),
            )
            row = cur.fetchone()
            if row is None or row["attempt_id"] != attempt_id:
                return
            cur.execute(
                "SELECT count(*) AS n FROM broadcast_deliveries "
                "WHERE broadcast_id = %s AND status IN ('pending', 'retry')",
                (broadcast_id,),
            )
            left = cur.fetchone()["n"]
            cur.execute(
                "UPDATE broadcasts SET attempt_id = NULL, lease_until = NULL, "
                "status = CASE WHEN %s = 0 AND status = 'sending' THEN 'sent' "
                "ELSE status END WHERE id = %s",
                (left, broadcast_id),
            )

    def message(self, broadcast_id, content, fid: str) -> messaging.Message:
        return messaging.Message(
            fid=fid,
            notification=messaging.Notification(
                title=content["title"], body=content["body"]
            ),
            data={
                "type": "broadcast",
                "id": str(broadcast_id),
                "url": content["push_url"],
            },
            webpush=messaging.WebpushConfig(
                headers={"TTL": PUSH_TTL},
                notification=messaging.WebpushNotification(
                    tag=f"broadcast-{broadcast_id}",
                    # Timi's icon, and the one-colour badge in Android's status bar.
                    icon="/icons/pwa-192.png",
                    badge="/icons/badge-96.png",
                ),
            ),
        )

    def outcome(self, response, attempts: int):
        """(status, error code, retry time) for one send's response."""
        if response.success:
            return "sent", None, None
        error = response.exception
        if isinstance(error, messaging.UnregisteredError):
            return "unregistered", "UNREGISTERED", None
        code = str(getattr(error, "code", type(error).__name__))[:100]
        retry_time = retry_at(error, attempts, self.clock())
        return ("retry" if retry_time else "failed"), code, retry_time

    def push(self, broadcast_id, stop=None) -> int:
        """Pushes what is due of one broadcast; returns how many were sent to."""
        claimed = self.claim(broadcast_id, self.clock())
        if claimed is None:
            return 0
        attempt_id, content = claimed
        sent = 0
        try:
            while stop is None or not stop.is_set():
                batch = self.next_batch(broadcast_id, attempt_id)
                if not batch:
                    break
                ready = [d for d in batch if d["attempts"] <= MAX_ATTEMPTS]
                results = [
                    (d, "failed", "MAX_ATTEMPTS", None)
                    for d in batch
                    if d["attempts"] > MAX_ATTEMPTS
                ]
                if ready:
                    try:
                        responses = self.send_each(
                            [
                                self.message(broadcast_id, content, d["fid"])
                                for d in ready
                            ]
                        ).responses
                        for delivery, response in zip(ready, responses, strict=True):
                            results.append(
                                (
                                    delivery,
                                    *self.outcome(response, delivery["attempts"]),
                                )
                            )
                    except Exception as error:
                        # The whole batch failed (network, credentials).
                        LOGGER.warning("FCM batch failed (%s)", type(error).__name__)
                        code = str(getattr(error, "code", type(error).__name__))[:100]
                        for delivery in ready:
                            retry_time = retry_at(
                                error, delivery["attempts"], self.clock()
                            )
                            results.append(
                                (
                                    delivery,
                                    "retry" if retry_time else "failed",
                                    code,
                                    retry_time,
                                )
                            )
                sent += sum(1 for result in results if result[1] == "sent")
                self.record(broadcast_id, attempt_id, results)
        finally:
            self.finish(broadcast_id, attempt_id)
        return sent

    def run_once(self, *, dry_run=False, stop=None) -> int:
        if dry_run:
            with self.conn.cursor() as cur:
                cur.execute(
                    "SELECT count(*) AS n FROM broadcasts WHERE revoked_at IS NULL "
                    "AND ((status = 'scheduled' AND send_at <= now()) "
                    "OR status = 'sending')"
                )
                LOGGER.info("Preview broadcasts due: %d", cur.fetchone()["n"])
            return 0
        self.release_due()
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM broadcasts WHERE status = 'sending' "
                "AND revoked_at IS NULL ORDER BY send_at"
            )
            ids = [row["id"] for row in cur.fetchall()]
        sent = 0
        for broadcast_id in ids:
            if stop is not None and stop.is_set():
                break
            try:
                sent += self.push(broadcast_id, stop)
            except Exception as error:
                LOGGER.error(
                    "Broadcast push failed: broadcast=%s error=%s",
                    broadcast_id,
                    type(error).__name__,
                )
        if ids:
            LOGGER.info(
                "Broadcast pass completed: broadcasts=%d sent=%d", len(ids), sent
            )
        return sent
