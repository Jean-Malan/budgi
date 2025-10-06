-- Migration 006: Add highlight field to transactions table
-- This migration adds a highlight field to mark transactions for review

-- Add highlight field to transactions table
ALTER TABLE transactions 
ADD COLUMN is_highlighted BOOLEAN DEFAULT FALSE;

-- Add index for better query performance when filtering highlighted transactions
CREATE INDEX idx_transactions_is_highlighted ON transactions(is_highlighted);

-- Add comment for documentation
COMMENT ON COLUMN transactions.is_highlighted IS 'Indicates if this transaction is highlighted for review or has questions';