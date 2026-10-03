-- migrate:up

-- Accounts may go below zero (an overdraft, a card spent past its balance),
-- within the same bound either way.
ALTER TABLE accounts
  DROP CONSTRAINT accounts_balance_check,
  ADD CONSTRAINT accounts_balance_check CHECK (balance BETWEEN -999999999999999 AND 999999999999999),
  DROP CONSTRAINT accounts_opening_balance_check,
  ADD CONSTRAINT accounts_opening_balance_check CHECK (opening_balance BETWEEN -999999999999999 AND 999999999999999);

-- migrate:down

-- Fails while any account is below zero; bring those back to zero first.
ALTER TABLE accounts
  DROP CONSTRAINT accounts_balance_check,
  ADD CONSTRAINT accounts_balance_check CHECK (balance >= 0 AND balance <= 999999999999999),
  DROP CONSTRAINT accounts_opening_balance_check,
  ADD CONSTRAINT accounts_opening_balance_check CHECK (opening_balance >= 0 AND opening_balance <= 999999999999999);
