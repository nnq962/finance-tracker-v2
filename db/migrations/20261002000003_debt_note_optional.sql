-- migrate:up

-- A debt's note is now optional ("Ghi chú"); an empty one is stored as NULL.
ALTER TABLE debts
  ALTER COLUMN note DROP NOT NULL,
  DROP CONSTRAINT debts_note_check,
  ADD CONSTRAINT debts_note_check CHECK (char_length(note) BETWEEN 1 AND 500);

-- migrate:down

UPDATE debts SET note = 'Khoản nợ' WHERE note IS NULL;
ALTER TABLE debts
  ALTER COLUMN note SET NOT NULL;
