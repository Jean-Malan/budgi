<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Bank Accounts</h1>
            <p class="text-sm text-gray-500 mt-1">Manage your bank accounts and financial institutions</p>
          </div>
          <button
            @click="startNewAccount"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Account
          </button>
        </div>
      </div>
    </div>

    <div v-if="!authStore.currentUser" class="flex items-center justify-center h-64">
      <p class="text-gray-500">Please select a user to view bank accounts</p>
    </div>

    <div v-else class="px-8 py-8">
      <!-- Bank Accounts Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <!-- Existing Accounts -->
              <tr v-for="account in bankAccountStore.currentUserBankAccounts" :key="account.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="editingAccount?.id === account.id">
                    <input
                      v-model="editForm.name"
                      type="text"
                      class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div v-else class="text-sm font-medium text-gray-900">
                    {{ account.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="editingAccount?.id === account.id">
                    <select
                      v-model="editForm.account_type"
                      class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit</option>
                      <option value="investment">Investment</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div v-else>
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                          :class="getAccountTypeColor(account.account_type)">
                      {{ formatAccountType(account.account_type) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div v-if="editingAccount?.id === account.id">
                    <input
                      v-model="editForm.bank_name"
                      type="text"
                      placeholder="Bank name"
                      class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div v-else>
                    {{ account.bank_name || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div v-if="editingAccount?.id === account.id">
                    <input
                      v-model="editForm.account_number"
                      type="text"
                      placeholder="Account number"
                      class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div v-else>
                    {{ account.account_number ? `****${account.account_number.slice(-4)}` : 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div v-if="editingAccount?.id === account.id">
                    <div class="relative">
                      <input
                        v-model.number="editForm.balance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        class="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                    </div>
                  </div>
                  <div v-else class="font-medium" :class="account.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                    ${{ account.balance.toFixed(2) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div v-if="editingAccount?.id === account.id" class="flex space-x-1">
                    <button
                      @click="saveAccount"
                      class="text-green-600 hover:text-green-900 font-medium"
                    >
                      Save
                    </button>
                    <button
                      @click="cancelEdit"
                      class="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  <div v-else class="flex space-x-2">
                    <button
                      @click="startEdit(account)"
                      class="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteAccount(account)"
                      class="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              
              <!-- New Account Row -->
              <tr v-if="showNewAccountRow" class="bg-blue-50 border-2 border-blue-200">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="newAccount.name"
                    type="text"
                    placeholder="Account name"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select
                    v-model="newAccount.account_type"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                    <option value="investment">Investment</option>
                    <option value="cash">Cash</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="newAccount.bank_name"
                    type="text"
                    placeholder="Bank name"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="newAccount.account_number"
                    type="text"
                    placeholder="Account number"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="relative">
                    <input
                      v-model.number="newAccount.balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    New
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex space-x-1">
                    <button
                      @click="saveNewAccount"
                      class="text-green-600 hover:text-green-900 font-medium"
                    >
                      Save
                    </button>
                    <button
                      @click="cancelNewAccount"
                      class="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
              
              <!-- Add New Account Button Row -->
              <tr v-if="!showNewAccountRow && bankAccountStore.currentUserBankAccounts.length > 0">
                <td colspan="7" class="px-6 py-4">
                  <button
                    @click="startNewAccount"
                    class="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    + Add New Account
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- No Accounts Message -->
        <div v-if="bankAccountStore.currentUserBankAccounts.length === 0 && !bankAccountStore.isLoading && !showNewAccountRow" class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Bank Accounts Yet</h3>
          <p class="text-gray-500 mb-4">Add your first bank account to start tracking transactions</p>
          <button
            @click="startNewAccount"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBankAccountStore } from '@/stores/bankAccount'
import type { BankAccount } from '@/stores/bankAccount'

const authStore = useAuthStore()
const bankAccountStore = useBankAccountStore()

const showNewAccountRow = ref(false)
const editingAccount = ref<BankAccount | null>(null)

const newAccount = ref({
  name: '',
  account_type: 'checking' as BankAccount['account_type'],
  bank_name: '',
  account_number: '',
  balance: 0
})

const editForm = ref({
  name: '',
  account_type: 'checking' as BankAccount['account_type'],
  bank_name: '',
  account_number: '',
  balance: 0
})

const formatAccountType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const getAccountTypeColor = (type: string) => {
  const colors = {
    checking: 'bg-blue-100 text-blue-800',
    savings: 'bg-green-100 text-green-800',
    credit: 'bg-red-100 text-red-800',
    investment: 'bg-purple-100 text-purple-800',
    cash: 'bg-yellow-100 text-yellow-800'
  }
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const startNewAccount = () => {
  showNewAccountRow.value = true
  newAccount.value = {
    name: '',
    account_type: 'checking',
    bank_name: '',
    account_number: '',
    balance: 0
  }
}

const cancelNewAccount = () => {
  showNewAccountRow.value = false
  newAccount.value = {
    name: '',
    account_type: 'checking',
    bank_name: '',
    account_number: '',
    balance: 0
  }
}

const saveNewAccount = async () => {
  if (!newAccount.value.name.trim()) {
    alert('Account name is required')
    return
  }
  
  try {
    await bankAccountStore.createBankAccount(
      newAccount.value.name,
      newAccount.value.account_type,
      newAccount.value.bank_name || undefined,
      newAccount.value.account_number || undefined
    )
    
    // Update balance if provided
    if (newAccount.value.balance !== 0) {
      const accounts = bankAccountStore.currentUserBankAccounts
      const createdAccount = accounts.find(a => a.name === newAccount.value.name)
      if (createdAccount) {
        await bankAccountStore.updateBalance(createdAccount.id, newAccount.value.balance)
      }
    }
    
    cancelNewAccount()
    alert('Bank account created successfully!')
  } catch (error) {
    console.error('Error creating bank account:', error)
    alert('Failed to create bank account. Please try again.')
  }
}

const startEdit = (account: BankAccount) => {
  editingAccount.value = account
  editForm.value = {
    name: account.name,
    account_type: account.account_type,
    bank_name: account.bank_name || '',
    account_number: account.account_number || '',
    balance: account.balance
  }
}

const cancelEdit = () => {
  editingAccount.value = null
  editForm.value = {
    name: '',
    account_type: 'checking',
    bank_name: '',
    account_number: '',
    balance: 0
  }
}

const saveAccount = async () => {
  if (!editingAccount.value || !editForm.value.name.trim()) {
    alert('Account name is required')
    return
  }
  
  try {
    await bankAccountStore.updateBankAccount(editingAccount.value.id, {
      name: editForm.value.name,
      account_type: editForm.value.account_type,
      bank_name: editForm.value.bank_name || undefined,
      account_number: editForm.value.account_number || undefined,
      balance: editForm.value.balance
    })
    
    cancelEdit()
    alert('Bank account updated successfully!')
  } catch (error) {
    console.error('Error updating bank account:', error)
    alert('Failed to update bank account. Please try again.')
  }
}

const deleteAccount = async (account: BankAccount) => {
  if (!confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
    return
  }
  
  try {
    await bankAccountStore.deleteBankAccount(account.id)
    alert('Bank account deleted successfully!')
  } catch (error) {
    console.error('Error deleting bank account:', error)
    if (error instanceof Error && error.message.includes('existing transactions')) {
      alert('Cannot delete account with existing transactions. Please remove or reassign transactions first.')
    } else {
      alert('Failed to delete bank account. Please try again.')
    }
  }
}

const loadData = async () => {
  if (!authStore.currentUser) return
  await bankAccountStore.loadBankAccounts()
}

onMounted(loadData)
watch(() => authStore.currentUser, loadData)
</script>