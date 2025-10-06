<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Debt Tracking</h1>
            <p class="text-sm text-gray-500 mt-1">View IOU transactions and shared expenses between Jean and Izzy</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!authStore.currentUser" class="flex items-center justify-center h-64">
      <p class="text-gray-500">Please select a user to view debts</p>
    </div>

    <div v-else class="px-8 py-8 space-y-8">
      <!-- Debt Summary -->
      <div class="grid grid-cols-3 gap-6 mb-8">
        <!-- Total Owed to Me -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Owed to Me</h3>
          <p class="text-2xl font-bold text-green-600">${{ totalOwedToMe.toFixed(2) }}</p>
        </div>
        
        <!-- Total I Owe -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h3 class="text-sm font-medium text-gray-500 mb-2">I Owe</h3>
          <p class="text-2xl font-bold text-red-600">${{ totalIOwe.toFixed(2) }}</p>
        </div>
        
        <!-- Net Position -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Net Position</h3>
          <p class="text-2xl font-bold" :class="netPosition >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ netPosition >= 0 ? '+' : '' }}${{ netPosition.toFixed(2) }}
          </p>
        </div>
      </div>

      <!-- Debt Transactions Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">IOU Transactions</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Split %</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debt Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creditor</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debtor</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <!-- Debt Transactions -->
              <tr v-for="transaction in debtTransactions" :key="transaction.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ transaction.description }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${{ transaction.amount.toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ transaction.debt_split_percentage ?? 0 }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${{ ((transaction.amount * (transaction.debt_split_percentage ?? 0)) / 100).toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getCreditorName(transaction) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getDebtorName(transaction) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium"
                    :class="(transaction.debt_remaining_amount ?? 0) > 0 ? 'text-red-600' : 'text-green-600'">
                  ${{ (transaction.debt_remaining_amount ?? 0).toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        :class="getStatusColor(transaction.debt_status)">
                    {{ transaction.debt_status?.toUpperCase() || 'ACTIVE' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    v-if="(transaction.debt_remaining_amount ?? 0) > 0 && transaction.debt_debtor_id === authStore.currentUser?.id"
                    @click="openPaymentModal(transaction)"
                    class="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Pay
                  </button>
                  <span v-else-if="(transaction.debt_remaining_amount ?? 0) === 0" class="text-green-600 text-sm font-medium">
                    Paid
                  </span>
                  <button
                    v-if="(transaction.debt_remaining_amount ?? 0) > 0"
                    @click="viewPaymentHistory(transaction)"
                    class="text-gray-600 hover:text-gray-900 text-sm font-medium ml-2"
                  >
                    History
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- No Debts Message -->
        <div v-if="debtTransactions.length === 0 && !isLoading" class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No IOUs Yet</h3>
          <p class="text-gray-500 mb-4">Create transactions and mark them as IOUs to start tracking shared expenses</p>
          <RouterLink
            to="/transactions"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Transactions
          </RouterLink>
        </div>
      </div>
    </div>


    <!-- Payment Modal -->
    <div v-if="showPaymentModal && selectedTransaction" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Make Payment</h3>
        <p class="text-sm text-gray-500 mb-6">
          Pay towards: {{ selectedTransaction.description }}
        </p>
        
        <form @submit.prevent="makePayment" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
            <div class="relative">
              <input
                v-model.number="paymentForm.amount"
                type="number"
                step="0.01"
                min="0.01"
                :max="selectedTransaction.debt_remaining_amount ?? 0"
                required
                class="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Remaining debt: ${{ (selectedTransaction.debt_remaining_amount ?? 0).toFixed(2) }}
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method (Optional)</label>
            <input
              v-model="paymentForm.paymentMethod"
              type="text"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Cash, Bank Transfer, PayPal"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              v-model="paymentForm.notes"
              rows="3"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes..."
            ></textarea>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="cancelPayment"
              class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Payment History Modal -->
    <div v-if="showHistoryModal && selectedTransaction" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-lg mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Payment History</h3>
        <p class="text-sm text-gray-500 mb-6">
          {{ selectedTransaction.description }}
        </p>
        
        <div v-if="paymentHistory.length === 0" class="text-center py-8 text-gray-500">
          No payments recorded yet
        </div>
        
        <div v-else class="space-y-3 max-h-64 overflow-y-auto">
          <div v-for="payment in paymentHistory" :key="payment.id" 
               class="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">${{ payment.amount.toFixed(2) }}</p>
              <p class="text-sm text-gray-500">{{ formatDate(payment.payment_date) }}</p>
              <p v-if="payment.payment_method" class="text-xs text-gray-400">via {{ payment.payment_method }}</p>
            </div>
            <div v-if="payment.notes" class="text-sm text-gray-600 max-w-xs">
              {{ payment.notes }}
            </div>
          </div>
        </div>
        
        <div class="mt-6">
          <button
            @click="closeHistoryModal"
            class="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Transaction } from '@/stores/budget'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()

const debtTransactions = ref<Transaction[]>([])
const userMap = ref<Record<string, string>>({})
const showPaymentModal = ref(false)
const showHistoryModal = ref(false)
const selectedTransaction = ref<Transaction | null>(null)
const paymentHistory = ref<any[]>([])
const isLoading = ref(false)

const paymentForm = ref({
  amount: 0,
  paymentMethod: '',
  notes: ''
})

// Computed values for debt summary
const totalOwedToMe = computed(() => {
  if (!authStore.currentUser) return 0
  return debtTransactions.value
    .filter(t => t.debt_creditor_id === authStore.currentUser!.id && t.debt_status === 'active')
    .reduce((sum, t) => sum + (t.debt_remaining_amount || 0), 0)
})

const totalIOwe = computed(() => {
  if (!authStore.currentUser) return 0
  return debtTransactions.value
    .filter(t => t.debt_debtor_id === authStore.currentUser!.id && t.debt_status === 'active')
    .reduce((sum, t) => sum + (t.debt_remaining_amount || 0), 0)
})

const netPosition = computed(() => totalOwedToMe.value - totalIOwe.value)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getCreditorName = (transaction: Transaction) => {
  return userMap.value[transaction.debt_creditor_id || ''] || 'Unknown'
}

const getDebtorName = (transaction: Transaction) => {
  return userMap.value[transaction.debt_debtor_id || ''] || 'Unknown'
}

const getStatusColor = (status: string | null) => {
  switch (status) {
    case 'active':
      return 'bg-orange-100 text-orange-800'
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-orange-100 text-orange-800'
  }
}

const loadDebtTransactions = async () => {
  if (!authStore.currentUser) return

  isLoading.value = true
  try {
    // Load transactions that are marked as debts and involve the current user
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_debt', true)
      .or(`debt_creditor_id.eq.${authStore.currentUser.id},debt_debtor_id.eq.${authStore.currentUser.id}`)
      .order('date', { ascending: false })

    if (error) throw error
    debtTransactions.value = data || []
  } catch (error) {
    console.error('Error loading debt transactions:', error)
  } finally {
    isLoading.value = false
  }
}

const loadUserNames = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name')

    if (error) throw error
    
    const nameMap: Record<string, string> = {}
    data?.forEach(user => {
      nameMap[user.id] = user.name
    })
    userMap.value = nameMap
  } catch (error) {
    console.error('Error loading user names:', error)
  }
}

const openPaymentModal = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  paymentForm.value = {
    amount: transaction.debt_remaining_amount || 0,
    paymentMethod: '',
    notes: ''
  }
  showPaymentModal.value = true
}

const makePayment = async () => {
  if (!selectedTransaction.value || !authStore.currentUser) return
  
  try {
    // Record the payment in debt_payments table
    const { error: paymentError } = await supabase
      .from('debt_payments')
      .insert({
        transaction_id: selectedTransaction.value.id,
        payer_id: authStore.currentUser.id,
        amount: paymentForm.value.amount,
        payment_method: paymentForm.value.paymentMethod,
        notes: paymentForm.value.notes,
        payment_date: new Date().toISOString().split('T')[0]
      })

    if (paymentError) throw paymentError

    // Update the remaining amount on the transaction
    const newRemainingAmount = (selectedTransaction.value.debt_remaining_amount || 0) - paymentForm.value.amount
    const newStatus = newRemainingAmount <= 0 ? 'paid' : 'active'

    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        debt_remaining_amount: Math.max(0, newRemainingAmount),
        debt_status: newStatus
      })
      .eq('id', selectedTransaction.value.id)

    if (updateError) throw updateError

    cancelPayment()
    await loadDebtTransactions()
    alert('Payment recorded successfully!')
  } catch (error) {
    console.error('Error recording payment:', error)
    alert('Failed to record payment. Please try again.')
  }
}

const cancelPayment = () => {
  showPaymentModal.value = false
  selectedTransaction.value = null
  paymentForm.value = {
    amount: 0,
    paymentMethod: '',
    notes: ''
  }
}

const viewPaymentHistory = async (transaction: Transaction) => {
  selectedTransaction.value = transaction
  
  try {
    const { data, error } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('transaction_id', transaction.id)
      .order('payment_date', { ascending: false })

    if (error) throw error
    paymentHistory.value = data || []
    showHistoryModal.value = true
  } catch (error) {
    console.error('Error loading payment history:', error)
    alert('Failed to load payment history.')
  }
}

const closeHistoryModal = () => {
  showHistoryModal.value = false
  selectedTransaction.value = null
  paymentHistory.value = []
}

const loadData = async () => {
  if (!authStore.currentUser) return
  await Promise.all([
    loadDebtTransactions(),
    loadUserNames()
  ])
}

onMounted(loadData)
watch(() => authStore.currentUser, loadData)
</script>