<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NavBar from '@/components/NavBar.vue'
import AuthGate from '@/components/AuthGate.vue'

const authStore = useAuthStore()

onMounted(() => {
  // Auto-login as Jean for demo purposes
  authStore.switchUser('Jean')
})
</script>

<template>
  <AuthGate>
    <div class="min-h-screen bg-gray-50">
      <NavBar />
      <main class="px-4 py-8 w-full">
        <RouterView />
      </main>
    </div>
  </AuthGate>
</template>
