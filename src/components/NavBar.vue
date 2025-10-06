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
              class="px-3 py-1 text-sm rounded-md border"
              :class="authStore.currentUser?.name === 'Shared' 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              Shared
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
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>