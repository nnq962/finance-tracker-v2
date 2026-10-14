-- migrate:up

-- A savings jar ("hũ tiết kiệm", 2026-10-14): money put aside for something
-- to buy (a motorbike, a phone), no interest. It is an account of its own
-- (type 'savings', no bank or wallet), so money goes in and out as
-- transfers and its balance is what it holds. It carries its goal: how much
-- (goal_target), what for (goal_icon, which also gives its colour) and, if
-- set, by when (goal_due, a month's last day). Bought, it is archived with
-- completed_at set: "Hũ đã hoàn thành" rather than locked.
ALTER TABLE accounts DROP CONSTRAINT accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check
  CHECK (type = ANY (ARRAY['cash'::text, 'bank'::text, 'e-wallet'::text, 'savings'::text]));

ALTER TABLE accounts DROP CONSTRAINT accounts_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_check
  CHECK ((type = ANY (ARRAY['cash'::text, 'savings'::text])) = (institution_id IS NULL));

ALTER TABLE accounts
  ADD COLUMN goal_target bigint,
  ADD COLUMN goal_icon text,
  ADD COLUMN goal_due date,
  ADD COLUMN completed_at timestamp with time zone;

ALTER TABLE accounts ADD CONSTRAINT accounts_goal_check CHECK (
  (type = 'savings') = (goal_target IS NOT NULL AND goal_icon IS NOT NULL)
  AND (type = 'savings' OR (goal_due IS NULL AND completed_at IS NULL))
);
ALTER TABLE accounts ADD CONSTRAINT accounts_goal_target_check
  CHECK (goal_target > 0 AND goal_target <= 999999999999999);
ALTER TABLE accounts ADD CONSTRAINT accounts_goal_icon_check
  CHECK (char_length(goal_icon) BETWEEN 1 AND 32);

-- migrate:down

DELETE FROM accounts WHERE type = 'savings';
ALTER TABLE accounts DROP CONSTRAINT accounts_goal_icon_check;
ALTER TABLE accounts DROP CONSTRAINT accounts_goal_target_check;
ALTER TABLE accounts DROP CONSTRAINT accounts_goal_check;
ALTER TABLE accounts
  DROP COLUMN completed_at,
  DROP COLUMN goal_due,
  DROP COLUMN goal_icon,
  DROP COLUMN goal_target;
ALTER TABLE accounts DROP CONSTRAINT accounts_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_check CHECK (((type = 'cash'::text) = (institution_id IS NULL)));
ALTER TABLE accounts DROP CONSTRAINT accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check
  CHECK ((type = ANY (ARRAY['cash'::text, 'bank'::text, 'e-wallet'::text])));
