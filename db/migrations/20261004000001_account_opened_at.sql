-- migrate:up

-- When the user says the account was opened, which the form lets them set;
-- created_at stays the row's own time. Existing accounts take created_at.
ALTER TABLE accounts ADD COLUMN opened_at timestamptz;
UPDATE accounts SET opened_at = created_at;
ALTER TABLE accounts
  ALTER COLUMN opened_at SET NOT NULL,
  ALTER COLUMN opened_at SET DEFAULT now();

-- migrate:down

ALTER TABLE accounts DROP COLUMN opened_at;
