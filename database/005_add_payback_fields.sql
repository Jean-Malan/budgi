-- Migration 005: Add payback fields to transactions table
-- This migration adds fields to support payback transaction functionality
-- without breaking existing data or functionality

-- Add payback fields to transactions table
ALTER TABLE transactions 
ADD COLUMN is_payback BOOLEAN DEFAULT FALSE,
ADD COLUMN payback_from_user_id UUID REFERENCES users(id);

-- Add indexes for better query performance
CREATE INDEX idx_transactions_is_payback ON transactions(is_payback);
CREATE INDEX idx_transactions_payback_from_user_id ON transactions(payback_from_user_id);

-- Add comments for documentation
COMMENT ON COLUMN transactions.is_payback IS 'Indicates if this transaction is a payback payment';
COMMENT ON COLUMN transactions.payback_from_user_id IS 'User ID of the person who is paying back money';