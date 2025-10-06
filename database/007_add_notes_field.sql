-- Migration 007: Add notes field to transactions table
-- This migration adds a notes field to store additional information about transactions

-- Add notes field to transactions table
ALTER TABLE transactions
ADD COLUMN notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN transactions.notes IS 'Additional notes or comments about the transaction';
