-- migrate:up

-- A transaction left out of the figures (monthly totals, charts, the
-- assistant's answers) while still moving its account's balance: money paid
-- for someone else, say. Only income and spending; transfers and loans are
-- never counted as either anyway.
ALTER TABLE transactions ADD COLUMN excluded boolean NOT NULL DEFAULT false;
ALTER TABLE transactions ADD CONSTRAINT transactions_excluded_check
  CHECK (NOT excluded OR (kind IN ('expense', 'income') AND debt_id IS NULL));

-- migrate:down

ALTER TABLE transactions DROP CONSTRAINT transactions_excluded_check;
ALTER TABLE transactions DROP COLUMN excluded;
