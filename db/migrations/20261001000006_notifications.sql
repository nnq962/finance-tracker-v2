-- migrate:up

CREATE TABLE notification_settings (
  user_id text PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  notifications_enabled boolean NOT NULL DEFAULT false,
  daily_reminder_time time(0) NOT NULL DEFAULT '20:00',
  time_zone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  -- Computed by the server; the reminder worker sends when it is due.
  next_reminder_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (notifications_enabled OR next_reminder_at IS NULL)
);

-- A browser profile, identified by an HttpOnly cookie. session_id rotates on
-- login/logout so late requests cannot reattach a device to another session.
CREATE TABLE notification_browsers (
  id uuid PRIMARY KEY,
  user_id text REFERENCES users (id) ON DELETE SET NULL,
  session_id uuid NOT NULL,
  device_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- An FCM registration. id is sha256(fid); being the primary key, a
-- registration belongs to exactly one user at a time.
CREATE TABLE push_devices (
  id text PRIMARY KEY CHECK (id ~ '^[0-9a-f]{64}$'),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  fid text NOT NULL CHECK (char_length(fid) BETWEEN 1 AND 256),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  browser_id uuid NOT NULL REFERENCES notification_browsers (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_browsers
  ADD FOREIGN KEY (device_id) REFERENCES push_devices (id) ON DELETE SET NULL;

CREATE INDEX notification_settings_due_idx ON notification_settings (next_reminder_at)
  WHERE notifications_enabled;
CREATE INDEX push_devices_user_idx ON push_devices (user_id);
CREATE INDEX notification_browsers_device_idx ON notification_browsers (device_id)
  WHERE device_id IS NOT NULL;

CREATE TRIGGER notification_settings_set_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER notification_browsers_set_updated_at BEFORE UPDATE ON notification_browsers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER push_devices_set_updated_at BEFORE UPDATE ON push_devices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down

ALTER TABLE notification_browsers DROP CONSTRAINT notification_browsers_device_id_fkey;
DROP TABLE push_devices;
DROP TABLE notification_browsers;
DROP TABLE notification_settings;
