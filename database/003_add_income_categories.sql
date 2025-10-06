-- Add income categories for all users
-- Run this only if these categories don't already exist in your database

DO $$
DECLARE
  jean_id UUID;
  izzy_id UUID;
  shared_id UUID;
BEGIN
  SELECT id INTO jean_id FROM users WHERE name = 'Jean';
  SELECT id INTO izzy_id FROM users WHERE name = 'Izzy';
  SELECT id INTO shared_id FROM users WHERE name = 'Shared';
  
  -- Jean's Income Categories
  INSERT INTO categories (user_id, name, color) VALUES
    (jean_id, 'Salary (KPMG)', '#F97316'),
    (jean_id, 'Miscellaneous Income', '#78350F')
  ON CONFLICT DO NOTHING; -- Skip if already exists
  
  -- Izzy's Income Categories
  INSERT INTO categories (user_id, name, color) VALUES
    (izzy_id, 'Salary (Deloitte)', '#F97316'),
    (izzy_id, 'Miscellaneous Income', '#78350F')
  ON CONFLICT DO NOTHING; -- Skip if already exists
  
  -- Shared Income Categories
  INSERT INTO categories (user_id, name, color) VALUES
    (shared_id, 'Jean Income', '#F97316'),
    (shared_id, 'Izzy Income', '#78350F')
  ON CONFLICT DO NOTHING; -- Skip if already exists

END $$;

-- Verify the categories were added
SELECT u.name as user_name, c.name as category_name, c.color
FROM categories c
JOIN users u ON c.user_id = u.id
WHERE c.name LIKE '%Income%' OR c.name LIKE '%Salary%'
ORDER BY u.name, c.name;