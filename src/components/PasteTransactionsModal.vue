<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Paste Excel Data</h2>
          <p class="text-sm text-gray-500 mt-1">Process your Excel data row by row with AI. Perfect for sentiment analysis.</p>
        </div>
        <button @click="resetModal" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          Reset
        </button>
      </div>

      <!-- Instructions -->
      <div class="px-6 py-4 bg-blue-50 border-b border-gray-200" v-if="step === 'paste'">
        <div class="flex items-start space-x-3">
          <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-blue-800">How to copy data from Excel:</h3>
            <ol class="text-sm text-blue-700 mt-2 space-y-1">
              <li>1. <span class="text-blue-600 font-medium">Select your data in Excel (including headers)</span></li>
              <li>2. <span class="text-blue-600 font-medium">Press Ctrl+C (or Cmd+C on Mac) to copy</span></li>
              <li>3. <span class="text-blue-600 font-medium">Paste the data in the text area below</span></li>
            </ol>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <!-- Step 1: Paste Data -->
        <div v-if="step === 'paste'" class="p-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Paste your Excel data here:
          </label>
          <textarea
            v-model="rawData"
            class="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Paste your data here..."
          ></textarea>
          <div class="flex justify-end mt-4">
            <button
              @click="processData"
              :disabled="!rawData.trim()"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Process Pasted Data
            </button>
          </div>
        </div>

        <!-- Step 2: Data Preview and Column Mapping -->
        <div v-else-if="step === 'preview'" class="p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Data Preview</h3>
          
          <!-- Column Mapping -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Map your columns:</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="(header, index) in headers" :key="index" class="space-y-2">
                <label class="block text-xs font-medium text-gray-600">
                  Column {{ index + 1 }}: "{{ header }}"
                </label>
                <select 
                  v-model="columnMapping[index]"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select mapping...</option>
                  <option value="date">Date</option>
                  <option value="description">Description</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                  <option value="type">Credit/Debit</option>
                  <option value="status">Status</option>
                  <option value="ignore">Ignore Column</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Additional Settings -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Transaction Settings:</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Default Category</label>
                <el-select
                  v-model="defaultCategory"
                  placeholder="Select default category"
                  class="w-full"
                  filterable
                >
                  <el-option
                    v-for="category in budgetStore.categories"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">User</label>
                <el-select
                  v-model="selectedUser"
                  placeholder="Select user"
                  class="w-full"
                >
                  <el-option
                    v-for="user in authStore.users"
                    :key="user.id"
                    :label="user.name"
                    :value="user.id"
                  />
                </el-select>
              </div>
            </div>
          </div>

          <!-- Data Preview Table -->
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div class="max-h-96 overflow-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th v-for="(header, index) in headers" :key="index" 
                        class="px-4 py-3 text-left font-medium text-gray-700 border-b border-gray-200">
                      {{ header }}
                      <div class="text-xs text-gray-500 mt-1">
                        {{ getColumnMappingLabel(columnMapping[index]) }}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(row, rowIndex) in previewRows" :key="rowIndex" class="hover:bg-gray-50">
                    <td v-for="(cell, cellIndex) in row" :key="cellIndex" 
                        class="px-4 py-3 text-gray-900 border-b border-gray-100">
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-between mt-6">
            <button
              @click="step = 'paste'"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Paste
            </button>
            <div class="space-x-3">
              <button
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="saveTransactions"
                :disabled="!isValidMapping"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save {{ rows.length }} Transaction{{ rows.length !== 1 ? 's' : '' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBudgetStore } from '@/stores/budget'
import { ElSelect, ElOption, ElMessage } from 'element-plus'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const budgetStore = useBudgetStore()

// State
const step = ref<'paste' | 'preview'>('paste')
const rawData = ref('')
const headers = ref<string[]>([])
const rows = ref<string[][]>([])
const columnMapping = ref<{ [key: number]: string }>({})
const defaultCategory = ref('')
const selectedUser = ref('')

// Computed
const previewRows = computed(() => rows.value.slice(0, 10)) // Show first 10 rows

const isValidMapping = computed(() => {
  const mappings = Object.values(columnMapping.value)
  return mappings.includes('date') && 
         mappings.includes('description') && 
         mappings.includes('amount') &&
         selectedUser.value
})

// Methods
const processData = () => {
  if (!rawData.value.trim()) return

  const lines = rawData.value.trim().split('\n')
  if (lines.length < 2) {
    ElMessage.error('Please provide at least a header row and one data row')
    return
  }

  // Parse first line as headers
  const firstLine = lines[0]
  if (!firstLine) {
    ElMessage.error('No header row found')
    return
  }
  headers.value = parseCSVLine(firstLine)
  
  // Parse remaining lines as data
  rows.value = lines.slice(1).map(line => parseCSVLine(line))
  
  // Initialize column mapping
  columnMapping.value = {}
  
  // Auto-detect common columns
  headers.value.forEach((header, index) => {
    const lowerHeader = header.toLowerCase().trim()
    if (lowerHeader.includes('date')) {
      columnMapping.value[index] = 'date'
    } else if (lowerHeader.includes('description') || lowerHeader.includes('desc')) {
      columnMapping.value[index] = 'description'
    } else if (lowerHeader.includes('amount') || lowerHeader.includes('$')) {
      columnMapping.value[index] = 'amount'
    } else if (lowerHeader.includes('credit') || lowerHeader.includes('debit')) {
      columnMapping.value[index] = 'type'
    }
  })

  // Set default user to current user
  if (authStore.currentUser) {
    selectedUser.value = authStore.currentUser.id
  }

  step.value = 'preview'
}

const parseCSVLine = (line: string): string[] => {
  // Simple CSV parser - handles basic cases
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === '\t' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

const getColumnMappingLabel = (mapping: string | undefined): string => {
  if (!mapping) return 'Not mapped'
  const labels: { [key: string]: string } = {
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    category: 'Category',
    type: 'Credit/Debit',
    status: 'Status',
    ignore: 'Ignored'
  }
  return labels[mapping] || mapping
}

const saveTransactions = async () => {
  if (!isValidMapping.value) return

  try {
    const dateIndex = Object.keys(columnMapping.value).find(key => columnMapping.value[parseInt(key)] === 'date')
    const descIndex = Object.keys(columnMapping.value).find(key => columnMapping.value[parseInt(key)] === 'description')
    const amountIndex = Object.keys(columnMapping.value).find(key => columnMapping.value[parseInt(key)] === 'amount')
    const typeIndex = Object.keys(columnMapping.value).find(key => columnMapping.value[parseInt(key)] === 'type')

    if (!dateIndex || !descIndex || !amountIndex) {
      ElMessage.error('Date, Description, and Amount columns are required')
      return
    }

    for (const row of rows.value) {
      const dateStr = row[parseInt(dateIndex)]
      const description = row[parseInt(descIndex)]
      const amountStr = row[parseInt(amountIndex)]
      const typeStr = typeIndex ? row[parseInt(typeIndex)] : ''

      // Skip row if required fields are missing
      if (!dateStr || !description || !amountStr) {
        ElMessage.error('Row has missing required fields')
        continue
      }

      // Parse date
      let date: string
      try {
        const parsedDate = new Date(dateStr)
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date')
        }
        const dateResult = parsedDate.toISOString().split('T')[0]
        if (!dateResult) throw new Error('Invalid date format')
        date = dateResult
      } catch {
        ElMessage.error(`Invalid date format: ${dateStr}`)
        continue
      }

      // Parse amount
      let amount: number
      try {
        amount = Math.abs(parseFloat(amountStr.replace(/[^0-9.-]/g, '')))
        if (isNaN(amount)) {
          throw new Error('Invalid amount')
        }
      } catch {
        ElMessage.error(`Invalid amount format: ${amountStr}`)
        continue
      }

      // Determine if it's income based on type column or amount
      const isIncome = typeStr?.toLowerCase().includes('credit') || amount < 0

      await budgetStore.createTransaction({
        user_id: selectedUser.value,
        bank_account_id: null,
        category_id: defaultCategory.value || null,
        amount: Math.abs(amount),
        description: description.trim(),
        date,
        is_income: isIncome,
        is_categorized: !!defaultCategory.value,
        confidence_score: null,
        is_debt: false,
        debt_creditor_id: null,
        debt_debtor_id: null,
        debt_split_percentage: null,
        debt_status: null,
        debt_remaining_amount: null,
        is_payback: false,
        payback_from_user_id: null,
        is_highlighted: false,
        notes: null
      })
    }

    ElMessage.success(`Successfully imported ${rows.value.length} transactions`)
    emit('saved')
    resetModal()
  } catch (error) {
    console.error('Error saving transactions:', error)
    ElMessage.error('Error saving transactions')
  }
}

const resetModal = () => {
  step.value = 'paste'
  rawData.value = ''
  headers.value = []
  rows.value = []
  columnMapping.value = {}
  defaultCategory.value = ''
  selectedUser.value = ''
}

const closeModal = () => {
  emit('close')
}

// Watch for modal close to reset
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    resetModal()
  }
})
</script>