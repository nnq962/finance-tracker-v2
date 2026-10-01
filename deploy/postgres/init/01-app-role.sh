#!/bin/sh
# Runs once, on the first start of an empty data volume.
#
# - "finance" (POSTGRES_USER) owns the schema and runs migrations.
# - "finance_app" is what the app connects as: it can read and write rows but
#   cannot create, alter or drop tables.
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v app_password="$APP_DB_PASSWORD" <<'SQL'
CREATE ROLE finance_app LOGIN PASSWORD :'app_password';
SQL

for database in $APP_DATABASES; do
  if [ "$database" != "$POSTGRES_DB" ]; then
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
      -c "CREATE DATABASE $database OWNER $POSTGRES_USER"
  fi

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$database" <<SQL
REVOKE ALL ON DATABASE $database FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE $database TO finance_app;
GRANT USAGE ON SCHEMA public TO finance_app;
-- Tables created later by migrations (run as $POSTGRES_USER) are usable by the app.
ALTER DEFAULT PRIVILEGES FOR ROLE $POSTGRES_USER IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO finance_app;
ALTER DEFAULT PRIVILEGES FOR ROLE $POSTGRES_USER IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO finance_app;
ALTER DEFAULT PRIVILEGES FOR ROLE $POSTGRES_USER IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO finance_app;
SQL
done
