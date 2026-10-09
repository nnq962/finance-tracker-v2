#!/usr/bin/env bash
# The always-on tunnel to the dev server: https://<DEV_TUNNEL_HOST> →
# localhost:3000 (npm run dev). The tunnel is DEV_TUNNEL_ID in web/.env.local. Runs in Docker and restarts on its own, also
# after a reboot. See "Tunnel cho dev server" in deploy/README.md.
#
#   npm run tunnel            start it (or make sure it runs)
#   npm run tunnel -- stop    stop it
#   npm run tunnel -- logs    follow its log
#
# Run the npm scripts from web/.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose=(docker compose -f "$root/deploy/compose.dev-tunnel.yaml")
export DEV_UID="$(id -u)" DEV_GID="$(id -g)"
# This machine's tunnel; a value already in the environment wins.
if [[ -z "${DEV_TUNNEL_ID:-}" && -f "$root/web/.env.local" ]]; then
  DEV_TUNNEL_ID="$(sed -n 's/^DEV_TUNNEL_ID=//p' "$root/web/.env.local" | tail -n 1)"
fi
export DEV_TUNNEL_ID

case "${1:-up}" in
  up) "${compose[@]}" up -d ;;
  stop) "${compose[@]}" down ;;
  logs) "${compose[@]}" logs -f ;;
  *) echo "usage: dev-tunnel.sh [up|stop|logs]" >&2; exit 1 ;;
esac
