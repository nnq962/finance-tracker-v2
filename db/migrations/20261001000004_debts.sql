-- migrate:up

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  initials text NOT NULL CHECK (char_length(initials) BETWEEN 1 AND 4),
  relationship text CHECK (char_length(relationship) <= 80),
  phone text CHECK (char_length(phone) <= 30),
  note text CHECK (char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, id)
);

-- Status (active/overdue/settled) and the paid total are derived from the
-- payments, so they are not stored.
CREATE TABLE debts (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL,
  -- A contact with debt history cannot be deleted.
  contact_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('lent', 'borrowed')),
  -- cash-flow: the loan moved money through account_id.
  -- opening: outstanding principal recorded at the tracking start date,
  -- without an account or balance change. Fixed after creation.
  recording_mode text NOT NULL DEFAULT 'cash-flow'
    CHECK (recording_mode IN ('cash-flow', 'opening')),
  account_id uuid,
  amount bigint NOT NULL CHECK (amount BETWEEN 1 AND 999999999999999),
  -- Percent per interest_period; both set or both null.
  interest_rate numeric(5, 2) CHECK (interest_rate > 0 AND interest_rate <= 100),
  interest_period text CHECK (interest_period IN ('month', 'year')),
  note text NOT NULL CHECK (char_length(note) BETWEEN 1 AND 500),
  recorded_at date NOT NULL,
  due_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  -- Account and contact keys are checked at commit (DEFERRABLE) so deleting a
  -- user can cascade through accounts, contacts and debts in any order.
  FOREIGN KEY (user_id, contact_id) REFERENCES contacts (user_id, id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (user_id, account_id) REFERENCES accounts (user_id, id) DEFERRABLE INITIALLY DEFERRED,
  CHECK ((interest_rate IS NULL) = (interest_period IS NULL)),
  CHECK (recording_mode = 'opening' OR account_id IS NOT NULL)
);

-- Collections (lent) or repayments (borrowed); each moves money through an
-- account.
CREATE TABLE debt_payments (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL,
  debt_id uuid NOT NULL,
  account_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount BETWEEN 1 AND 999999999999999),
  paid_at date NOT NULL,
  paid_time time(0) NOT NULL,
  note text CHECK (char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, debt_id) REFERENCES debts (user_id, id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, account_id) REFERENCES accounts (user_id, id) DEFERRABLE INITIALLY DEFERRED
);

-- Request ids already applied, so a retried request is not applied twice.
-- The fingerprint rejects reusing an id for a different change.
CREATE TABLE debt_operations (
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id uuid NOT NULL,
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX contacts_user_created_idx ON contacts (user_id, created_at);
CREATE INDEX debts_user_recorded_idx ON debts (user_id, recorded_at DESC);
CREATE INDEX debts_contact_idx ON debts (user_id, contact_id);
CREATE INDEX debts_account_idx ON debts (account_id) WHERE account_id IS NOT NULL;
CREATE INDEX debt_payments_debt_idx ON debt_payments (user_id, debt_id, paid_at, paid_time);
CREATE INDEX debt_payments_account_idx ON debt_payments (account_id);

CREATE TRIGGER contacts_set_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER debts_set_updated_at BEFORE UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER debt_payments_set_updated_at BEFORE UPDATE ON debt_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down

DROP TABLE debt_operations;
DROP TABLE debt_payments;
DROP TABLE debts;
DROP TABLE contacts;
