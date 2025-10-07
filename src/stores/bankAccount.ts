import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface BankAccount {
  id: string
  user_id: string
  name: string
  account_type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash'
  account_number?: string
  bank_name?: string
  balance: number
  is_active: boolean
  created_at: string
}

export const useBankAccountStore = defineStore('bankAccount', () => {
  const authStore = useAuthStore()
  const bankAccounts = ref<BankAccount[]>([])
  const isLoading = ref(false)

  const activeBankAccounts = computed(() => 
    bankAccounts.value.filter(account => account.is_active)
  )

  const currentUserBankAccounts = computed(() => 
    activeBankAccounts.value.filter(account => account.user_id === authStore.currentUser?.id)
  )

  const loadBankAccounts = async () => {
    if (!authStore.currentUser) return

    isLoading.value = true
    try {
      // If in view all mode, load all bank accounts
      if (authStore.viewAllMode && authStore.currentUser.name === 'Shared') {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        bankAccounts.value = data || []
      } else {
        // Normal mode: load only current user's bank accounts
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', authStore.currentUser.id)
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        bankAccounts.value = data || []
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const createBankAccount = async (
    name: string,
    accountType: BankAccount['account_type'],
    bankName?: string,
    accountNumber?: string
  ) => {
    if (!authStore.currentUser) throw new Error('No user selected')

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: authStore.currentUser.id,
          name,
          account_type: accountType,
          bank_name: bankName,
          account_number: accountNumber,
          balance: 0,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      
      bankAccounts.value.push(data)
      return data
    } catch (error) {
      console.error('Error creating bank account:', error)
      throw error
    }
  }

  const updateBankAccount = async (
    id: string,
    updates: Partial<Pick<BankAccount, 'name' | 'account_type' | 'bank_name' | 'account_number' | 'balance'>>
  ) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const index = bankAccounts.value.findIndex(account => account.id === id)
      if (index !== -1) {
        bankAccounts.value[index] = data
      }

      return data
    } catch (error) {
      console.error('Error updating bank account:', error)
      throw error
    }
  }

  const deleteBankAccount = async (id: string) => {
    try {
      // Check if account has transactions
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('id')
        .eq('bank_account_id', id)
        .limit(1)

      if (transactionError) throw transactionError

      if (transactions && transactions.length > 0) {
        throw new Error('Cannot delete bank account with existing transactions')
      }

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      bankAccounts.value = bankAccounts.value.filter(account => account.id !== id)
    } catch (error) {
      console.error('Error deleting bank account:', error)
      throw error
    }
  }

  const getBankAccountById = (id: string) => {
    return bankAccounts.value.find(account => account.id === id)
  }

  const updateBalance = async (id: string, newBalance: number) => {
    return updateBankAccount(id, { balance: newBalance })
  }

  return {
    bankAccounts,
    activeBankAccounts,
    currentUserBankAccounts,
    isLoading,
    loadBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    getBankAccountById,
    updateBalance
  }
})