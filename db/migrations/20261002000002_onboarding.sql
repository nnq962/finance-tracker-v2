-- migrate:up

-- First-run guide: when the welcome screens were seen (on any device), and
-- when the getting-started checklist on the overview was hidden.
ALTER TABLE users
  ADD COLUMN onboarding_seen_at timestamptz,
  ADD COLUMN checklist_hidden_at timestamptz;

-- People already using the app skip the welcome screens.
UPDATE users SET onboarding_seen_at = now()
WHERE EXISTS (SELECT 1 FROM accounts WHERE accounts.user_id = users.id);

-- migrate:down

ALTER TABLE users
  DROP COLUMN checklist_hidden_at,
  DROP COLUMN onboarding_seen_at;
