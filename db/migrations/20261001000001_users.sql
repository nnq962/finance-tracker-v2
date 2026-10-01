-- migrate:up

-- Keeps updated_at current on every UPDATE; attached to each table below.
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

-- One row per Firebase Auth user; id is the Firebase UID.
CREATE TABLE users (
  id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{1,128}$'),
  -- Set once the default categories have been created.
  categories_initialized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- migrate:down

DROP TABLE users;
DROP FUNCTION set_updated_at();
