
-- Remove duplicate funders, keeping the first inserted (by created_at)
-- First delete orphaned funder_focus_areas
DELETE FROM funder_focus_areas
WHERE funder_id IN (
  SELECT f.id FROM funders f
  WHERE f.id NOT IN (
    SELECT DISTINCT ON (donor_name) id FROM funders ORDER BY donor_name, created_at ASC
  )
);

-- Delete orphaned funder_windows
DELETE FROM funder_windows
WHERE funder_id IN (
  SELECT f.id FROM funders f
  WHERE f.id NOT IN (
    SELECT DISTINCT ON (donor_name) id FROM funders ORDER BY donor_name, created_at ASC
  )
);

-- Delete duplicate funders
DELETE FROM funders
WHERE id NOT IN (
  SELECT DISTINCT ON (donor_name) id FROM funders ORDER BY donor_name, created_at ASC
);
