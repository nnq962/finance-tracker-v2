-- migrate:up

-- payOS order codes: whole numbers, unique across every payment.
CREATE SEQUENCE payment_order_code_seq START 100001;

-- One row per Pro checkout opened with payOS. It settles once: paid (with
-- the grant it led to), cancelled or expired, whichever payOS reports first.
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  order_code bigint NOT NULL UNIQUE DEFAULT nextval('payment_order_code_seq'),
  period text NOT NULL CHECK (period IN ('month', 'year')),
  amount bigint NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
  payment_link_id text,
  checkout_url text,
  -- The bank's reference for the transfer that paid it.
  reference text,
  paid_at timestamptz,
  subscription_id uuid REFERENCES subscriptions (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'paid') = (paid_at IS NOT NULL))
);

ALTER SEQUENCE payment_order_code_seq OWNED BY payments.order_code;

CREATE INDEX payments_user_id_created_at_idx ON payments (user_id, created_at);

-- migrate:down

DROP TABLE payments;
