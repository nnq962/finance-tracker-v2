#!/usr/bin/env bash
# Dumps the finance database to deploy/backups/ and keeps the newest N dumps.
#
#   deploy/scripts/backup.sh               # keep 14 (BACKUP_KEEP)
#   BACKUP_DIR=/mnt/backup deploy/scripts/backup.sh
#
# Copy the dumps off this machine too (another disk, NAS or cloud drive):
# a backup on the same disk as the database does not survive that disk.
# Schedule it with cron, e.g. every night at 02:30:
#   30 2 * * * /path/to/repo/deploy/scripts/backup.sh >>/var/log/finance-backup.log 2>&1
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
backup_dir="${BACKUP_DIR:-$root/deploy/backups}"
keep="${BACKUP_KEEP:-14}"
file="$backup_dir/finance-$(date +%Y%m%d-%H%M%S).dump"

mkdir -p "$backup_dir"
# Custom format (-Fc): compressed, restored with pg_restore (see restore.sh).
docker compose --project-directory "$root/deploy" -f "$root/deploy/compose.yaml" \
  exec -T postgres pg_dump -U finance -d finance -Fc >"$file.partial"
mv "$file.partial" "$file"
echo "Backup written: $file ($(du -h "$file" | cut -f1))"

ls -1t "$backup_dir"/finance-*.dump | tail -n +"$((keep + 1))" | xargs -r rm --
