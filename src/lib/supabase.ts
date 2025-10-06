import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          period_start: string
          period_end: string
          total_income: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period_start: string
          period_end: string
          total_income: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period_start?: string
          period_end?: string
          total_income?: number
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          budget_amount: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          budget_amount: number
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          budget_amount?: number
          color?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: number
          description: string
          date: string
          is_income: boolean
          is_categorized: boolean
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          description: string
          date: string
          is_income: boolean
          is_categorized?: boolean
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          amount?: number
          description?: string
          date?: string
          is_income?: boolean
          is_categorized?: boolean
          confidence_score?: number | null
          created_at?: string
        }
      }
      processing_log: {
        Row: {
          id: string
          file_name: string
          file_hash: string
          processed_at: string
          transaction_count: number
        }
        Insert: {
          id?: string
          file_name: string
          file_hash: string
          processed_at?: string
          transaction_count: number
        }
        Update: {
          id?: string
          file_name?: string
          file_hash?: string
          processed_at?: string
          transaction_count?: number
        }
      }
    }
  }
}