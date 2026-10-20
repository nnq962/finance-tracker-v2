-- migrate:up

-- What users send from Cài đặt › Hỗ trợ › Góp ý với Timi (2026-10-20): the
-- kind they picked, their words, and the app version and device they chose
-- to attach. Kept with the user; goes with the account.
CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('idea', 'bug', 'praise', 'other')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  app_version text,
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX feedback_created_at_idx ON feedback (created_at DESC);

-- migrate:down

DROP TABLE feedback;
