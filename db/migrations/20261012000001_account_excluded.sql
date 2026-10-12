-- migrate:up

-- An account left out of the figures: its balance is not in the totals or
-- the net worth, and its income and spending are not in the monthly figures,
-- charts or the assistant's sums, as if each were left out on its own
-- (transactions.excluded). The account itself keeps working. Read when the
-- figures are made, so turning it off brings everything back.
ALTER TABLE accounts ADD COLUMN excluded boolean NOT NULL DEFAULT false;

-- migrate:down

ALTER TABLE accounts DROP COLUMN excluded;
