#!/usr/bin/env bash
# Builds and (re)starts production from this checkout. Run it from the
# production checkout, not the one you develop in (see deploy/README.md).
#
#   deploy/scripts/deploy.sh            pull, build, migrate, restart
#   deploy/scripts/deploy.sh --no-pull  deploy the checkout as it is
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
env_file="$root/deploy/.env"

if [[ ! -f "$env_file" ]]; then
  echo "Missing deploy/.env: copy deploy/.env.example and fill it in." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

compose=(docker compose
  --project-directory "$root/deploy"
  --env-file "$env_file"
  -f "$root/deploy/compose.yaml"
  -f "$root/deploy/compose.prod.yaml")
services=(web)
if [[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  compose+=(--profile tunnel)
  services+=(cloudflared)
fi
export HOST_UID="$(id -u)" HOST_GID="$(id -g)"

if [[ "${1:-}" != "--no-pull" ]]; then
  if [[ -n "$(git -C "$root" status --porcelain)" ]]; then
    echo "The checkout has local changes; commit or discard them first." >&2
    exit 1
  fi
  git -C "$root" pull --ff-only
fi

echo "==> Building $(git -C "$root" rev-parse --short HEAD)"
"${compose[@]}" build web

echo "==> Migrating"
"${compose[@]}" up -d --wait postgres
# Production never rewrites db/schema.sql in the checkout.
"${compose[@]}" run --rm -e DBMATE_NO_DUMP_SCHEMA=true migrate up

echo "==> Starting ${services[*]}"
"${compose[@]}" up -d --wait --remove-orphans "${services[@]}"
docker image prune -f >/dev/null

echo "==> Deployed. Local check: http://127.0.0.1:${WEB_PORT:-3010}"
