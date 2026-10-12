-- migrate:up

-- A balance corrected by hand is written down as a transaction of its own,
-- "Điều chỉnh số dư" (as MISA does), income or spending for the difference,
-- instead of moving the opening balance: it shows in the list, can be
-- counted in the figures or not (left out by default) and deleted to undo.
-- It has no category and no loan.
ALTER TABLE transactions ADD COLUMN adjustment boolean NOT NULL DEFAULT false;
ALTER TABLE transactions DROP CONSTRAINT transactions_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_check CHECK (
  (kind = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL
    AND from_account_id <> to_account_id AND account_id IS NULL
    AND category_item_id IS NULL AND debt_id IS NULL AND NOT adjustment)
  OR (kind IN ('expense', 'income') AND account_id IS NOT NULL
    AND from_account_id IS NULL AND to_account_id IS NULL AND fee = 0
    AND CASE
      WHEN adjustment THEN category_item_id IS NULL AND debt_id IS NULL
      ELSE (category_item_id IS NULL) <> (debt_id IS NULL)
    END)
);

-- migrate:down

-- Adjustments cannot be told apart from ordinary rows without the column;
-- they go, leaving the balances they set (the opening balance no longer adds up).
DELETE FROM transactions WHERE adjustment;
ALTER TABLE transactions DROP CONSTRAINT transactions_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_check CHECK (
  (kind = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL
    AND from_account_id <> to_account_id AND account_id IS NULL
    AND category_item_id IS NULL AND debt_id IS NULL)
  OR (kind IN ('expense', 'income') AND account_id IS NOT NULL
    AND from_account_id IS NULL AND to_account_id IS NULL AND fee = 0
    AND (category_item_id IS NULL) <> (debt_id IS NULL))
);
ALTER TABLE transactions DROP COLUMN adjustment;
