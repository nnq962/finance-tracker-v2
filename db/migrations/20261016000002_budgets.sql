-- migrate:up

-- Monthly spending limits ("hạn mức chi tiêu", 2026-10-16): the most to
-- spend each month, repeating every month. One for the whole month's
-- spending (category_group_id null) and at most one per expense category
-- group. What counts as spent is worked out from the transactions
-- (lib/budgets), never stored.
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category_group_id uuid,
  -- Only spending groups have limits; the composite key below checks it.
  category_type text NOT NULL DEFAULT 'expense' CHECK (category_type = 'expense'),
  amount bigint NOT NULL CHECK (amount BETWEEN 1 AND 999999999999999),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, id),
  FOREIGN KEY (user_id, category_group_id, category_type)
    REFERENCES category_groups (user_id, id, type) ON DELETE CASCADE
);

-- One whole-month limit and one per group: the null group counts as a value.
CREATE UNIQUE INDEX budgets_user_group_idx ON budgets (user_id, category_group_id) NULLS NOT DISTINCT;

CREATE TRIGGER budgets_set_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- The pushes sent for a limit in a month: at 80% and once past it, each
-- once. A level already reached when the limit is saved is written down
-- without a push.
CREATE TABLE budget_alerts (
  user_id text NOT NULL,
  budget_id uuid NOT NULL,
  -- The month's first day.
  month date NOT NULL,
  level smallint NOT NULL CHECK (level IN (80, 100)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (budget_id, month, level),
  FOREIGN KEY (user_id, budget_id) REFERENCES budgets (user_id, id) ON DELETE CASCADE
);

-- migrate:down

DROP TABLE budget_alerts;
DROP TABLE budgets;
