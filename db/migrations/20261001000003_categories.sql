-- migrate:up

CREATE TABLE category_groups (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  -- Names from the server-side catalogs (lib/icons, lib/categories).
  icon_name text NOT NULL CHECK (char_length(icon_name) BETWEEN 1 AND 64),
  color_name text NOT NULL CHECK (char_length(color_name) BETWEEN 1 AND 64),
  sort_order bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, id),
  UNIQUE (user_id, id, type)
);

-- An item inherits its type from its group; the composite key keeps them
-- equal and within the same user. Items take their color from the group.
CREATE TABLE category_items (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL,
  group_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  icon_name text NOT NULL CHECK (char_length(icon_name) BETWEEN 1 AND 64),
  sort_order bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, id),
  UNIQUE (user_id, id, type),
  FOREIGN KEY (user_id, group_id, type)
    REFERENCES category_groups (user_id, id, type) ON DELETE CASCADE
);

CREATE INDEX category_groups_user_idx ON category_groups (user_id, type, sort_order);
CREATE INDEX category_items_group_idx ON category_items (user_id, group_id, sort_order);

CREATE TRIGGER category_groups_set_updated_at BEFORE UPDATE ON category_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER category_items_set_updated_at BEFORE UPDATE ON category_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down

DROP TABLE category_items;
DROP TABLE category_groups;
