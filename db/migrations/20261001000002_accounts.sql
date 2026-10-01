-- migrate:up

-- Money is stored as whole VND in bigint; 999,999,999,999,999 is the app's
-- ceiling and stays exact as a JavaScript number.
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'e-wallet')),
  -- Catalog id from lib/institutions; required for bank/e-wallet only.
  institution_id text CHECK (char_length(institution_id) BETWEEN 1 AND 64),
  opening_balance bigint NOT NULL
    CHECK (opening_balance BETWEEN 0 AND 999999999999999),
  balance bigint NOT NULL CHECK (balance BETWEEN 0 AND 999999999999999),
  note text CHECK (char_length(note) <= 500),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Target of composite foreign keys, so rows can only reference an account
  -- of the same user.
  UNIQUE (user_id, id),
  CHECK ((type = 'cash') = (institution_id IS NULL))
);

CREATE INDEX accounts_user_created_idx ON accounts (user_id, created_at);

CREATE TRIGGER accounts_set_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down

DROP TABLE accounts;
