#!/usr/bin/env bash
# Local Postgres for development. Usually called through npm scripts:
#
#   npm run db:up               start Postgres and apply migrations
#   npm run db:down             stop it (data is kept)
#   npm run db:new -- <name>    create db/migrations/<timestamp>_<name>.sql
#   npm run db:migrate          apply pending migrations, regenerate types
#   npm run db:rollback         undo the latest migration
#   npm run db:status           list applied / pending migrations
#   npm run db:psql             open a SQL shell
#   npm run db:types            regenerate web/lib/db/types.ts
#
# Run the npm scripts from web/.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
# Dev has its own project, volume and env file, apart from production.
env_file="$root/deploy/.env.dev"
compose=(docker compose
  --project-name finance-dev
  --project-directory "$root/deploy"
  --env-file "$env_file"
  -f "$root/deploy/compose.yaml"
  -f "$root/deploy/compose.dev.yaml")

# Files dbmate writes (new migrations, schema.sql) belong to you, not root.
export HOST_UID="$(id -u)" HOST_GID="$(id -g)"

random_password() {
  LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32 || true
}

ensure_env() {
  if [[ ! -f "$env_file" ]]; then
    {
      echo "POSTGRES_PASSWORD=$(random_password)"
      echo "APP_DB_PASSWORD=$(random_password)"
      echo "POSTGRES_PORT=5432"
    } >"$env_file"
    echo "Created deploy/.env.dev with random passwords."
  fi
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
}

# Next.js reads DATABASE_URL from web/.env.local; add it on first run.
ensure_app_url() {
  local url="postgres://finance_app:${APP_DB_PASSWORD}@127.0.0.1:${POSTGRES_PORT:-5432}/finance"
  if ! grep -qs '^DATABASE_URL=' "$root/web/.env.local"; then
    printf '\n# Local Postgres (deploy/scripts/db.sh)\nDATABASE_URL=%s\n' "$url" >>"$root/web/.env.local"
    echo "Added DATABASE_URL to web/.env.local."
  fi
}

owner_url() {
  echo "postgres://finance:${POSTGRES_PASSWORD}@127.0.0.1:${POSTGRES_PORT:-5432}/${1:-finance}?sslmode=disable"
}

dbmate() {
  "${compose[@]}" run --rm migrate "$@"
}

migrate() {
  dbmate up
  # The test database mirrors the schema; schema.sql is dumped from finance only.
  MIGRATE_DATABASE=finance_test dbmate --no-dump-schema up
  types
}

types() {
  (cd "$root/web" && npx kysely-codegen \
    --url "$(owner_url)" \
    --dialect postgres \
    --camel-case \
    --out-file lib/db/types.ts \
    --type-mapping '{"int8":"number","numeric":"number","date":"string","time":"string"}' \
    --exclude-pattern 'dbmate.*')
}

command="${1:-}"
shift || true
ensure_env

case "$command" in
  up)
    "${compose[@]}" up -d --wait postgres
    ensure_app_url
    migrate
    ;;
  down) "${compose[@]}" down ;;
  new) dbmate new "$@" ;;
  migrate) migrate ;;
  rollback)
    dbmate rollback
    MIGRATE_DATABASE=finance_test dbmate --no-dump-schema rollback
    types
    ;;
  status) dbmate status ;;
  psql) "${compose[@]}" exec postgres psql -U finance -d "${1:-finance}" ;;
  types) types ;;
  *)
    sed -n '2,13p' "$0"
    exit 1
    ;;
esac
