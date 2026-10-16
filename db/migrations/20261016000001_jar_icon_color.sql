-- migrate:up

-- A savings jar's look (2026-10-16): its icon is now one of the app's
-- category icons (lib/icons/category-icon-registry, about 200) and its colour
-- one of the category colours, both chosen by the user, as a category's are.
-- Before, goal_icon was one of 20 jar ideas that also gave the colour; each
-- becomes the nearest category icon, keeping the colour it had.
ALTER TABLE accounts ADD COLUMN goal_color text;

UPDATE accounts SET
  goal_color = CASE goal_icon
    WHEN 'bike' THEN 'orange' WHEN 'phone' THEN 'blue' WHEN 'tv' THEN 'violet'
    WHEN 'laptop' THEN 'slate' WHEN 'trip' THEN 'cyan' WHEN 'home' THEN 'emerald'
    WHEN 'gift' THEN 'rose' WHEN 'camera' THEN 'amber' WHEN 'car' THEN 'blue'
    WHEN 'fridge' THEN 'cyan' WHEN 'sofa' THEN 'amber' WHEN 'watch' THEN 'slate'
    WHEN 'game' THEN 'violet' WHEN 'guitar' THEN 'orange' WHEN 'clothes' THEN 'pink'
    WHEN 'ring' THEN 'pink' WHEN 'baby' THEN 'rose' WHEN 'study' THEN 'emerald'
    WHEN 'health' THEN 'rose' ELSE 'lime'
  END,
  goal_icon = CASE goal_icon
    WHEN 'bike' THEN 'motorbike' WHEN 'phone' THEN 'smartphone' WHEN 'tv' THEN 'tv'
    WHEN 'laptop' THEN 'laptop' WHEN 'trip' THEN 'plane' WHEN 'home' THEN 'house'
    WHEN 'gift' THEN 'gift' WHEN 'camera' THEN 'devices' WHEN 'car' THEN 'car'
    WHEN 'fridge' THEN 'refrigerator' WHEN 'sofa' THEN 'sofa' WHEN 'watch' THEN 'clock'
    WHEN 'game' THEN 'gamepad' WHEN 'guitar' THEN 'music' WHEN 'clothes' THEN 'shirt'
    WHEN 'ring' THEN 'heart' WHEN 'baby' THEN 'baby' WHEN 'study' THEN 'graduation'
    WHEN 'health' THEN 'stethoscope' ELSE 'piggy-bank'
  END
WHERE type = 'savings';

ALTER TABLE accounts DROP CONSTRAINT accounts_goal_check;
-- A jar has all three; any other account none of its goal.
ALTER TABLE accounts ADD CONSTRAINT accounts_goal_check CHECK (
  CASE WHEN type = 'savings'
    THEN goal_target IS NOT NULL AND goal_icon IS NOT NULL AND goal_color IS NOT NULL
    ELSE goal_target IS NULL AND goal_icon IS NULL AND goal_color IS NULL AND goal_due IS NULL AND completed_at IS NULL
  END
);
ALTER TABLE accounts ADD CONSTRAINT accounts_goal_color_check
  CHECK (char_length(goal_color) BETWEEN 1 AND 32);

-- migrate:down

ALTER TABLE accounts DROP CONSTRAINT accounts_goal_color_check;
ALTER TABLE accounts DROP CONSTRAINT accounts_goal_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_goal_check CHECK (
  (type = 'savings') = (goal_target IS NOT NULL AND goal_icon IS NOT NULL)
  AND (type = 'savings' OR (goal_due IS NULL AND completed_at IS NULL))
);
UPDATE accounts SET goal_icon = CASE goal_icon
    WHEN 'motorbike' THEN 'bike' WHEN 'smartphone' THEN 'phone' WHEN 'tv' THEN 'tv'
    WHEN 'laptop' THEN 'laptop' WHEN 'plane' THEN 'trip' WHEN 'house' THEN 'home'
    WHEN 'gift' THEN 'gift' WHEN 'devices' THEN 'camera' WHEN 'car' THEN 'car'
    WHEN 'refrigerator' THEN 'fridge' WHEN 'sofa' THEN 'sofa' WHEN 'clock' THEN 'watch'
    WHEN 'gamepad' THEN 'game' WHEN 'music' THEN 'guitar' WHEN 'shirt' THEN 'clothes'
    WHEN 'heart' THEN 'ring' WHEN 'baby' THEN 'baby' WHEN 'graduation' THEN 'study'
    WHEN 'stethoscope' THEN 'health' ELSE 'other'
  END
WHERE type = 'savings';
ALTER TABLE accounts DROP COLUMN goal_color;
