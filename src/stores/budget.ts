import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface Category {
  id: string
  name: string
  color: string
  user_id?: string
}

export interface TransactionTag {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  created_at: string
}

export interface TransactionTagAssignment {
  id: string
  transaction_id: string
  tag_id: string
  created_at: string
}

export interface BudgetEntry {
  id: string
  user_id: string
  category_id: string
  budget_period: string
  amount: number
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  period_start: string
  period_end: string
  total_income: number
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
  // Payback fields
  is_payback: boolean
  payback_from_user_id: string | null
  // Highlight field
  is_highlighted: boolean
  created_at: string
}

export const useBudgetStore = defineStore('budget', () => {
  const authStore = useAuthStore()
  
  const categories = ref<Category[]>([])
  const budgetEntries = ref<BudgetEntry[]>([])
  const currentBudget = ref<Budget | null>(null)
  const transactions = ref<Transaction[]>([])
  const transactionTags = ref<TransactionTag[]>([])
  const tagAssignments = ref<TransactionTagAssignment[]>([])
  const isLoading = ref(false)

  const uncategorizedTransactions = computed(() => 
    transactions.value?.filter(t => !t.is_categorized && !t.is_income) || []
  )

  const totalSpent = computed(() => 
    transactions.value
      ?.filter(t => !t.is_income && t.is_categorized)
      ?.reduce((sum, t) => sum + t.amount, 0) || 0
  )

  const totalBudget = computed(() => 
    budgetEntries.value?.reduce((sum, entry) => sum + entry.amount, 0) || 0
  )

  const loadCategories = async () => {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')

      if (error) throw error
      categories.value = data || []
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadBudgetEntries = async (budgetPeriod: string) => {
    if (!authStore.currentUser) return
    
    try {
      const { data, error } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('budget_period', budgetPeriod)
        .eq('user_id', authStore.currentUser.id)

      if (error) throw error
      budgetEntries.value = data || []
    } catch (error) {
      console.error('Error loading budget entries:', error)
    }
  }

  const loadBudget = async (periodStart: string, periodEnd: string) => {
    if (!authStore.currentUser) return
    
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', authStore.currentUser.id)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .maybeSingle()

      if (error) throw error
      currentBudget.value = data
    } catch (error) {
      console.error('Error loading budget:', error)
      currentBudget.value = null
    }
  }

  const loadTransactions = async (periodStart: string, periodEnd: string) => {
    if (!authStore.currentUser) return
    
    try {
      // First get the current user's bank account IDs
      const { data: userBankAccounts, error: bankError } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('user_id', authStore.currentUser.id)
        .eq('is_active', true)

      if (bankError) throw bankError
      
      if (!userBankAccounts || userBankAccounts.length === 0) {
        transactions.value = []
        return
      }

      const bankAccountIds = userBankAccounts.map(account => account.id)

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('bank_account_id', bankAccountIds)
        .gte('date', periodStart)
        .lte('date', periodEnd)
        .order('date', { ascending: false })

      if (error) throw error
      transactions.value = data || []
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const createCategory = async (name: string, budgetAmount: number, color: string) => {
    if (!authStore.currentUser) return

    try {
      // Create the category without user_id to make it shared across all users
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name,
          color
        })
        .select()
        .single()

      if (error) throw error
      
      // Add to local state
      categories.value.push(data)
      
      // If budgetAmount > 0, create a budget entry for current user for current month
      if (budgetAmount > 0 && authStore.currentUser?.id) {
        const now = new Date()
        const budgetPeriod = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] as string

        await createOrUpdateBudgetEntry(
          authStore.currentUser.id,
          data.id,
          budgetPeriod,
          budgetAmount
        )
      }
      
      return data
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = data
      }
      return data
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  const createOrUpdateBudgetEntry = async (userId: string, categoryId: string, budgetPeriod: string, amount: number) => {
    try {
      const { data, error } = await supabase
        .from('budget_entries')
        .upsert({
          user_id: userId,
          category_id: categoryId,
          budget_period: budgetPeriod,
          amount: amount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, category_id, budget_period'
        })
        .select()
        .single()

      if (error) throw error
      
      const index = budgetEntries.value.findIndex(e => 
        e.user_id === userId && e.category_id === categoryId && e.budget_period === budgetPeriod
      )
      if (index !== -1) {
        budgetEntries.value[index] = data
      } else {
        budgetEntries.value.push(data)
      }
      return data
    } catch (error) {
      console.error('Error creating/updating budget entry:', error)
      throw error
    }
  }

  const getBudgetEntry = (userId: string, categoryId: string, budgetPeriod: string): BudgetEntry | undefined => {
    return budgetEntries.value.find(e => 
      e.user_id === userId && e.category_id === categoryId && e.budget_period === budgetPeriod
    )
  }

  const saveBudget = async (periodStart: string, periodEnd: string, totalIncome: number) => {
    if (!authStore.currentUser) return

    try {
      const { data, error } = await supabase
        .from('budgets')
        .upsert({
          user_id: authStore.currentUser.id,
          period_start: periodStart,
          period_end: periodEnd,
          total_income: totalIncome
        })
        .select()
        .single()

      if (error) throw error
      currentBudget.value = data
      return data
    } catch (error) {
      console.error('Error saving budget:', error)
      throw error
    }
  }

  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()

      if (error) throw error
      
      // Add to local state
      transactions.value.unshift(data)
      return data
    } catch (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  }

  const categorizeTransaction = async (transactionId: string, categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          category_id: categoryId,
          is_categorized: true
        })
        .eq('id', transactionId)
        .select()
        .single()

      if (error) throw error
      
      const index = transactions.value.findIndex(t => t.id === transactionId)
      if (index !== -1) {
        transactions.value[index] = data
      }
      return data
    } catch (error) {
      console.error('Error categorizing transaction:', error)
      throw error
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      // First check if any transactions are allocated to this category
      const { data: transactionCheck, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1)

      if (checkError) throw checkError
      
      if (transactionCheck && transactionCheck.length > 0) {
        throw new Error('Cannot delete category: transactions are allocated to it')
      }

      // Delete budget entries for this category
      const { error: budgetEntriesError } = await supabase
        .from('budget_entries')
        .delete()
        .eq('category_id', categoryId)

      if (budgetEntriesError) throw budgetEntriesError

      // Delete the category
      const { error: categoryError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (categoryError) throw categoryError

      // Remove from local state
      const categoryIndex = categories.value.findIndex(c => c.id === categoryId)
      if (categoryIndex !== -1) {
        categories.value.splice(categoryIndex, 1)
      }

      // Remove budget entries from local state
      budgetEntries.value = budgetEntries.value.filter(e => e.category_id !== categoryId)

      return true
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  const loadTransactionTags = async () => {
    if (!authStore.currentUser) return
    
    try {
      const { data, error } = await supabase
        .from('transaction_tags')
        .select('*')
        .eq('user_id', authStore.currentUser.id)
        .order('name')

      if (error) throw error
      transactionTags.value = data || []
    } catch (error) {
      console.error('Error loading transaction tags:', error)
    }
  }

  const loadTagAssignments = async () => {
    if (!authStore.currentUser) return
    
    try {
      const { data, error } = await supabase
        .from('transaction_tag_assignments')
        .select(`
          *,
          transactions!inner(user_id)
        `)
        .eq('transactions.user_id', authStore.currentUser.id)

      if (error) throw error
      tagAssignments.value = data || []
    } catch (error) {
      console.error('Error loading tag assignments:', error)
    }
  }

  const createTag = async (name: string, description: string = '', color: string = '#3B82F6') => {
    if (!authStore.currentUser) return

    try {
      const { data, error } = await supabase
        .from('transaction_tags')
        .insert({
          user_id: authStore.currentUser.id,
          name,
          description,
          color
        })
        .select()
        .single()

      if (error) throw error
      
      transactionTags.value.push(data)
      return data
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  }

  const assignTagToTransaction = async (transactionId: string, tagId: string) => {
    try {
      const { data, error } = await supabase
        .from('transaction_tag_assignments')
        .insert({
          transaction_id: transactionId,
          tag_id: tagId
        })
        .select()
        .single()

      if (error) throw error
      
      tagAssignments.value.push(data)
      return data
    } catch (error) {
      console.error('Error assigning tag to transaction:', error)
      throw error
    }
  }

  const removeTagFromTransaction = async (transactionId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('transaction_tag_assignments')
        .delete()
        .eq('transaction_id', transactionId)
        .eq('tag_id', tagId)

      if (error) throw error
      
      tagAssignments.value = tagAssignments.value.filter(
        ta => !(ta.transaction_id === transactionId && ta.tag_id === tagId)
      )
    } catch (error) {
      console.error('Error removing tag from transaction:', error)
      throw error
    }
  }

  const toggleTransactionHighlight = async (transactionId: string) => {
    try {
      // Find the transaction in local state
      const transaction = transactions.value.find(t => t.id === transactionId)
      if (!transaction) throw new Error('Transaction not found')

      const newHighlightStatus = !transaction.is_highlighted

      // Update in database
      const { error } = await supabase
        .from('transactions')
        .update({ is_highlighted: newHighlightStatus })
        .eq('id', transactionId)

      if (error) throw error

      // Update local state
      transaction.is_highlighted = newHighlightStatus

      console.log(`Transaction ${transactionId} highlight status updated to: ${newHighlightStatus}`)
    } catch (error) {
      console.error('Error toggling transaction highlight:', error)
      throw error
    }
  }

  const deleteTag = async (tagId: string) => {
    try {
      // First delete all assignments
      const { error: assignmentsError } = await supabase
        .from('transaction_tag_assignments')
        .delete()
        .eq('tag_id', tagId)

      if (assignmentsError) throw assignmentsError

      // Then delete the tag
      const { error: tagError } = await supabase
        .from('transaction_tags')
        .delete()
        .eq('id', tagId)

      if (tagError) throw tagError

      // Update local state
      transactionTags.value = transactionTags.value.filter(t => t.id !== tagId)
      tagAssignments.value = tagAssignments.value.filter(ta => ta.tag_id !== tagId)
      
      return true
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw error
    }
  }

  // Get transactions for a specific tag
  const getTransactionsForTag = (tagId: string) => {
    const transactionIds = tagAssignments.value
      .filter(ta => ta.tag_id === tagId)
      .map(ta => ta.transaction_id)
    
    return transactions.value.filter(t => transactionIds.includes(t.id))
  }

  // Get tags for a specific transaction
  const getTagsForTransaction = (transactionId: string) => {
    const tagIds = tagAssignments.value
      .filter(ta => ta.transaction_id === transactionId)
      .map(ta => ta.tag_id)
    
    return transactionTags.value.filter(t => tagIds.includes(t.id))
  }

  // Get total cost for a tag
  const getTagTotalCost = (tagId: string) => {
    const tagTransactions = getTransactionsForTag(tagId)
    return tagTransactions.reduce((sum, t) => sum + t.amount, 0)
  }

  // Copy current month's budget allocations and income to all future months
  const copyBudgetToFutureMonths = async (fromMonth: number, currentYear: number = new Date().getFullYear()) => {
    if (!authStore.currentUser) return

    try {
      isLoading.value = true

      // Generate future month periods
      const futureMonths = []
      for (let month = fromMonth + 1; month <= 12; month++) {
        const periodDate = new Date(currentYear, month - 1, 1)
        futureMonths.push(periodDate.toISOString().split('T')[0])
      }

      if (futureMonths.length === 0) return

      // Get current month's budget period
      const currentPeriod = new Date(currentYear, fromMonth - 1, 1).toISOString().split('T')[0]

      // 1. Copy budget entries for all users
      const { data: currentBudgetEntries, error: budgetEntriesError } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('budget_period', currentPeriod)

      if (budgetEntriesError) throw budgetEntriesError

      if (currentBudgetEntries && currentBudgetEntries.length > 0) {
        // Delete existing budget entries for future months
        for (const futurePeriod of futureMonths) {
          await supabase
            .from('budget_entries')
            .delete()
            .eq('budget_period', futurePeriod)
        }

        // Create new budget entries for each future month
        const newBudgetEntries = []
        for (const entry of currentBudgetEntries) {
          for (const futurePeriod of futureMonths) {
            newBudgetEntries.push({
              user_id: entry.user_id,
              category_id: entry.category_id,
              budget_period: futurePeriod,
              amount: entry.amount
            })
          }
        }

        if (newBudgetEntries.length > 0) {
          const { error: insertError } = await supabase
            .from('budget_entries')
            .insert(newBudgetEntries)

          if (insertError) throw insertError
        }
      }

      // 2. Copy monthly income (budgets table) for all users
      const { data: currentBudgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('period_start', new Date(currentYear, fromMonth - 1, 1).toISOString().split('T')[0])
        .eq('period_end', new Date(currentYear, fromMonth, 0).toISOString().split('T')[0])

      if (budgetsError) throw budgetsError

      if (currentBudgets && currentBudgets.length > 0) {
        const newBudgets = []
        for (const budget of currentBudgets) {
          for (let month = fromMonth + 1; month <= 12; month++) {
            const startDate = new Date(currentYear, month - 1, 1)
            const endDate = new Date(currentYear, month, 0)
            
            newBudgets.push({
              user_id: budget.user_id,
              period_start: startDate.toISOString().split('T')[0],
              period_end: endDate.toISOString().split('T')[0],
              total_income: budget.total_income
            })
          }
        }

        if (newBudgets.length > 0) {
          // Delete existing budgets for future months first
          for (let month = fromMonth + 1; month <= 12; month++) {
            const startDate = new Date(currentYear, month - 1, 1).toISOString().split('T')[0]
            const endDate = new Date(currentYear, month, 0).toISOString().split('T')[0]
            
            await supabase
              .from('budgets')
              .delete()
              .eq('period_start', startDate)
              .eq('period_end', endDate)
          }

          const { error: insertBudgetsError } = await supabase
            .from('budgets')
            .insert(newBudgets)

          if (insertBudgetsError) throw insertBudgetsError
        }
      }

      return true
    } catch (error) {
      console.error('Error copying budget to future months:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    categories,
    budgetEntries,
    currentBudget,
    transactions,
    transactionTags,
    tagAssignments,
    uncategorizedTransactions,
    totalSpent,
    totalBudget,
    isLoading,
    loadCategories,
    loadBudgetEntries,
    loadBudget,
    loadTransactions,
    loadTransactionTags,
    loadTagAssignments,
    createCategory,
    updateCategory,
    deleteCategory,
    createOrUpdateBudgetEntry,
    getBudgetEntry,
    saveBudget,
    createTransaction,
    categorizeTransaction,
    createTag,
    assignTagToTransaction,
    removeTagFromTransaction,
    toggleTransactionHighlight,
    deleteTag,
    getTransactionsForTag,
    getTagsForTransaction,
    getTagTotalCost,
    copyBudgetToFutureMonths
  }
})