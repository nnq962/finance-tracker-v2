-- migrate:up

-- Account, category and debt names are read through joins, never copied
-- into the row, so renames show up everywhere at once.
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('expense', 'income', 'transfer')),
  -- Always positive; kind gives the direction.
  amount bigint NOT NULL CHECK (amount BETWEEN 1 AND 999999999999999),
  -- Transfer fee, paid by from_account on top of amount.
  fee bigint NOT NULL DEFAULT 0 CHECK (fee BETWEEN 0 AND 999999999999999),
  -- expense / income
  account_id uuid,
  category_item_id uuid,
  -- Set instead of a category on the initial cash movement of a loan.
  debt_id uuid UNIQUE,
  -- transfer
  from_account_id uuid,
  to_account_id uuid,
  note text CHECK (char_length(note) <= 500),
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, account_id) REFERENCES accounts (user_id, id),
  FOREIGN KEY (user_id, from_account_id) REFERENCES accounts (user_id, id),
  FOREIGN KEY (user_id, to_account_id) REFERENCES accounts (user_id, id),
  -- The category must be of the same type as the transaction (expense/income).
  FOREIGN KEY (user_id, category_item_id, kind)
    REFERENCES category_items (user_id, id, type),
  FOREIGN KEY (user_id, debt_id) REFERENCES debts (user_id, id) ON DELETE CASCADE,
  CHECK (
    (
      kind = 'transfer'
      AND from_account_id IS NOT NULL
      AND to_account_id IS NOT NULL
      AND from_account_id <> to_account_id
      AND account_id IS NULL
      AND category_item_id IS NULL
      AND debt_id IS NULL
    )
    OR (
      kind IN ('expense', 'income')
      AND account_id IS NOT NULL
      AND from_account_id IS NULL
      AND to_account_id IS NULL
      AND fee = 0
      -- Exactly one of: a category, or the loan it belongs to.
      AND (category_item_id IS NULL) <> (debt_id IS NULL)
    )
  )
);

CREATE INDEX transactions_user_occurred_idx ON transactions (user_id, occurred_at DESC);
CREATE INDEX transactions_account_idx ON transactions (account_id) WHERE account_id IS NOT NULL;
CREATE INDEX transactions_from_account_idx ON transactions (from_account_id) WHERE from_account_id IS NOT NULL;
CREATE INDEX transactions_to_account_idx ON transactions (to_account_id) WHERE to_account_id IS NOT NULL;
CREATE INDEX transactions_category_idx ON transactions (category_item_id) WHERE category_item_id IS NOT NULL;

CREATE TRIGGER transactions_set_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down

DROP TABLE transactions;
