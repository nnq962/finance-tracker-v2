#!/usr/bin/env bash
# The always-on tunnel to the dev server: https://finance-dev.nnqlab.dev →
# localhost:3000 (npm run dev). Runs in Docker and restarts on its own, also
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

case "${1:-up}" in
  up) "${compose[@]}" up -d ;;
  stop) "${compose[@]}" down ;;
  logs) "${compose[@]}" logs -f ;;
  *) echo "usage: dev-tunnel.sh [up|stop|logs]" >&2; exit 1 ;;
esac
