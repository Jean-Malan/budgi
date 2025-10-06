-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_accounts table
CREATE TABLE bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'credit', 'investment', 'cash')),
  account_number TEXT,
  bank_name TEXT,
  balance DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_income DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_entries table
CREATE TABLE budget_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  budget_period DATE NOT NULL, -- First day of the month (e.g., 2024-01-01 for January 2024)
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, budget_period)
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_income BOOLEAN NOT NULL DEFAULT FALSE,
  is_categorized BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_score DECIMAL(3,2),
  -- Debt/IOU fields
  is_debt BOOLEAN NOT NULL DEFAULT FALSE,
  debt_creditor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  debt_debtor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  debt_split_percentage DECIMAL(5,2),
  debt_status TEXT CHECK (debt_status IN ('active', 'paid', 'cancelled')),
  debt_remaining_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processing_log table
CREATE TABLE processing_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL UNIQUE,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transaction_count INTEGER NOT NULL DEFAULT 0
);

-- Note: debts table removed - debt tracking is now handled directly in transactions table

-- Create debt_payments table for tracking payments against debt transactions
CREATE TABLE debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  notes TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_bank_account_id ON transactions(bank_account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_is_debt ON transactions(is_debt);
CREATE INDEX idx_transactions_debt_creditor_id ON transactions(debt_creditor_id);
CREATE INDEX idx_transactions_debt_debtor_id ON transactions(debt_debtor_id);
CREATE INDEX idx_transactions_debt_status ON transactions(debt_status);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_budget_entries_user_id ON budget_entries(user_id);
CREATE INDEX idx_budget_entries_category_id ON budget_entries(category_id);
CREATE INDEX idx_budget_entries_period ON budget_entries(budget_period);
-- Debt-related indexes removed since debts table is removed
CREATE INDEX idx_debt_payments_transaction_id ON debt_payments(transaction_id);
CREATE INDEX idx_debt_payments_payer_id ON debt_payments(payer_id);
CREATE INDEX idx_debt_payments_bank_account_id ON debt_payments(bank_account_id);

-- Insert default users (Jean, Izzy, and Shared)
INSERT INTO users (name, email) VALUES 
  ('Jean', 'jean@example.com'),
  ('Izzy', 'izzy@example.com'),
  ('Shared', 'shared@example.com');

-- Insert categories for all three users
DO $$
DECLARE
  jean_id UUID;
  izzy_id UUID;
  shared_id UUID;
BEGIN
  SELECT id INTO jean_id FROM users WHERE name = 'Jean';
  SELECT id INTO izzy_id FROM users WHERE name = 'Izzy';
  SELECT id INTO shared_id FROM users WHERE name = 'Shared';
  
  -- Jean's Individual Categories
  INSERT INTO categories (user_id, name, color) VALUES
    (jean_id, 'Salary (KPMG)', '#F97316'),
    (jean_id, 'Miscellaneous Income', '#78350F'),
    -- Personal Food & Dining
    (jean_id, 'Dining Out', '#F97316'),
    (jean_id, 'Food Delivery', '#B91C1C'),
    
    -- Personal Transportation
    (jean_id, 'Fuel & Petrol', '#F59E0B'),
    (jean_id, 'Public Transport', '#D97706'),
    (jean_id, 'Uber & Rideshare', '#B45309'),
    (jean_id, 'Car Maintenance', '#92400E'),
    (jean_id, 'Car Insurance', '#78350F'),
    (jean_id, 'Parking', '#451A03'),
    
    -- Personal Entertainment & Lifestyle
    (jean_id, 'Entertainment (Events, Sports, Hobbies, Books etc.)', '#7C3AED'),
    
    -- Personal Shopping
    (jean_id, 'Clothing & Fashion', '#EC4899'),
    (jean_id, 'Personal Care & Beauty', '#DB2777'),
    (jean_id, 'Health & Pharmacy', '#BE185D'),
    (jean_id, 'Electronics & Tech', '#9D174D'),
    (jean_id, 'Gifts & Occasions', '#701A75'),
    (jean_id, 'Subscriptions (TV, Claude, OpenAi etc)', '#701A75'),
    
    -- Personal Health & Fitness
    (jean_id, 'Gym & Fitness', '#059669'),
    (jean_id, 'Medical & Dental', '#047857'),
    (jean_id, 'Health Insurance', '#065F46'),
    (jean_id, 'Supplements & Vitamins', '#064E3B'),
    
    -- Personal Financial
    (jean_id, 'Bank Fees', '#374151'),
    (jean_id, 'Investment Fees', '#4B5563'),
    (jean_id, 'Professional Services', '#6B7280'),
    (jean_id, 'Insurance', '#9CA3AF'),
    (jean_id, 'Tax & Accounting', '#D1D5DB'),
    
    -- Personal Development
    (jean_id, 'Courses & Training', '#7C2D12'),
    (jean_id, 'Professional Development', '#92400E'),
    
    -- Personal Miscellaneous
    (jean_id, 'Charity & Donations', '#84CC16'),
    (jean_id, 'Miscellaneous', '#525252');
    
  -- Izzy's Individual Categories (same structure)
  INSERT INTO categories (user_id, name, color) VALUES
    (izzy_id, 'Salary (Deloitte)', '#F97316'),
    (izzy_id, 'Miscellaneous Income', '#78350F'),
    -- Personal Food & Dining
    (izzy_id, 'Dining Out', '#F97316'),
    (izzy_id, 'Food Delivery', '#B91C1C'),
    
    -- Personal Transportation
    (izzy_id, 'Fuel & Petrol', '#F59E0B'),
    (izzy_id, 'Public Transport', '#D97706'),
    (izzy_id, 'Uber & Rideshare', '#B45309'),
    (izzy_id, 'Car Maintenance', '#92400E'),
    (izzy_id, 'Car Insurance', '#78350F'),
    (izzy_id, 'Parking', '#451A03'),
    
    -- Personal Entertainment & Lifestyle
    (izzy_id, 'Entertainment (Events, Sports, Hobbies, Books etc.)', '#7C3AED'),
    
    -- Personal Shopping
    (izzy_id, 'Clothing & Fashion', '#EC4899'),
    (izzy_id, 'Personal Care & Beauty', '#DB2777'),
    (izzy_id, 'Health & Pharmacy', '#BE185D'),
    (izzy_id, 'Electronics & Tech', '#9D174D'),
    (izzy_id, 'Gifts & Occasions', '#701A75'),
    
    -- Personal Health & Fitness
    (izzy_id, 'Gym & Fitness', '#059669'),
    (izzy_id, 'Medical & Dental', '#047857'),
    (izzy_id, 'Health Insurance', '#065F46'),
    (izzy_id, 'Supplements & Vitamins', '#064E3B'),
    
    -- Personal Financial
    (izzy_id, 'Bank Fees', '#374151'),
    (izzy_id, 'Investment Fees', '#4B5563'),
    (izzy_id, 'Professional Services', '#6B7280'),
    (izzy_id, 'Insurance', '#9CA3AF'),
    (izzy_id, 'Tax & Accounting', '#D1D5DB'),
    
    -- Personal Development
    (izzy_id, 'Courses & Training', '#7C2D12'),
    (izzy_id, 'Professional Development', '#92400E'),
    
    -- Personal Miscellaneous
    (izzy_id, 'Charity & Donations', '#84CC16'),
    (izzy_id, 'Miscellaneous', '#525252');
    
  -- Shared Categories
  INSERT INTO categories (user_id, name, color) VALUES
    (shared_id, 'Jean Income', '#F97316'),
    (shared_id, 'Izzy Income', '#78350F'),
    -- Shared Food & Groceries
    (shared_id, 'Dining Out', '#F97316'),
    (shared_id, 'Food Delivery', '#B91C1C'),
    
    -- Personal Transportation
    (shared_id, 'Fuel & Petrol', '#F59E0B'),
    (shared_id, 'Public Transport', '#D97706'),
    (shared_id, 'Uber & Rideshare', '#B45309'),
    (shared_id, 'Car Maintenance', '#92400E'),
    (shared_id, 'Car Insurance', '#78350F'),
    (shared_id, 'Parking', '#451A03'),
    
    -- Personal Entertainment & Lifestyle
    (shared_id, 'Entertainment (Events, Sports, Hobbies, Books etc.)', '#7C3AED'),
    
    -- Personal Shopping
    (shared_id, 'Clothing & Fashion', '#EC4899'),
    (shared_id, 'Personal Care & Beauty', '#DB2777'),
    (shared_id, 'Health & Pharmacy', '#BE185D'),
    (shared_id, 'Electronics & Tech', '#9D174D'),
    (shared_id, 'Gifts & Occasions', '#701A75'),
    
    -- Personal Health & Fitness
    (shared_id, 'Gym & Fitness', '#059669'),
    (shared_id, 'Medical & Dental', '#047857'),
    (shared_id, 'Health Insurance', '#065F46'),
    (shared_id, 'Supplements & Vitamins', '#064E3B'),
    
    -- Personal Financial
    (shared_id, 'Bank Fees', '#374151'),
    (shared_id, 'Investment Fees', '#4B5563'),
    (shared_id, 'Professional Services', '#6B7280'),
    (shared_id, 'Insurance', '#9CA3AF'),
    (shared_id, 'Tax & Accounting', '#D1D5DB'),
    
    -- Personal Development
    (shared_id, 'Courses & Training', '#7C2D12'),
    (shared_id, 'Professional Development', '#92400E'),
    
    -- Personal Miscellaneous
    (shared_id, 'Charity & Donations', '#84CC16'),
    (shared_id, 'Miscellaneous', '#525252');
END $$;

-- Insert default bank accounts for all users
DO $$
DECLARE
  jean_id UUID;
  izzy_id UUID;
  shared_id UUID;
BEGIN
  SELECT id INTO jean_id FROM users WHERE name = 'Jean';
  SELECT id INTO izzy_id FROM users WHERE name = 'Izzy';
  SELECT id INTO shared_id FROM users WHERE name = 'Shared';
  
  -- Jean's Bank Accounts
  INSERT INTO bank_accounts (user_id, name, account_type, bank_name) VALUES
    (jean_id, 'Jean Checking', 'checking', 'Scotia Bank'),
    (jean_id, 'Jean Savings', 'savings', 'Scotia Bank'),
    (jean_id, 'Jean Credit Card', 'credit', 'Scotia Bank'),
    (jean_id, 'Cash', 'cash', NULL);
    
  -- Izzy's Bank Accounts
  INSERT INTO bank_accounts (user_id, name, account_type, bank_name) VALUES
    (izzy_id, 'Izzy Checking', 'checking', 'Main Bank'),
    (izzy_id, 'Izzy Savings', 'savings', 'Main Bank'),
    (izzy_id, 'Izzy Credit Card BMO', 'credit', 'Credit Union'),
    (izzy_id, 'Izzy Credit Card Scotia Bank', 'credit', 'Scotia Bank'),
    (izzy_id, 'Cash', 'cash', NULL);
    
  -- Shared Bank Accounts
  INSERT INTO bank_accounts (user_id, name, account_type, bank_name) VALUES
    (shared_id, 'Joint Checking', 'checking', 'Scotia Bank'),
    (shared_id, 'Joint Savings', 'savings', 'Scotia Bank'),
    (shared_id, 'Shared Cash', 'cash', NULL);
END $$;