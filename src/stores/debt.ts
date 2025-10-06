import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface Debt {
  id: string
  creditor_id: string
  debtor_id: string
  original_transaction_id?: string
  description: string
  original_amount: number
  remaining_amount: number
  split_percentage: number
  status: 'active' | 'paid' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface DebtPayment {
  id: string
  debt_id: string
  payer_id: string
  amount: number
  payment_method?: string
  notes?: string
  payment_date: string
  created_at: string
}

export interface DebtWithDetails extends Debt {
  creditor_name: string
  debtor_name: string
  payments: DebtPayment[]
  total_paid: number
}

export const useDebtStore = defineStore('debt', () => {
  const authStore = useAuthStore()
  
  const debts = ref<DebtWithDetails[]>([])
  const isLoading = ref(false)

  // Computed values for current user's debt situation
  const totalOwedToMe = computed(() => {
    if (!authStore.currentUser) return 0
    return debts.value
      .filter(d => d.creditor_id === authStore.currentUser!.id && d.status === 'active')
      .reduce((sum, d) => sum + d.remaining_amount, 0)
  })

  const totalIOwe = computed(() => {
    if (!authStore.currentUser) return 0
    return debts.value
      .filter(d => d.debtor_id === authStore.currentUser!.id && d.status === 'active')
      .reduce((sum, d) => sum + d.remaining_amount, 0)
  })

  const netPosition = computed(() => totalOwedToMe.value - totalIOwe.value)

  const debtsOwedToMe = computed(() => {
    if (!authStore.currentUser) return []
    return debts.value.filter(d => d.creditor_id === authStore.currentUser!.id && d.status === 'active')
  })

  const debtsIOwe = computed(() => {
    if (!authStore.currentUser) return []
    return debts.value.filter(d => d.debtor_id === authStore.currentUser!.id && d.status === 'active')
  })

  const loadDebts = async () => {
    if (!authStore.currentUser) return

    isLoading.value = true
    try {
      // Load debts where current user is either creditor or debtor
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select(`
          *,
          creditor:creditor_id(name),
          debtor:debtor_id(name),
          bank_account:bank_account_id(name)
        `)
        .or(`creditor_id.eq.${authStore.currentUser.id},debtor_id.eq.${authStore.currentUser.id}`)
        .order('created_at', { ascending: false })

      if (debtsError) throw debtsError

      // Load payments for each debt
      const debtsWithDetails: DebtWithDetails[] = []
      
      for (const debt of debtsData || []) {
        const { data: payments, error: paymentsError } = await supabase
          .from('debt_payments')
          .select('*')
          .eq('debt_id', debt.id)
          .order('payment_date', { ascending: false })

        if (paymentsError) throw paymentsError

        const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

        debtsWithDetails.push({
          ...debt,
          creditor_name: debt.creditor?.name || 'Unknown',
          debtor_name: debt.debtor?.name || 'Unknown',
          bank_account_name: debt.bank_account?.name || null,
          payments: payments || [],
          total_paid: totalPaid
        })
      }

      debts.value = debtsWithDetails
    } catch (error) {
      console.error('Error loading debts:', error)
    } finally {
      isLoading.value = false
    }
  }

  const createDebtFromTransaction = async (
    transactionId: string,
    transactionAmount: number,
    description: string,
    creditorId: string,
    debtorId: string,
    splitPercentage: number = 50
  ) => {
    try {
      const splitAmount = (transactionAmount * splitPercentage) / 100

      const { data, error } = await supabase
        .from('debts')
        .insert({
          creditor_id: creditorId,
          debtor_id: debtorId,
          original_transaction_id: transactionId,
          description,
          original_amount: splitAmount,
          remaining_amount: splitAmount,
          split_percentage: splitPercentage,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      await loadDebts() // Refresh the debts list
      return data
    } catch (error) {
      console.error('Error creating debt:', error)
      throw error
    }
  }

  const createStandaloneDebt = async (
    creditorId: string,
    debtorId: string,
    amount: number,
    description: string,
    splitPercentage: number = 50,
    bankAccountId?: string | null
  ) => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .insert({
          creditor_id: creditorId,
          debtor_id: debtorId,
          bank_account_id: bankAccountId,
          description,
          original_amount: amount,
          remaining_amount: amount,
          split_percentage: splitPercentage,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      await loadDebts()
      return data
    } catch (error) {
      console.error('Error creating standalone debt:', error)
      throw error
    }
  }

  const makePayment = async (
    debtId: string,
    amount: number,
    paymentMethod?: string,
    notes?: string,
    paymentDate?: string
  ) => {
    if (!authStore.currentUser) return

    try {
      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('debt_payments')
        .insert({
          debt_id: debtId,
          payer_id: authStore.currentUser.id,
          amount,
          payment_method: paymentMethod,
          notes,
          payment_date: paymentDate || new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Update debt remaining amount
      const debt = debts.value.find(d => d.id === debtId)
      if (!debt) throw new Error('Debt not found')

      const newRemainingAmount = Math.max(0, debt.remaining_amount - amount)
      const newStatus = newRemainingAmount === 0 ? 'paid' : 'active'

      const { error: updateError } = await supabase
        .from('debts')
        .update({
          remaining_amount: newRemainingAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', debtId)

      if (updateError) throw updateError

      await loadDebts()
      return payment
    } catch (error) {
      console.error('Error making payment:', error)
      throw error
    }
  }

  const updateDebt = async (debtId: string, updates: Partial<Debt>) => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', debtId)
        .select()
        .single()

      if (error) throw error

      await loadDebts()
      return data
    } catch (error) {
      console.error('Error updating debt:', error)
      throw error
    }
  }

  const deleteDebt = async (debtId: string) => {
    try {
      // Delete associated payments first
      const { error: paymentsError } = await supabase
        .from('debt_payments')
        .delete()
        .eq('debt_id', debtId)

      if (paymentsError) throw paymentsError

      // Delete the debt
      const { error: debtError } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtId)

      if (debtError) throw debtError

      await loadDebts()
      return true
    } catch (error) {
      console.error('Error deleting debt:', error)
      throw error
    }
  }

  return {
    debts,
    isLoading,
    totalOwedToMe,
    totalIOwe,
    netPosition,
    debtsOwedToMe,
    debtsIOwe,
    loadDebts,
    createDebtFromTransaction,
    createStandaloneDebt,
    makePayment,
    updateDebt,
    deleteDebt
  }
})