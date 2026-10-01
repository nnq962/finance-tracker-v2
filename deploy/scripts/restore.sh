#!/usr/bin/env bash
# Replaces the finance database with a dump made by backup.sh.
#
#   deploy/scripts/restore.sh deploy/backups/finance-20261001-023000.dump
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
file="${1:?Usage: restore.sh <file.dump>}"
[[ -f "$file" ]] || { echo "Not found: $file" >&2; exit 1; }

read -r -p "This overwrites ALL current data with $file. Type 'restore' to continue: " answer
[[ "$answer" == "restore" ]] || { echo "Cancelled."; exit 1; }

docker compose --project-directory "$root/deploy" -f "$root/deploy/compose.yaml" \
  exec -T postgres pg_restore -U finance -d finance --clean --if-exists --no-owner \
  --role=finance --single-transaction <"$file"
echo "Restored from $file."
