-- Drop all tables and start fresh
-- WARNING: This will delete all data! Only run if you want a clean start.

DROP TABLE IF EXISTS debt_payments CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS processing_log CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS budget_entries CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing indexes (in case they exist independently)
DROP INDEX IF EXISTS idx_bank_accounts_user_id;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_bank_account_id;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_category_id;
DROP INDEX IF EXISTS idx_transactions_is_debt;
DROP INDEX IF EXISTS idx_transactions_debt_creditor_id;
DROP INDEX IF EXISTS idx_transactions_debt_debtor_id;
DROP INDEX IF EXISTS idx_transactions_debt_status;
DROP INDEX IF EXISTS idx_budgets_user_id;
DROP INDEX IF EXISTS idx_categories_user_id;
DROP INDEX IF EXISTS idx_budget_entries_user_id;
DROP INDEX IF EXISTS idx_budget_entries_category_id;
DROP INDEX IF EXISTS idx_budget_entries_period;
DROP INDEX IF EXISTS idx_debts_creditor_id;
DROP INDEX IF EXISTS idx_debts_debtor_id;
DROP INDEX IF EXISTS idx_debts_bank_account_id;
DROP INDEX IF EXISTS idx_debts_status;
DROP INDEX IF EXISTS idx_debt_payments_transaction_id;
DROP INDEX IF EXISTS idx_debt_payments_payer_id;
DROP INDEX IF EXISTS idx_debt_payments_bank_account_id;

SELECT 'All tables dropped successfully' as status;