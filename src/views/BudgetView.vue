<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Budget</h1>
            <p class="text-sm text-gray-500 mt-1">Manage your monthly budget allocation</p>
          </div>
          <button
            @click="showAddCategory = true"
            class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Add Category
          </button>
        </div>
      </div>
    </div>

    <div v-if="!authStore.currentUser" class="flex items-center justify-center h-64">
      <p class="text-gray-500">Please select a user to manage budget</p>
    </div>

    <div v-else class="px-8 py-8 space-y-8">
      <!-- Month Navigation -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-1">
          <button
            v-for="month in months"
            :key="month.value"
            @click="selectedMonth = month.value"
            class="px-4 py-2 text-sm font-medium transition-colors rounded-md"
            :class="selectedMonth === month.value 
              ? 'bg-gray-900 text-white' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
          >
            {{ month.name }}
          </button>
        </div>
        
        <button
          @click="showCopyConfirmation = true"
          :disabled="selectedMonth === 12"
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copy current month's budget to all future months"
        >
          Copy to Future Months
        </button>
      </div>

      <!-- Monthly Income -->
      <div class="space-y-6">
        <h2 class="text-lg font-semibold text-gray-900">Monthly Income</h2>
        <div class="grid grid-cols-3 gap-6">
          <!-- Jean -->
          <div class="group">
            <label class="block text-sm font-medium text-gray-700 mb-3">Jean</label>
            <div class="relative">
              <input
                v-model.number="monthlyIncomes.Jean"
                @blur="saveIncomeForUser('Jean', monthlyIncomes.Jean)"
                type="number"
                step="0.01"
                placeholder="0"
                class="w-full px-4 py-4 text-xl font-medium text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-gray-400 pointer-events-none">$</span>
            </div>
          </div>

          <!-- Izzy -->
          <div class="group">
            <label class="block text-sm font-medium text-gray-700 mb-3">Izzy</label>
            <div class="relative">
              <input
                v-model.number="monthlyIncomes.Izzy"
                @blur="saveIncomeForUser('Izzy', monthlyIncomes.Izzy)"
                type="number"
                step="0.01"
                placeholder="0"
                class="w-full px-4 py-4 text-xl font-medium text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-gray-400 pointer-events-none">$</span>
            </div>
          </div>

          <!-- Shared -->
          <div class="group">
            <label class="block text-sm font-medium text-gray-700 mb-3">Shared</label>
            <div class="relative">
              <input
                v-model.number="monthlyIncomes.Shared"
                @blur="saveIncomeForUser('Shared', monthlyIncomes.Shared)"
                type="number"
                step="0.01"
                placeholder="0"
                class="w-full px-4 py-4 text-xl font-medium text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-gray-400 pointer-events-none">$</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Categories -->
      <div class="space-y-6">
        <h2 class="text-lg font-semibold text-gray-900">Budget Categories</h2>
        
        <div v-if="budgetStore.isLoading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        
        <div v-else-if="uniqueCategories.length === 0" class="text-center py-12">
          <p class="text-gray-500">No categories yet. Create your first budget category!</p>
        </div>
        
        <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <!-- Desktop Table Header -->
          <div class="hidden md:grid grid-cols-5 gap-6 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Category</div>
            <div class="text-sm font-semibold text-gray-700 uppercase tracking-wide text-center">Jean</div>
            <div class="text-sm font-semibold text-gray-700 uppercase tracking-wide text-center">Izzy</div>
            <div class="text-sm font-semibold text-gray-700 uppercase tracking-wide text-center">Shared</div>
            <div class="text-sm font-semibold text-gray-700 uppercase tracking-wide text-center">Actions</div>
          </div>
          
          <!-- Category Rows -->
          <div
            v-for="(categoryName, index) in uniqueCategories"
            :key="categoryName"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
            :class="{ 'border-b border-gray-100': index < uniqueCategories.length - 1 }"
          >
            <!-- Desktop Layout -->
            <div class="hidden md:grid grid-cols-5 gap-6">
              <!-- Category Name -->
              <div class="flex items-center space-x-3">
                <div 
                  class="w-3 h-3 rounded-full" 
                  :style="{ backgroundColor: getCategoryColor(categoryName) }"
                ></div>
                <span class="font-medium text-gray-900">{{ categoryName }}</span>
              </div>
              
              <!-- Jean Budget -->
              <div class="flex justify-center">
                <div class="relative w-24">
                  <input
                    :value="getCategoryBudget(categoryName, 'Jean')"
                    @blur="updateCategoryBudget(categoryName, 'Jean', ($event.target as HTMLInputElement).value)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 text-center text-sm font-medium bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                </div>
              </div>
              
              <!-- Izzy Budget -->
              <div class="flex justify-center">
                <div class="relative w-24">
                  <input
                    :value="getCategoryBudget(categoryName, 'Izzy')"
                    @blur="updateCategoryBudget(categoryName, 'Izzy', ($event.target as HTMLInputElement).value)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 text-center text-sm font-medium bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                </div>
              </div>
              
              <!-- Shared Budget -->
              <div class="flex justify-center">
                <div class="relative w-24">
                  <input
                    :value="getCategoryBudget(categoryName, 'Shared')"
                    @blur="updateCategoryBudget(categoryName, 'Shared', ($event.target as HTMLInputElement).value)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    class="w-full px-3 py-2 text-center text-sm font-medium bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                </div>
              </div>
              
              <!-- Desktop Actions -->
              <div class="flex justify-center space-x-2">
                <button
                  @click="editCategoryByName(categoryName)"
                  class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit category"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  @click="confirmDeleteCategory(categoryName)"
                  class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete category"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Mobile Layout -->
            <div class="md:hidden space-y-4">
              <!-- Category Name -->
              <div class="flex items-center space-x-3">
                <div 
                  class="w-3 h-3 rounded-full" 
                  :style="{ backgroundColor: getCategoryColor(categoryName) }"
                ></div>
                <span class="font-medium text-gray-900">{{ categoryName }}</span>
              </div>
              
              <!-- Budget Inputs Grid -->
              <div class="grid grid-cols-3 gap-3">
                <!-- Jean -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-2">Jean</label>
                  <div class="relative">
                    <input
                      :value="getCategoryBudget(categoryName, 'Jean')"
                      @blur="updateCategoryBudget(categoryName, 'Jean', ($event.target as HTMLInputElement).value)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      class="w-full px-3 py-2 text-center text-sm font-medium bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                  </div>
                </div>
                
                <!-- Izzy -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-2">Izzy</label>
                  <div class="relative">
                    <input
                      :value="getCategoryBudget(categoryName, 'Izzy')"
                      @blur="updateCategoryBudget(categoryName, 'Izzy', ($event.target as HTMLInputElement).value)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      class="w-full px-3 py-2 text-center text-sm font-medium bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                  </div>
                </div>
                
                <!-- Shared -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-2">Shared</label>
                  <div class="relative">
                    <input
                      :value="getCategoryBudget(categoryName, 'Shared')"
                      @blur="updateCategoryBudget(categoryName, 'Shared', ($event.target as HTMLInputElement).value)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      class="w-full px-3 py-2 text-center text-sm font-medium bg-transparent border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
                  </div>
                </div>
                
                <!-- Mobile Actions -->
                <div class="flex justify-end space-x-2 pt-2">
                  <button
                    @click="editCategoryByName(categoryName)"
                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit category"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button
                    @click="confirmDeleteCategory(categoryName)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete category"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Summary -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Summary</h3>
        <div class="grid grid-cols-3 gap-8">
          <!-- Total Income -->
          <div class="text-center">
            <p class="text-sm font-medium text-gray-500 mb-2">Total Income</p>
            <p class="text-2xl font-bold text-gray-900">${{ totalMonthlyIncome.toFixed(2) }}</p>
          </div>
          
          <!-- Total Budget -->
          <div class="text-center">
            <p class="text-sm font-medium text-gray-500 mb-2">Total Budgeted</p>
            <p class="text-2xl font-bold text-gray-900">${{ budgetStore.totalBudget.toFixed(2) }}</p>
          </div>
          
          <!-- Remaining -->
          <div class="text-center">
            <p class="text-sm font-medium text-gray-500 mb-2">Remaining</p>
            <p class="text-2xl font-bold" :class="remaining >= 0 ? 'text-green-600' : 'text-red-600'">
              ${{ remaining.toFixed(2) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Category Modal -->
    <div v-if="showAddCategory || editingCategory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold text-gray-900 mb-6">
          {{ editingCategory ? 'Edit Category' : 'Add New Category' }}
        </h3>
        
        <form @submit.prevent="saveCategory" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input
              v-model="categoryForm.name"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Groceries, Entertainment"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Color</label>
            <div class="flex space-x-3">
              <div
                v-for="color in availableColors"
                :key="color"
                @click="categoryForm.color = color"
                class="w-10 h-10 rounded-lg cursor-pointer border-2 transition-all hover:scale-110"
                :class="categoryForm.color === color ? 'border-gray-900 scale-110' : 'border-gray-200'"
                :style="{ backgroundColor: color }"
              ></div>
            </div>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              :disabled="!categoryForm.name"
              class="flex-1 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ editingCategory ? 'Update' : 'Create' }}
            </button>
            <button
              type="button"
              @click="cancelEdit"
              class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Category Confirmation Dialog -->
    <div v-if="deletingCategory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </div>
        
        <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">Delete Category</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          Are you sure you want to delete "{{ deletingCategory.name }}"? This action cannot be undone.
        </p>
        
        <div class="flex space-x-3">
          <button
            @click="deletingCategory = null"
            class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            @click="deleteCategory"
            class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Copy to Future Months Confirmation Dialog -->
    <div v-if="showCopyConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </div>
        
        <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">Copy to Future Months</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          This will copy {{ months.find(m => m.value === selectedMonth)?.name }}'s budget allocations and monthly income to all future months ({{ months.filter(m => m.value > selectedMonth).map(m => m.name).join(', ') }}). Existing values will be overwritten.
        </p>
        
        <div class="flex space-x-3">
          <button
            @click="showCopyConfirmation = false"
            class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            @click="copyToFutureMonths"
            :disabled="budgetStore.isLoading"
            class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {{ budgetStore.isLoading ? 'Copying...' : 'Copy' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBudgetStore, type Category } from '@/stores/budget'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const budgetStore = useBudgetStore()

const showAddCategory = ref(false)
const editingCategory = ref<Category | null>(null)
const deletingCategory = ref<Category | null>(null)
const showCopyConfirmation = ref(false)
const selectedMonth = ref(new Date().getMonth() + 1) // Current month

const monthlyIncomes = reactive({
  Jean: 0,
  Izzy: 0,
  Shared: 0
})

const months = [
  { name: 'Jan', value: 1 },
  { name: 'Feb', value: 2 },
  { name: 'Mar', value: 3 },
  { name: 'Apr', value: 4 },
  { name: 'May', value: 5 },
  { name: 'Jun', value: 6 },
  { name: 'Jul', value: 7 },
  { name: 'Aug', value: 8 },
  { name: 'Sep', value: 9 },
  { name: 'Oct', value: 10 },
  { name: 'Nov', value: 11 },
  { name: 'Dec', value: 12 }
]

const categoryForm = ref({
  name: '',
  color: '#3B82F6'
})

const availableColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280'  // Gray
]

const currentPeriod = computed(() => {
  const now = new Date()
  const start = new Date(now.getFullYear(), selectedMonth.value - 1, 1)
  const end = new Date(now.getFullYear(), selectedMonth.value, 0)
  return {
    start: start.toISOString().split('T')[0] as string,
    end: end.toISOString().split('T')[0] as string
  }
})

const budgetPeriod = computed(() => {
  const now = new Date()
  const periodDate = new Date(now.getFullYear(), selectedMonth.value - 1, 1)
  return periodDate.toISOString().split('T')[0]
})

const totalMonthlyIncome = computed(() => {
  return (monthlyIncomes.Jean || 0) + (monthlyIncomes.Izzy || 0) + (monthlyIncomes.Shared || 0)
})

const remaining = computed(() => {
  return totalMonthlyIncome.value - (budgetStore.totalBudget || 0)
})

// Get unique category names across all users
const uniqueCategories = computed(() => {
  const categoryNames = new Set<string>()
  budgetStore.categories.forEach(category => {
    categoryNames.add(category.name)
  })
  return Array.from(categoryNames).sort()
})

// Get all categories data for easier access
const allCategories = computed(() => {
  return budgetStore.categories || []
})

const getCategoryColor = (categoryName: string) => {
  const category = allCategories.value.find(c => c.name === categoryName)
  return category?.color || '#3B82F6'
}

// Cache user IDs for quick lookup
const userIds = reactive<Record<string, string>>({})

const getCategoryBudget = (categoryName: string, userName: string) => {
  const userId = userIds[userName]
  if (!userId) return 0
  
  const category = allCategories.value.find(c => 
    c.name === categoryName && c.user_id === userId
  )
  if (!category) return 0
  
  const budgetEntry = budgetStore.getBudgetEntry(userId, category.id, budgetPeriod.value)
  return budgetEntry?.amount || 0
}

const updateCategoryBudget = async (categoryName: string, userName: string, value: string) => {
  const amount = parseFloat(value) || 0
  const userId = userIds[userName]
  
  if (!userId) return
  
  try {
    // Find existing category or create new one
    let category = allCategories.value.find(c => 
      c.name === categoryName && c.user_id === userId
    )
    
    if (!category) {
      // Create new category (without budget_amount)
      const color = getCategoryColor(categoryName)
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: categoryName,
          color: color
        })
        .select()
        .single()
      
      if (error) throw error
      category = data
      
      // Add to local categories
      budgetStore.categories.push(category)
    }
    
    // Create or update budget entry
    await budgetStore.createOrUpdateBudgetEntry(
      userId, 
      category.id, 
      budgetPeriod.value, 
      amount
    )
  } catch (error) {
    console.error(`Error updating budget for ${userName}:`, error)
  }
}

const loadBudgetData = async () => {
  if (!authStore.currentUser) return
  
  // Load categories for all users
  const { data: allCategoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
  
  if (!categoriesError && allCategoriesData) {
    budgetStore.categories = allCategoriesData
  }
  
  // Load budget entries for the current period
  await budgetStore.loadBudgetEntries(budgetPeriod.value)
  
  // Load user IDs and budget data for all three users for the selected month
  const users = ['Jean', 'Izzy', 'Shared']
  
  for (const userName of users) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userName)
      .single()
    
    if (user && !userError) {
      // Cache user ID for quick lookups
      userIds[userName] = user.id
      
      const { data: budget, error } = await supabase
        .from('budgets')
        .select('total_income')
        .eq('user_id', user.id)
        .eq('period_start', currentPeriod.value.start)
        .eq('period_end', currentPeriod.value.end)
        .maybeSingle()
      
      if (budget && !error) {
        monthlyIncomes[userName as keyof typeof monthlyIncomes] = budget.total_income
      } else {
        // Set default value if no budget exists
        monthlyIncomes[userName as keyof typeof monthlyIncomes] = 0
      }
    }
  }
}

const saveIncomeForUser = async (userName: string, amount: number) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('name', userName)
      .single()
    
    if (user && !userError) {
      const { error: budgetError } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          period_start: currentPeriod.value.start,
          period_end: currentPeriod.value.end,
          total_income: amount
        })
      
      if (budgetError) {
        console.error(`Error saving budget for ${userName}:`, budgetError)
      }
    } else {
      console.error(`User ${userName} not found:`, userError)
    }
  } catch (error) {
    console.error(`Error saving income for ${userName}:`, error)
  }
}

const editCategory = (category: Category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    color: category.color
  }
}

const saveCategory = async () => {
  try {
    if (editingCategory.value) {
      await budgetStore.updateCategory(editingCategory.value.id, categoryForm.value)
    } else {
      await budgetStore.createCategory(
        categoryForm.value.name,
        0,
        categoryForm.value.color
      )
    }
    await loadBudgetData()
    cancelEdit()
  } catch (error) {
    console.error('Error saving category:', error)
  }
}

const cancelEdit = () => {
  showAddCategory.value = false
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    color: '#3B82F6'
  }
}

const editCategoryByName = (categoryName: string) => {
  // Find the first category with this name (we'll edit the first user's version)
  const category = allCategories.value.find(c => c.name === categoryName)
  if (category) {
    editCategory(category)
  }
}

const confirmDeleteCategory = (categoryName: string) => {
  // Find the first category with this name for the confirmation dialog
  const category = allCategories.value.find(c => c.name === categoryName)
  if (category) {
    deletingCategory.value = category
  }
}

const deleteCategory = async () => {
  if (!deletingCategory.value) return
  
  try {
    // Delete all categories with this name across all users
    const categoriesToDelete = allCategories.value.filter(c => c.name === deletingCategory.value!.name)
    
    for (const category of categoriesToDelete) {
      await budgetStore.deleteCategory(category.id)
    }
    
    deletingCategory.value = null
    await loadBudgetData()
  } catch (error) {
    console.error('Error deleting category:', error)
    // Show error message to user
    if (error instanceof Error) {
      alert(error.message)
    } else {
      alert('Failed to delete category. Please try again.')
    }
  }
}

const copyToFutureMonths = async () => {
  try {
    await budgetStore.copyBudgetToFutureMonths(selectedMonth.value)
    showCopyConfirmation.value = false
    
    // Show success message
    alert(`Successfully copied ${months.find(m => m.value === selectedMonth.value)?.name}'s budget to all future months!`)
  } catch (error) {
    console.error('Error copying to future months:', error)
    alert('Failed to copy budget to future months. Please try again.')
  }
}

onMounted(loadBudgetData)
watch(() => authStore.currentUser, loadBudgetData)
watch(() => selectedMonth.value, loadBudgetData)
</script>