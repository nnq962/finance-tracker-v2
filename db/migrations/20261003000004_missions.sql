-- migrate:up

-- Missions on the overview replace the getting-started checklist, which can
-- no longer be hidden. Each finished mission is claimed once for AI credits.
CREATE TABLE mission_rewards (
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  mission text NOT NULL CHECK (char_length(mission) BETWEEN 1 AND 40),
  credits integer NOT NULL CHECK (credits > 0),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission)
);

-- AI requests earned from missions: they never expire and are used only
-- once the plan's monthly requests run out.
ALTER TABLE users
  ADD COLUMN ai_credits integer NOT NULL DEFAULT 0 CHECK (ai_credits >= 0),
  DROP COLUMN checklist_hidden_at;

-- migrate:down

ALTER TABLE users
  ADD COLUMN checklist_hidden_at timestamptz,
  DROP COLUMN ai_credits;

DROP TABLE mission_rewards;
