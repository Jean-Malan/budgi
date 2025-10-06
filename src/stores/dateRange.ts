import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDateRangeStore = defineStore('dateRange', () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const startStr = start.toISOString().split('T')[0] as string
  const endStr = end.toISOString().split('T')[0] as string

  const dateRange = ref<[string, string]>([startStr, endStr])
  const selectedMonth = ref(new Date())

  const currentPeriod = computed(() => {
    console.log('Computing currentPeriod. DateRange:', dateRange.value, 'Length:', dateRange.value.length)
    if (dateRange.value.length === 2) {
      const result = {
        start: dateRange.value[0],
        end: dateRange.value[1]
      }
      console.log('CurrentPeriod from dateRange:', result)
      return result
    }
    
    // Fallback to current month if no range selected
    const start = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth(), 1)
    const end = new Date(selectedMonth.value.getFullYear(), selectedMonth.value.getMonth() + 1, 0)
    const result = {
      start: start.toISOString().split('T')[0] as string,
      end: end.toISOString().split('T')[0] as string
    }
    console.log('CurrentPeriod from selectedMonth fallback:', result)
    return result
  })

  const formatSelectedMonth = () => {
    return selectedMonth.value.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const previousMonth = () => {
    const newDate = new Date(selectedMonth.value)
    newDate.setMonth(newDate.getMonth() - 1)
    selectedMonth.value = newDate
  }

  const nextMonth = () => {
    const newDate = new Date(selectedMonth.value)
    newDate.setMonth(newDate.getMonth() + 1)
    selectedMonth.value = newDate
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const startStr = start.toISOString().split('T')[0] as string
    const endStr = end.toISOString().split('T')[0] as string

    dateRange.value = [startStr, endStr]
    selectedMonth.value = now
  }

  const setDateRange = (range: [string, string] | null) => {
    console.log('Setting date range in store:', range)
    if (range) {
      dateRange.value = range
      // Update selectedMonth to the start of the range
      selectedMonth.value = new Date(range[0])
    } else {
      // If range is null, reset to current month
      goToCurrentMonth()
    }
  }

  // Initialize with current month on store creation
  const initializeCurrentMonth = () => {
    goToCurrentMonth()
  }

  return {
    dateRange,
    selectedMonth,
    currentPeriod,
    formatSelectedMonth,
    previousMonth,
    nextMonth,
    goToCurrentMonth,
    setDateRange,
    initializeCurrentMonth
  }
})