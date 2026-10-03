-- migrate:up

-- Pro time granted to a user, one row per grant (by hand for now, from an
-- admin who saw the payment arrive). A user is Pro while some grant that is
-- not revoked covers now; a new grant starts where the last one ends.
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('pro')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  -- What was paid, in VND, for the takings.
  amount bigint NOT NULL DEFAULT 0 CHECK (amount >= 0),
  note text CHECK (char_length(note) <= 200),
  -- The admin's user id; kept when that account is removed.
  granted_by text NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX subscriptions_user_id_ends_at_idx ON subscriptions (user_id, ends_at);

-- AI assistant requests per user and Vietnam calendar month (its first day),
-- counted before each request so the monthly limit holds.
CREATE TABLE ai_usage (
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  month date NOT NULL CHECK (extract(day FROM month) = 1),
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (user_id, month)
);

-- migrate:down

DROP TABLE ai_usage;
DROP TABLE subscriptions;
