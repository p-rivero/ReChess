import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  
  // Initialize the theme from the current document theme
  const currentTheme = ref(document.documentElement.getAttribute('data-theme') || 'dark')
  
  function toggle() {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
    currentTheme.value = newTheme
    // Update the document theme
    document.documentElement.setAttribute('data-theme', newTheme)
    // Store the new theme in localStorage so it persists across page refreshes
    localStorage.setItem('theme', newTheme)
  }
  
  return { currentTheme, toggle }
})
