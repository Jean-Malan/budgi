<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-800">Tags</h1>
      <button
        @click="showCreateTagModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Create New Tag
      </button>
    </div>

    <div v-if="!authStore.currentUser" class="text-center py-8">
      <p class="text-gray-600">Please select a user to view tags.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Tags Overview -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tag Summary</h3>
        
        <div v-if="budgetStore.isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        
        <div v-else-if="budgetStore.transactionTags.length === 0" class="text-center py-8">
          <p class="text-gray-500">No tags created yet. Create your first tag to start organizing transactions!</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="tag in budgetStore.transactionTags"
            :key="tag.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <div
                  class="w-4 h-4 rounded-full"
                  :style="{ backgroundColor: tag.color }"
                ></div>
                <h4 class="font-medium text-gray-900">{{ tag.name }}</h4>
              </div>
              <div class="flex space-x-1">
                <button
                  @click="editTag(tag)"
                  class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit tag"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  @click="deleteTagConfirm(tag)"
                  class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete tag"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <p v-if="tag.description" class="text-sm text-gray-600 mb-3">{{ tag.description }}</p>
            
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Transactions:</span>
                <span class="font-medium">{{ getTransactionCount(tag.id) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Total Cost:</span>
                <span class="font-bold text-red-600">${{ getTagTotalCost(tag.id).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Avg. Transaction:</span>
                <span class="font-medium">${{ getAverageTransactionAmount(tag.id).toFixed(2) }}</span>
              </div>
            </div>
            
            <button
              @click="viewTagTransactions(tag)"
              class="w-full mt-3 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              View Transactions
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Tag Modal -->
    <div v-if="showCreateTagModal || showEditTagModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold text-gray-900 text-center mb-6">
          {{ showEditTagModal ? 'Edit Tag' : 'Create New Tag' }}
        </h3>
        
        <form @submit.prevent="saveTag" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tag Name</label>
            <input
              v-model="tagForm.name"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Vacation 2024"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              v-model="tagForm.description"
              rows="3"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of what this tag is for..."
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div class="flex space-x-2 mb-2">
              <button
                v-for="color in predefinedColors"
                :key="color"
                type="button"
                @click="tagForm.color = color"
                class="w-8 h-8 rounded-full border-2 transition-all"
                :class="tagForm.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
            <input
              v-model="tagForm.color"
              type="color"
              class="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
            />
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="cancelTagForm"
              class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {{ showEditTagModal ? 'Update Tag' : 'Create Tag' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBudgetStore } from '@/stores/budget'

const router = useRouter()
const authStore = useAuthStore()
const budgetStore = useBudgetStore()

const showCreateTagModal = ref(false)
const showEditTagModal = ref(false)
const editingTag = ref<any>(null)

const tagForm = ref({
  name: '',
  description: '',
  color: '#3B82F6'
})

const predefinedColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#6366F1', '#84CC16', '#F97316', '#06B6D4'
]

const getTransactionCount = (tagId: string) => {
  return budgetStore.getTransactionsForTag(tagId).length
}

const getTagTotalCost = (tagId: string) => {
  return budgetStore.getTagTotalCost(tagId)
}

const getAverageTransactionAmount = (tagId: string) => {
  const transactions = budgetStore.getTransactionsForTag(tagId)
  if (transactions.length === 0) return 0
  return budgetStore.getTagTotalCost(tagId) / transactions.length
}

const editTag = (tag: any) => {
  editingTag.value = tag
  tagForm.value = {
    name: tag.name,
    description: tag.description || '',
    color: tag.color
  }
  showEditTagModal.value = true
}

const deleteTagConfirm = async (tag: any) => {
  const transactionCount = getTransactionCount(tag.id)
  const message = transactionCount > 0 
    ? `Are you sure you want to delete "${tag.name}"? This will remove it from ${transactionCount} transaction(s).`
    : `Are you sure you want to delete "${tag.name}"?`
    
  if (confirm(message)) {
    try {
      await budgetStore.deleteTag(tag.id)
      alert('Tag deleted successfully!')
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag. Please try again.')
    }
  }
}

const saveTag = async () => {
  try {
    if (showEditTagModal.value && editingTag.value) {
      // Update existing tag (would need to add updateTag function to store)
      alert('Tag update functionality not yet implemented')
    } else {
      await budgetStore.createTag(tagForm.value.name, tagForm.value.description, tagForm.value.color)
      alert('Tag created successfully!')
    }
    cancelTagForm()
  } catch (error) {
    console.error('Error saving tag:', error)
    alert('Failed to save tag. Please try again.')
  }
}

const cancelTagForm = () => {
  showCreateTagModal.value = false
  showEditTagModal.value = false
  editingTag.value = null
  tagForm.value = {
    name: '',
    description: '',
    color: '#3B82F6'
  }
}

const viewTagTransactions = (tag: any) => {
  // Navigate to transactions page with tag filter
  router.push({ name: 'transactions', query: { tag: tag.id } })
}

const loadData = async () => {
  const user = authStore.currentUser
  if (!user) return
  
  await Promise.all([
    budgetStore.loadTransactionTags(),
    budgetStore.loadTagAssignments(),
    budgetStore.loadTransactions(
      new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
      new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0] // End of year
    )
  ])
}

onMounted(loadData)
watch(() => authStore.currentUser, loadData)
</script>