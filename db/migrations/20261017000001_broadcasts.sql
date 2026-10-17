-- migrate:up

-- Notices an admin sends to users ("Tin từ Timi"): in the bell, as a push,
-- or both, now or at a set time. The web app writes them; the worker
-- (backend/) pushes them to devices in batches once due.
CREATE TABLE broadcasts (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 60),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 200),
  -- What a tap opens, a key the app knows, and the page a push opens for it.
  opens text NOT NULL CHECK (opens IN ('none', 'overview', 'transactions', 'budget', 'debts', 'budgets', 'plans', 'release')),
  push_url text NOT NULL CHECK (push_url ~ '^/[A-Za-z0-9/?=&_-]*$'),
  in_bell boolean NOT NULL,
  push boolean NOT NULL,
  audience text NOT NULL CHECK (audience IN ('all', 'free', 'pro', 'new')),
  send_at timestamptz NOT NULL,
  -- 'scheduled' until its recipients are written down at send_at, then
  -- 'sending' while pushes are due, 'sent' once every device has an outcome.
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sending', 'sent')),
  -- The worker holding the push run, as for the daily reminders.
  attempt_id uuid,
  lease_until timestamptz,
  -- Taken back: gone from every bell, and no further pushes.
  revoked_at timestamptz,
  -- The admin's user id; kept when that account is removed.
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (in_bell OR push),
  CHECK ((attempt_id IS NULL) = (lease_until IS NULL))
);

-- Who a broadcast went to, written once when it is sent, so the bell, the
-- count of readers and later sign-ups agree on it.
CREATE TABLE broadcast_recipients (
  broadcast_id uuid NOT NULL REFERENCES broadcasts (id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (broadcast_id, user_id)
);

-- One push per device of a recipient who has not turned "Tin từ Timi" off.
-- device_id has no foreign key: the outcome is kept after the device goes.
CREATE TABLE broadcast_deliveries (
  broadcast_id uuid NOT NULL REFERENCES broadcasts (id) ON DELETE CASCADE,
  device_id text NOT NULL CHECK (device_id ~ '^[0-9a-f]{64}$'),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'retry', 'sent', 'failed', 'unregistered', 'skipped')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  error_code text CHECK (char_length(error_code) <= 100),
  retry_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (broadcast_id, device_id)
);

CREATE INDEX broadcasts_due_idx ON broadcasts (send_at) WHERE status <> 'sent';
CREATE INDEX broadcast_recipients_user_idx ON broadcast_recipients (user_id);

CREATE TRIGGER broadcasts_set_updated_at BEFORE UPDATE ON broadcasts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- "Tin từ Timi" pushes; off, they still show in the bell.
ALTER TABLE notification_settings ADD COLUMN broadcasts_enabled boolean NOT NULL DEFAULT true;

-- The users an audience names at a moment, for the web app (counts, sending
-- now) and the worker (sending at the set time) alike: those who had joined
-- by then, and of them the ones on Free or Pro then, or who joined in the
-- 30 days before.
CREATE FUNCTION broadcast_audience(kind text, at timestamptz) RETURNS SETOF text
LANGUAGE sql STABLE AS $$
  SELECT u.id FROM users u
  WHERE u.created_at <= at
    AND CASE kind
      WHEN 'all' THEN true
      WHEN 'new' THEN u.created_at > at - interval '30 days'
      WHEN 'pro' THEN EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = u.id AND s.revoked_at IS NULL AND s.starts_at <= at AND s.ends_at > at)
      WHEN 'free' THEN NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = u.id AND s.revoked_at IS NULL AND s.starts_at <= at AND s.ends_at > at)
      ELSE false
    END
$$;

-- Sends a due broadcast: writes down its recipients and, for a push, one
-- delivery per linked device of those who have not turned "Tin từ Timi"
-- off, which the worker then pushes. Called by the web app for a broadcast
-- sent now, and by the worker for one set for later; false when it is not
-- due, already sent or taken back.
CREATE FUNCTION release_broadcast(target uuid) RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  b broadcasts;
BEGIN
  SELECT * INTO b FROM broadcasts WHERE id = target FOR UPDATE;
  IF NOT FOUND OR b.status <> 'scheduled' OR b.revoked_at IS NOT NULL OR b.send_at > now() THEN
    RETURN false;
  END IF;
  INSERT INTO broadcast_recipients (broadcast_id, user_id)
    SELECT target, audience.id FROM broadcast_audience(b.audience, b.send_at) AS audience (id);
  IF b.push THEN
    INSERT INTO broadcast_deliveries (broadcast_id, device_id, user_id)
      SELECT target, d.id, d.user_id
      FROM push_devices d
      JOIN notification_browsers nb ON nb.id = d.browser_id AND nb.user_id = d.user_id AND nb.device_id = d.id
      JOIN broadcast_recipients r ON r.broadcast_id = target AND r.user_id = d.user_id
      WHERE NOT EXISTS (
        SELECT 1 FROM notification_settings s WHERE s.user_id = d.user_id AND NOT s.broadcasts_enabled);
  END IF;
  UPDATE broadcasts SET status = CASE WHEN b.push THEN 'sending' ELSE 'sent' END WHERE id = target;
  RETURN true;
END
$$;

-- migrate:down

DROP FUNCTION release_broadcast(uuid);
DROP FUNCTION broadcast_audience(text, timestamptz);
ALTER TABLE notification_settings DROP COLUMN broadcasts_enabled;
DROP TABLE broadcast_deliveries;
DROP TABLE broadcast_recipients;
DROP TABLE broadcasts;
