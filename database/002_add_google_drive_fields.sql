-- Add Google Drive integration fields to bank accounts
ALTER TABLE bank_accounts 
ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_accounts_drive_folder_id ON bank_accounts(google_drive_folder_id);

-- Show the updated table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bank_accounts' 
ORDER BY ordinal_position;