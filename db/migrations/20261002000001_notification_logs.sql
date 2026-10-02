-- migrate:up

-- One daily-reminder run per user and Vietnam calendar day, written by the
-- reminder worker (backend/). The lease marks the run a worker currently owns,
-- so two workers never send the same reminder.
CREATE TABLE notification_logs (
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL
    CHECK (status IN ('processing', 'retry', 'sent', 'failed', 'waiting')),
  attempt_id uuid,
  lease_until timestamptz,
  -- Picked once per day, so retries resend the same text.
  message_title text NOT NULL,
  message_body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date),
  CHECK ((attempt_id IS NULL) = (lease_until IS NULL))
);

-- Outcome per device of a run. device_id has no foreign key: the result is
-- kept after the device is removed.
CREATE TABLE notification_log_devices (
  user_id text NOT NULL,
  date date NOT NULL,
  device_id text NOT NULL CHECK (device_id ~ '^[0-9a-f]{64}$'),
  status text NOT NULL
    CHECK (status IN ('sending', 'retry', 'sent', 'unregistered', 'failed', 'detached')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  error_code text CHECK (char_length(error_code) <= 100),
  retry_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date, device_id),
  FOREIGN KEY (user_id, date) REFERENCES notification_logs (user_id, date) ON DELETE CASCADE
);

-- The worker removes logs older than 90 days.
CREATE INDEX notification_logs_date_idx ON notification_logs (date);

-- migrate:down

DROP TABLE notification_log_devices;
DROP TABLE notification_logs;
