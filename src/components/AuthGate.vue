<template>
  <div v-if="!isAuthenticated" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Finance App</h1>
        <p class="text-gray-600">Enter password to access</p>
      </div>
      
      <form @submit.prevent="authenticate" class="space-y-4">
        <div>
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Login
        </button>
        
        <div v-if="error" class="text-red-600 text-sm text-center">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const password = ref('')
const error = ref('')
const isAuthenticated = ref(false)

// Password from environment variable or fallback
const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'myfinanceapp123'

// Debug: Log the password (remove this in production)
console.log('Environment password:', import.meta.env.VITE_APP_PASSWORD)
console.log('Using password:', CORRECT_PASSWORD)

const authenticate = () => {
  if (password.value === CORRECT_PASSWORD) {
    isAuthenticated.value = true
    localStorage.setItem('finance_auth', 'true')
    error.value = ''
  } else {
    error.value = 'Incorrect password'
    password.value = ''
  }
}

onMounted(() => {
  // Check if already authenticated
  isAuthenticated.value = localStorage.getItem('finance_auth') === 'true'
})
</script>