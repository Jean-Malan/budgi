-- Add transaction tags/groups functionality
-- This allows users to group transactions together for tracking project costs, events, etc.

-- Create tags table
CREATE TABLE transaction_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create junction table for transaction-tag relationships (many-to-many)
CREATE TABLE transaction_tag_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES transaction_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(transaction_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX idx_transaction_tags_user_id ON transaction_tags(user_id);
CREATE INDEX idx_transaction_tag_assignments_transaction_id ON transaction_tag_assignments(transaction_id);
CREATE INDEX idx_transaction_tag_assignments_tag_id ON transaction_tag_assignments(tag_id);

-- Insert some example tags for demonstration
DO $$
DECLARE
  jean_id UUID;
  izzy_id UUID;
  shared_id UUID;
BEGIN
  SELECT id INTO jean_id FROM users WHERE name = 'Jean';
  SELECT id INTO izzy_id FROM users WHERE name = 'Izzy';
  SELECT id INTO shared_id FROM users WHERE name = 'Shared';
  
  -- Jean's Tags
  INSERT INTO transaction_tags (user_id, name, description, color) VALUES
    (jean_id, 'Vacation 2024', 'Summer vacation expenses', '#F59E0B'),
    (jean_id, 'Home Renovation', 'Kitchen and bathroom updates', '#10B981'),
    (jean_id, 'Work Expenses', 'Business-related costs', '#6366F1')
  ON CONFLICT DO NOTHING;
  
  -- Izzy's Tags
  INSERT INTO transaction_tags (user_id, name, description, color) VALUES
    (izzy_id, 'Vacation 2024', 'Summer vacation expenses', '#F59E0B'),
    (izzy_id, 'Car Maintenance', 'Vehicle upkeep and repairs', '#EF4444'),
    (izzy_id, 'Education', 'Courses and training', '#8B5CF6')
  ON CONFLICT DO NOTHING;
  
  -- Shared Tags
  INSERT INTO transaction_tags (user_id, name, description, color) VALUES
    (shared_id, 'House Projects', 'Joint home improvement expenses', '#10B981'),
    (shared_id, 'Date Nights', 'Couple activities and dining', '#EC4899'),
    (shared_id, 'Travel Together', 'Shared vacation and trip costs', '#F59E0B')
  ON CONFLICT DO NOTHING;

END $$;

-- Verify the tags were added
SELECT u.name as user_name, tt.name as tag_name, tt.description, tt.color
FROM transaction_tags tt
JOIN users u ON tt.user_id = u.id
ORDER BY u.name, tt.name;