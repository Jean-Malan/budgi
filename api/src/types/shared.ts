// Shared types between frontend and backend
export interface BankAccount {
  id: string
  user_id: string
  name: string
  account_type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash'
  account_number?: string
  bank_name?: string
  balance: number
  is_active: boolean
  google_drive_folder_id?: string
  last_sync_at?: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  bank_account_id: string | null
  category_id: string | null
  amount: number
  description: string
  date: string
  is_income: boolean
  is_categorized: boolean
  confidence_score: number | null
  // Debt/IOU fields
  is_debt: boolean
  debt_creditor_id: string | null
  debt_debtor_id: string | null
  debt_split_percentage: number | null
  debt_status: 'active' | 'paid' | 'cancelled' | null
  debt_remaining_amount: number | null
  created_at: string
}

export interface FileProcessingResult {
  success: boolean
  message: string
  transactionsProcessed: number
  duplicatesSkipped: number
  errors?: string[]
}

export interface DriveFolder {
  id: string
  name: string
  webViewLink: string
}

export interface DriveFile {
  id: string
  name: string
  size: string
  modifiedTime: string
  mimeType: string
}