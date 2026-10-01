#!/usr/bin/env bash
# Dumps the production database to deploy/backups/, keeps the newest dumps
# there and, when BACKUP_REMOTE is set in deploy/.env, copies each dump to
# that rclone remote (an encrypted Google Drive folder, see deploy/README.md).
#
#   deploy/scripts/backup.sh
#
# Scheduled nightly with cron, e.g. at 02:30:
#   30 2 * * * /path/to/checkout/deploy/scripts/backup.sh >>/path/to/checkout/deploy/backups/backup.log 2>&1
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
env_file="$root/deploy/.env"
if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
fi

backup_dir="${BACKUP_DIR:-$root/deploy/backups}"
keep="${BACKUP_KEEP:-14}"
remote_days="${BACKUP_REMOTE_DAYS:-90}"
# cron runs with a minimal PATH that does not include ~/.local/bin.
rclone="$(command -v rclone || echo "$HOME/.local/bin/rclone")"
file="$backup_dir/finance-$(date +%Y%m%d-%H%M%S).dump"

echo "[$(date -Is)] Backup starting"
mkdir -p "$backup_dir"
# Custom format (-Fc): compressed, restored with pg_restore (see restore.sh).
docker compose --project-directory "$root/deploy" -f "$root/deploy/compose.yaml" \
  exec -T postgres pg_dump -U finance -d finance -Fc >"$file.partial"
mv "$file.partial" "$file"
echo "Written: $file ($(du -h "$file" | cut -f1))"

ls -1t "$backup_dir"/finance-*.dump | tail -n +"$((keep + 1))" | xargs -r rm --

if [[ -n "${BACKUP_REMOTE:-}" ]]; then
  "$rclone" copy "$file" "$BACKUP_REMOTE"
  "$rclone" delete --min-age "${remote_days}d" "$BACKUP_REMOTE"
  echo "Copied to $BACKUP_REMOTE (kept ${remote_days} days)"
fi
echo "[$(date -Is)] Backup done"
