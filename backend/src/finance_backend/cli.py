import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="Finance Tracker backend services.")
    commands = parser.add_subparsers(dest="command", required=True)
    reminders = commands.add_parser(
        "reminders", help="Run the independent reminder worker."
    )
    reminders.add_argument(
        "--once", action="store_true", help="Run a single pass and exit."
    )
    reminders.add_argument(
        "--dry-run", action="store_true", help="Read only; no FCM or writes."
    )
    reminders.add_argument(
        "--limit", type=int, default=100, help="Settings per pass (1–1000)."
    )
    args = parser.parse_args()
    if args.command == "reminders":
        if not 1 <= args.limit <= 1000:
            parser.error("--limit must be between 1 and 1000")
        from finance_backend.workers.reminders import run

        run(once=args.once, dry_run=args.dry_run, limit=args.limit)
