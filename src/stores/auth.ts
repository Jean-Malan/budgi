import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<{ id: string; name: string; email: string } | null>(null)
  const users = ref<{ id: string; name: string; email: string }[]>([])
  const isLoading = ref(false)

  const setUser = (user: { id: string; name: string; email: string } | null) => {
    currentUser.value = user
  }

  const switchUser = async (userName: 'Jean' | 'Izzy' | 'Shared') => {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', userName)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error switching user:', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name')

      if (error) throw error
      users.value = data || []
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const logout = () => {
    setUser(null)
  }

  return {
    currentUser,
    users,
    isLoading,
    setUser,
    switchUser,
    loadUsers,
    logout
  }
})