#!/usr/bin/env bash
# Restarts cloudflared when Cloudflare says the tunnel is down (HTTP 530,
# error 1033) while the web app answers on this machine and the Internet line
# works. The home line's router moves connections between its Internet lines
# (the public IP changes), and cloudflared can then sit on dead connections
# for minutes (2026-10-18); a restart dials again on the line that works.
# Cron runs it every minute (deploy/README.md); it prints only when it acts.
set -uo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
set -a
# shellcheck disable=SC1091
source "$root/deploy/.env"
set +a
# shellcheck source=notify.sh
source "$root/deploy/scripts/notify.sh"

public_url="https://timi.nnqlab.dev/api/health"
local_url="http://127.0.0.1:${WEB_PORT:-3010}/api/health"

status() { curl -s -o /dev/null -w '%{http_code}' -m 15 -H 'Cache-Control: no-cache' "$1"; }

exec 9>/tmp/timi-tunnel-watchdog.lock
flock -n 9 || exit 0

[[ "$(status "$public_url")" == 530 ]] || exit 0

container="$(docker ps -q --filter label=com.docker.compose.project=finance --filter label=com.docker.compose.service=cloudflared)"
[[ -n "$container" ]] || exit 0
# A cloudflared that started in the last two minutes is still connecting.
started="$(docker inspect --format '{{.State.StartedAt}}' "$container")"
(( $(date +%s) - $(date -d "$started" +%s) >= 120 )) || exit 0
# The web app is down, or the line is: a restart of the tunnel cannot help.
[[ "$(status "$local_url")" == 200 ]] || exit 0
[[ "$(status https://www.gstatic.com/generate_204)" == 204 ]] || exit 0

sleep 20
[[ "$(status "$public_url")" == 530 ]] || exit 0

echo "$(date -Is) tunnel 530 while web and line work: restarting cloudflared"
docker restart "$container" >/dev/null
telegram "🔁 <b>Tunnel mất kết nối</b> dù server và mạng vẫn chạy: đã khởi động lại cloudflared." silent
