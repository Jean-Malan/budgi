<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="px-6 py-6">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-medium text-gray-900">Dashboard</h1>
          
          <!-- Date Range Picker -->
          <div class="flex items-center space-x-3">
            <el-date-picker
              v-model="localDateRange"
              type="daterange"
              range-separator="To"
              start-placeholder="Start date"
              end-placeholder="End date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="onDateRangeChange"
              class="w-80"
            />
            
            <button
              @click="dateRangeStore.goToCurrentMonth"
              class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              This Month
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!authStore.currentUser" class="flex items-center justify-center min-h-[400px]">
      <p class="text-gray-500">Please select a user to view the dashboard.</p>
    </div>

    <div v-else-if="budgetStore.isLoading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 mt-3">Loading...</p>
      </div>
    </div>

    <div v-else class="max-w-6xl mx-auto px-6 py-8">
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-light text-gray-900">Profit & Loss</h1>
            <p class="text-gray-500 mt-1">{{ formatSelectedMonth() }}</p>
          </div>
          
          <!-- User Selection Toggles -->
          <div class="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              v-for="user in availableUsers" 
              :key="user.name"
              @click="toggleUser(user.name)"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              :class="selectedUsers.includes(user.name) 
                ? `${user.activeClass} text-white shadow-sm` 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'"
            >
              {{ user.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- P&L Statement -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 divide-x divide-gray-200">
          <!-- Total Income -->
          <div class="p-6 text-center">
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Income</div>
            <div class="text-2xl font-semibold text-emerald-600">${{ totalIncomeActual.toLocaleString() }}</div>
            <div class="text-sm text-gray-500 mt-1">
              Budget: ${{ totalIncomeBudget.toLocaleString() }}
            </div>
          </div>
          
          <!-- Total Expenses -->
          <div class="p-6 text-center">
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Expenses</div>
            <div class="text-2xl font-semibold text-red-500">${{ totalExpensesActual.toLocaleString() }}</div>
            <div class="text-sm text-gray-500 mt-1">
              Budget: ${{ totalExpensesBudget.toLocaleString() }}
            </div>
          </div>
          
          <!-- Net Income -->
          <div class="p-6 text-center">
            <div class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Net Income</div>
            <div class="text-2xl font-semibold" :class="netIncomeActual >= 0 ? 'text-emerald-600' : 'text-red-500'">
              ${{ netIncomeActual.toLocaleString() }}
            </div>
            <div class="text-sm" :class="netIncomeVariance >= 0 ? 'text-emerald-600' : 'text-red-500'">
              {{ netIncomeVariance >= 0 ? '+' : '' }}${{ netIncomeVariance.toLocaleString() }} vs budget
            </div>
          </div>
        </div>

        <!-- Detailed P&L Table -->
        <div class="border-t border-gray-200">
          <!-- Table Header -->
          <div class="bg-gray-50 px-6 py-4">
            <div class="grid grid-cols-4 gap-6">
              <div class="text-sm font-semibold text-gray-700">Category</div>
              <div class="text-sm font-semibold text-gray-700 text-right">Actual</div>
              <div class="text-sm font-semibold text-gray-700 text-right">Budget</div>
              <div class="text-sm font-semibold text-gray-700 text-right">Variance</div>
            </div>
          </div>

          <!-- Income Section -->
          <div v-if="incomeCategories.length > 0">
            <div class="px-6 py-3 bg-emerald-50 border-l-4 border-emerald-500">
              <h3 class="text-sm font-semibold text-emerald-800">INCOME</h3>
            </div>
            <div class="divide-y divide-gray-100">
              <div v-for="category in incomeCategories" :key="category.id"
                   class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                   @click="navigateToCategory(category.name)">
                <div class="grid grid-cols-4 gap-6 items-center">
                  <div class="text-sm font-medium text-gray-900 group-hover:text-emerald-600">
                    {{ category.name }}
                  </div>
                  <div class="text-sm text-right font-semibold text-gray-900">
                    ${{ category.actual.toLocaleString() }}
                  </div>
                  <div class="text-sm text-right text-gray-500">
                    ${{ category.budget.toLocaleString() }}
                  </div>
                  <div class="text-sm text-right font-medium" 
                       :class="category.variance >= 0 ? 'text-emerald-600' : 'text-red-500'">
                    {{ category.variance >= 0 ? '+' : '' }}${{ category.variance.toLocaleString() }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Expenses Section -->
          <div v-if="expenseCategories.length > 0">
            <div class="px-6 py-3 bg-red-50 border-l-4 border-red-500">
              <h3 class="text-sm font-semibold text-red-800">EXPENSES</h3>
            </div>
            <div class="divide-y divide-gray-100">
              <div v-for="category in expenseCategories" :key="category.id"
                   class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                   @click="navigateToCategory(category.name)">
                <div class="grid grid-cols-4 gap-6 items-center">
                  <div class="text-sm font-medium text-gray-900 group-hover:text-red-600">
                    {{ category.name }}
                  </div>
                  <div class="text-sm text-right font-semibold text-gray-900">
                    ${{ category.actual.toLocaleString() }}
                  </div>
                  <div class="text-sm text-right text-gray-500">
                    ${{ category.budget.toLocaleString() }}
                  </div>
                  <div class="text-sm text-right font-medium" 
                       :class="category.variance >= 0 ? 'text-emerald-600' : 'text-red-500'">
                    {{ category.variance >= 0 ? '+' : '' }}${{ category.variance.toLocaleString() }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Net Income Summary -->
          <div class="bg-gray-50 px-6 py-4 border-t-2 border-gray-300">
            <div class="grid grid-cols-4 gap-6 items-center">
              <div class="text-base font-bold text-gray-900">NET INCOME</div>
              <div class="text-base text-right font-bold" 
                   :class="netIncomeActual >= 0 ? 'text-emerald-600' : 'text-red-500'">
                ${{ netIncomeActual.toLocaleString() }}
              </div>
              <div class="text-base text-right font-medium text-gray-500">
                ${{ netIncomeBudget.toLocaleString() }}
              </div>
              <div class="text-base text-right font-bold" 
                   :class="netIncomeVariance >= 0 ? 'text-emerald-600' : 'text-red-500'">
                {{ netIncomeVariance >= 0 ? '+' : '' }}${{ netIncomeVariance.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Items -->
      <div v-if="hasActionItems" class="mt-8 pt-6 border-t border-gray-200">
        <div class="text-sm font-medium text-gray-900 mb-3">Action Items</div>
        <div class="space-y-2">
          <!-- Uncategorized Transactions -->
          <div v-if="budgetStore.uncategorizedTransactions.length > 0" 
               class="text-sm text-gray-600 cursor-pointer hover:text-gray-900"
               @click="navigateToTransactions()">
            • {{ budgetStore.uncategorizedTransactions.length }} transactions need categorization
          </div>

          <!-- Budget Alerts -->
          <div v-if="overBudgetCategories.length > 0" 
               class="text-sm text-red-600 cursor-pointer hover:text-red-700"
               @click="navigateToBudget()">
            • {{ overBudgetCategories.length }} categories over budget
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBudgetStore } from '@/stores/budget'
import { useDateRangeStore } from '@/stores/dateRange'
import { ElDatePicker } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const budgetStore = useBudgetStore()
const dateRangeStore = useDateRangeStore()

// User selection state
const selectedUsers = ref(['Jean'])
const availableUsers = ref([
  { name: 'Jean', activeClass: 'bg-blue-600' },
  { name: 'Izzy', activeClass: 'bg-purple-600' },
  { name: 'Shared', activeClass: 'bg-emerald-600' }
])

const toggleUser = (userName: string) => {
  const index = selectedUsers.value.indexOf(userName)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(userName)
  }
}

const budgetPeriod = computed(() => {
  const periodDate = new Date(dateRangeStore.selectedMonth.value.getFullYear(), dateRangeStore.selectedMonth.value.getMonth(), 1)
  return periodDate.toISOString().split('T')[0]
})

// Local computed for date range to ensure reactivity
const localDateRange = computed({
  get: () => dateRangeStore.dateRange,
  set: (value) => {
    if (value && Array.isArray(value) && value.length === 2) {
      dateRangeStore.setDateRange(value as [string, string])
    } else if (value === null) {
      dateRangeStore.setDateRange(null)
    }
  }
})

const onDateRangeChange = async (range: [string, string] | null) => {
  console.log('Date range changed:', range)
  dateRangeStore.setDateRange(range)
  // Immediately reload data when date range changes
  await loadData()
}

// Navigation functions
const navigateToTransactions = (type?: string) => {
  const query: Record<string, string> = {}
  if (type) query.type = type
  router.push({ name: 'transactions', query })
}

const navigateToCategory = (categoryName: string) => {
  // Find the category ID for filtering
  const category = budgetStore.categories.find(c => c.name === categoryName)
  if (category) {
    router.push({ name: 'transactions', query: { category: category.id } })
  }
}

const navigateToBudget = () => {
  router.push({ name: 'budget' })
}

// P&L Calculations
const totalIncome = computed(() => {
  return budgetStore.transactions
    .filter(t => t.is_income)
    .reduce((sum, t) => sum + t.amount, 0)
})

const incomeTransactionCount = computed(() => {
  return budgetStore.transactions.filter(t => t.is_income).length
})

const expenseTransactionCount = computed(() => {
  return budgetStore.transactions.filter(t => !t.is_income).length
})

// Income Categories with Budget vs Actual
const incomeCategories = computed(() => {
  if (selectedUsers.value.length === 0 || !authStore.users.length) return []
  
  // Get transactions for selected users
  const relevantTransactions = budgetStore.transactions.filter(t => {
    const user = authStore.users.find(u => u.id === t.user_id)
    return user && selectedUsers.value.includes(user.name)
  })
  
  const incomeCategories = budgetStore.categories.filter(c => 
    relevantTransactions.some(t => t.category_id === c.id && t.is_income)
  )
  
  const uniqueNames = [...new Set(incomeCategories.map(c => c.name))]
  
  return uniqueNames.map(categoryName => {
    const categoriesWithName = incomeCategories.filter(c => c.name === categoryName)
    
    const actual = relevantTransactions
      .filter(t => {
        const categoryIds = categoriesWithName.map(c => c.id)
        return categoryIds.includes(t.category_id) && t.is_income
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const budget = categoriesWithName
      .filter(category => {
        const user = authStore.users.find(u => u.id === category.user_id)
        return user && selectedUsers.value.includes(user.name)
      })
      .reduce((sum, category) => {
        const budgetEntry = budgetStore.getBudgetEntry(category.user_id, category.id, budgetPeriod.value)
        return sum + (budgetEntry?.amount || 0)
      }, 0)
    
    return {
      id: categoryName,
      name: categoryName,
      actual,
      budget,
      variance: actual - budget
    }
  }).filter(c => c.actual > 0 || c.budget > 0)
})

// Expense Categories with Budget vs Actual
const expenseCategories = computed(() => {
  if (selectedUsers.value.length === 0 || !authStore.users.length) return []
  
  // Get transactions for selected users
  const relevantTransactions = budgetStore.transactions.filter(t => {
    const user = authStore.users.find(u => u.id === t.user_id)
    return user && selectedUsers.value.includes(user.name)
  })
  
  const expenseCategories = budgetStore.categories.filter(c => 
    relevantTransactions.some(t => t.category_id === c.id && !t.is_income)
  )
  
  const uniqueNames = [...new Set(expenseCategories.map(c => c.name))]
  
  return uniqueNames.map(categoryName => {
    const categoriesWithName = expenseCategories.filter(c => c.name === categoryName)
    
    const actual = relevantTransactions
      .filter(t => {
        const categoryIds = categoriesWithName.map(c => c.id)
        return categoryIds.includes(t.category_id) && !t.is_income
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const budget = categoriesWithName
      .filter(category => {
        const user = authStore.users.find(u => u.id === category.user_id)
        return user && selectedUsers.value.includes(user.name)
      })
      .reduce((sum, category) => {
        const budgetEntry = budgetStore.getBudgetEntry(category.user_id, category.id, budgetPeriod.value)
        return sum + (budgetEntry?.amount || 0)
      }, 0)
    
    return {
      id: categoryName,
      name: categoryName,
      actual,
      budget,
      variance: budget - actual // For expenses, positive variance means under budget
    }
  }).filter(c => c.actual > 0 || c.budget > 0)
})

// Totals based on all filtered transactions
const filteredTransactions = computed(() => {
  if (selectedUsers.value.length === 0 || !authStore.users.length) return []
  
  return budgetStore.transactions.filter(t => {
    const user = authStore.users.find(u => u.id === t.user_id)
    return user && selectedUsers.value.includes(user.name)
  })
})

const totalIncomeActual = computed(() => {
  return filteredTransactions.value
    .filter(t => t.is_income)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
})

const totalExpensesActual = computed(() => {
  return filteredTransactions.value
    .filter(t => !t.is_income)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
})

const totalIncomeBudget = computed(() => incomeCategories.value.reduce((sum, c) => sum + c.budget, 0))
const totalExpensesBudget = computed(() => expenseCategories.value.reduce((sum, c) => sum + c.budget, 0))

const totalIncomeVariance = computed(() => totalIncomeActual.value - totalIncomeBudget.value)
const totalExpensesVariance = computed(() => totalExpensesBudget.value - totalExpensesActual.value)

const netIncomeActual = computed(() => totalIncomeActual.value - totalExpensesActual.value)
const netIncomeBudget = computed(() => totalIncomeBudget.value - totalExpensesBudget.value)
const netIncomeVariance = computed(() => netIncomeActual.value - netIncomeBudget.value)

const netPosition = computed(() => totalIncome.value - budgetStore.totalSpent)

const spentPercentage = computed(() => {
  if (budgetStore.totalBudget === 0) return 0
  return (budgetStore.totalSpent / budgetStore.totalBudget) * 100
})

const categoriesWithSpending = computed(() => {
  if (!authStore.currentUser) return []
  
  const uniqueCategoryNames = [...new Set(budgetStore.categories.map(c => c.name))]
  
  return uniqueCategoryNames.map(categoryName => {
    const categoriesWithName = budgetStore.categories.filter(c => c.name === categoryName)
    
    const spent = budgetStore.transactions
      .filter(t => {
        const categoryIds = categoriesWithName.map(c => c.id)
        return categoryIds.includes(t.category_id) && !t.is_income
      })
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalBudget = categoriesWithName.reduce((sum, category) => {
      const budgetEntry = budgetStore.getBudgetEntry(category.user_id, category.id, budgetPeriod.value)
      return sum + (budgetEntry?.amount || 0)
    }, 0)
    
    const firstCategory = categoriesWithName[0]
    
    return {
      id: categoryName,
      name: categoryName,
      color: firstCategory?.color || '#3B82F6',
      spent,
      budget_amount: totalBudget,
      percentage: totalBudget > 0 ? (spent / totalBudget) * 100 : 0
    }
  }).filter(category => category.budget_amount > 0)
})

const topCategoriesWithBudget = computed(() => {
  return [...categoriesWithSpending.value]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 6)
})

const overBudgetCategories = computed(() => {
  return categoriesWithSpending.value.filter(category => category.percentage > 100)
})

const hasActionItems = computed(() => {
  return budgetStore.uncategorizedTransactions.length > 0 || overBudgetCategories.value.length > 0
})

const loadData = async () => {
  // Always load users first
  await authStore.loadUsers()
  
  if (selectedUsers.value.length === 0) return
  
  // Ensure date range is initialized
  const currentPeriod = dateRangeStore.currentPeriod.value
  if (!currentPeriod || !currentPeriod.start || !currentPeriod.end) {
    console.warn('Date range not initialized, skipping loadData')
    return
  }
  
  await Promise.all([
    budgetStore.loadCategories(),
    budgetStore.loadBudgetEntries(budgetPeriod.value),
    budgetStore.loadTransactions(currentPeriod.start, currentPeriod.end)
  ])
}

onMounted(async () => {
  // Initialize date range first
  dateRangeStore.initializeCurrentMonth()
  
  // Then load data
  await loadData()
})
watch(() => selectedUsers.value, loadData)
watch(() => dateRangeStore.currentPeriod.value, () => {
  console.log('Dashboard: Date range watcher triggered, currentPeriod changed to:', dateRangeStore.currentPeriod.value)
  loadData()
}, { deep: true })
watch(() => dateRangeStore.dateRange, () => {
  console.log('Dashboard: Date range watcher triggered, dateRange changed to:', dateRangeStore.dateRange)
  loadData()
}, { deep: true })
</script>