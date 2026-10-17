-- migrate:up

-- Limit pushes, set by the user (2026-10-17): on or off, and the early
-- warning at 80% or 90% of a limit (null: none, only once past it). Past
-- 100% always pushes while they are on. A user without a settings row has
-- them on at 80%.
ALTER TABLE notification_settings
  ADD COLUMN budget_alerts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN budget_alert_level smallint DEFAULT 80 CHECK (budget_alert_level IN (80, 90));

ALTER TABLE budget_alerts DROP CONSTRAINT budget_alerts_level_check;
ALTER TABLE budget_alerts ADD CONSTRAINT budget_alerts_level_check CHECK (level IN (80, 90, 100));

-- "Để sau" on the hint to change a limit: hidden for the rest of that month
-- (its first day).
ALTER TABLE budgets ADD COLUMN hint_dismissed_month date;

-- migrate:down

ALTER TABLE budgets DROP COLUMN hint_dismissed_month;
DELETE FROM budget_alerts WHERE level = 90;
ALTER TABLE budget_alerts DROP CONSTRAINT budget_alerts_level_check;
ALTER TABLE budget_alerts ADD CONSTRAINT budget_alerts_level_check CHECK (level IN (80, 100));
ALTER TABLE notification_settings
  DROP COLUMN budget_alert_level,
  DROP COLUMN budget_alerts_enabled;
