-- migrate:up

-- Percentage discounts on Pro, shared by everyone who has the code. Each
-- user can use a code once; a code may stop at a date or a number of uses.
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  -- Stored upper case; entered in any case.
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{3,20}$'),
  percent_off integer NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  expires_at timestamptz,
  max_redemptions integer CHECK (max_redemptions > 0),
  active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- A use is counted once Pro is granted with the code, not when checkout opens.
CREATE TABLE coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  coupon_id uuid NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

-- What a checkout would have cost and what the code took off.
ALTER TABLE payments
  ADD COLUMN coupon_id uuid REFERENCES coupons (id) ON DELETE SET NULL,
  ADD COLUMN discount bigint NOT NULL DEFAULT 0 CHECK (discount >= 0);

-- migrate:down

ALTER TABLE payments DROP COLUMN discount, DROP COLUMN coupon_id;
DROP TABLE coupon_redemptions;
DROP TABLE coupons;
