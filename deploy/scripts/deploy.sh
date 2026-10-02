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
services=(web worker ollama)
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
  before="$(sha256sum "$0")"
  git -C "$root" pull --ff-only
  # Bash already read the old copy of this script: rerun the pulled one.
  if [[ "$(sha256sum "$0")" != "$before" ]]; then
    exec "$0" --no-pull
  fi
fi

echo "==> Building $(git -C "$root" rev-parse --short HEAD)"
"${compose[@]}" build web worker

echo "==> Migrating"
"${compose[@]}" up -d --wait postgres
# Production never rewrites db/schema.sql in the checkout.
"${compose[@]}" run --rm -e DBMATE_NO_DUMP_SCHEMA=true migrate up

# Compose keeps a running container even when its image tag now points to a
# new build, so replace a service explicitly whenever its image changed.
start() {
  local service="$1" image="$2" running built recreate=()
  running="$(docker inspect --format '{{.Image}}' "$("${compose[@]}" ps -q "$service")" 2>/dev/null || true)"
  built="$(docker image inspect --format '{{.Id}}' "$image")"
  [[ "$running" == "$built" ]] || recreate=(--force-recreate)
  "${compose[@]}" up -d --wait --no-deps "${recreate[@]}" "$service"
}

echo "==> Starting ${services[*]}"
# External, so `docker compose down -v` never deletes downloaded models.
docker volume create finance-ollama >/dev/null
start web finance-web
start worker finance-backend
"${compose[@]}" up -d --wait --remove-orphans "${services[@]}"
docker image prune -f >/dev/null

# The model lives in the finance-ollama volume; fetch it only when missing.
model="${OLLAMA_MODEL:-gemma4:e4b}"
if ! "${compose[@]}" exec -T ollama ollama show "$model" >/dev/null 2>&1; then
  echo "==> Pulling $model"
  "${compose[@]}" exec -T ollama ollama pull "$model"
fi

echo "==> Deployed. Local check: http://127.0.0.1:${WEB_PORT:-3010}"
