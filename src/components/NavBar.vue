<template>
  <nav class="bg-white shadow-lg">
    <div class="px-4">
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-gray-800">Finance Tracker</h1>
          <RouterLink 
            to="/" 
            class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md"
            :class="{ 'text-blue-600 bg-blue-50': $route.path === '/' }"
          >
            Dashboard
          </RouterLink>
          <RouterLink 
            to="/budget" 
            class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md"
            :class="{ 'text-blue-600 bg-blue-50': $route.path === '/budget' }"
          >
            Budget
          </RouterLink>
          <RouterLink 
            to="/transactions" 
            class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md"
            :class="{ 'text-blue-600 bg-blue-50': $route.path === '/transactions' }"
          >
            Transactions
          </RouterLink>
          <RouterLink 
            to="/tags" 
            class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md"
            :class="{ 'text-blue-600 bg-blue-50': $route.path === '/tags' }"
          >
            Tags
          </RouterLink>
          <RouterLink 
            to="/debts" 
            class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md"
            :class="{ 'text-blue-600 bg-blue-50': $route.path === '/debts' }"
          >
            Debts
          </RouterLink>
          <RouterLink 
            to="/bank-accounts" 
            class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md"
            :class="{ 'text-blue-600 bg-blue-50': $route.path === '/bank-accounts' }"
          >
            Bank Accounts
          </RouterLink>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">Switch User:</span>
            <button
              @click="authStore.switchUser('Jean')"
              class="px-3 py-1 text-sm rounded-md border"
              :class="authStore.currentUser?.name === 'Jean' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              Jean
            </button>
            <button
              @click="authStore.switchUser('Izzy')"
              class="px-3 py-1 text-sm rounded-md border"
              :class="authStore.currentUser?.name === 'Izzy' 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              Izzy
            </button>
            <button
              @click="authStore.switchUser('Shared')"
              @contextmenu.prevent="handleSharedRightClick"
              class="px-3 py-1 text-sm rounded-md border transition-colors"
              :class="authStore.currentUser?.name === 'Shared'
                ? authStore.viewAllMode
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              Shared
            </button>
          </div>

          <!-- Context Menu for Shared button -->
          <div
            v-if="showSharedMenu"
            @click.stop="closeSharedMenu"
            class="fixed inset-0 z-40"
          ></div>
          <div
            v-if="showSharedMenu"
            class="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 min-w-[180px]"
            :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }"
          >
            <button
              @click="toggleViewAllMode"
              class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <span>View All Users</span>
              <svg v-if="authStore.viewAllMode" class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div v-if="authStore.currentUser" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-medium">
                {{ authStore.currentUser.name.charAt(0) }}
              </span>
            </div>
            <span class="text-sm font-medium text-gray-700">
              {{ authStore.currentUser.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const showSharedMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const handleSharedRightClick = (event: MouseEvent) => {
  menuPosition.value = { x: event.clientX, y: event.clientY }
  showSharedMenu.value = true
}

const closeSharedMenu = () => {
  showSharedMenu.value = false
}

const toggleViewAllMode = async () => {
  console.log('Toggle view all mode clicked')
  console.log('Current viewAllMode:', authStore.viewAllMode)
  console.log('Current user:', authStore.currentUser?.name)

  // If not on Shared, switch to Shared first
  if (authStore.currentUser?.name !== 'Shared') {
    await authStore.switchUser('Shared')
  }

  authStore.toggleViewAllMode()
  console.log('New viewAllMode:', authStore.viewAllMode)
  closeSharedMenu()
}
</script>