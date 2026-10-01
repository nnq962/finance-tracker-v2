"""Opt-in synthetic Firestore checks. FCM sends are always mocked."""

import hashlib
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from firebase_admin import exceptions

from finance_backend.integrations.firebase import get_firestore
from finance_backend.workers.reminders import ReminderWorker


def main():
    if os.environ.get("REMINDER_TEST_LIVE") != "1":
        raise SystemExit("Set REMINDER_TEST_LIVE=1 to create isolated test records.")
    db = get_firestore()
    uid = "codex_reminder_test_" + uuid4().hex
    user = db.document(f"users/{uid}")
    ref = db.document(f"users/{uid}/notificationSettings/default")
    now = datetime(2026, 10, 1, 13, 10, tzinfo=UTC)
    cleanup = []
    settings = {
        "notificationsEnabled": True,
        "dailyReminderTime": "20:00",
        "timeZone": "Asia/Ho_Chi_Minh",
        "nextReminderAt": now - timedelta(minutes=10),
        "updatedAt": now,
    }
    messages = []

    def send(message):
        messages.append(message)
        if len(messages) == 2:
            raise exceptions.UnavailableError("Synthetic transient failure")

    worker = ReminderWorker(db, send=send, clock=lambda: now)
    try:
        ref.set(settings)
        for _ in range(2):
            fid = "c" + uuid4().hex[:21]
            device_id = hashlib.sha256(fid.encode()).hexdigest()
            browser_id = str(uuid4())
            device = db.document(f"users/{uid}/pushDevices/{device_id}")
            owner = db.document(f"pushInstallations/{device_id}")
            browser = db.document(f"notificationBrowsers/{browser_id}")
            cleanup.extend([owner, browser])
            device.set({"fid": fid, "browserId": browser_id, "updatedAt": now})
            owner.set({"uid": uid, "browserId": browser_id})
            browser.set({"uid": uid, "deviceId": device_id, "sessionId": str(uuid4())})
        with ThreadPoolExecutor(max_workers=2) as pool:
            claims = list(pool.map(lambda _: worker.claim(ref, now), range(2)))
        assert sum(claim is not None for claim in claims) == 1
        claim = next(claim for claim in claims if claim)
        # Expire the synthetic lease, then exercise real SDK transactions with mock FCM.
        claim[1].update({"leaseUntil": now - timedelta(seconds=1)})
        worker.process(ref, now)
        assert len(messages) == 2 and all(message.fid for message in messages)
        assert ref.get().get("nextReminderAt") <= now
        log = claim[1].get().to_dict()
        assert log["status"] == "retry"
        assert sorted(result["status"] for result in log["devices"].values()) == [
            "retry",
            "sent",
        ]
        worker.process(ref, now)
        assert len(messages) == 2  # Backoff prevents an immediate retry.
        now += timedelta(minutes=10)
        worker.process(ref, now)
        assert len(messages) == 3
        assert messages[2].fid == messages[1].fid != messages[0].fid
        assert all(m.notification.title == claim[3]["title"] for m in messages)
        assert ref.get().get("nextReminderAt") > now
        worker.process(ref, now)
        assert len(messages) == 3
        log = claim[1].get().to_dict()
        assert log["status"] == "sent" and "leaseUntil" not in log
        assert all(result["status"] == "sent" for result in log["devices"].values())
        print(
            "Live Firestore lock and partial retry passed; "
            "three mock FCM calls, no real messages."
        )
    finally:
        db.recursive_delete(user)
        batch = db.batch()
        for item in cleanup:
            batch.delete(item)
        batch.commit()
        print("Synthetic reminder records removed.")


if __name__ == "__main__":
    main()
