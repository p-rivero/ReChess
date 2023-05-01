import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// For now, the preferences are stored in localStorage, but this should be moved to the database
// so that the user's preferences are synced across devices.
// These preferences should be added to AuthUser and stored in the user private document.

export const useUserPrefsStore = defineStore('user-preferences', () => {
  
  const SEE_CREATE_HINT = true
  const SUGGEST_USING_TEMPLATE = true
  
  const seeCreateHint = ref(getLocalFlag('seeCreateHint', SEE_CREATE_HINT))
  const suggestUsingTemplate = ref(getLocalFlag('suggestUsingTemplate', SUGGEST_USING_TEMPLATE))
  
  watch(seeCreateHint, () => saveToStorage('seeCreateHint', seeCreateHint.value))
  watch(suggestUsingTemplate, () => saveToStorage('suggestUsingTemplate', suggestUsingTemplate.value))
  
  return { seeCreateHint, suggestUsingTemplate }
})


interface Stringifiable {
  toString(): string
}
function getFromStorage(key: string, defaultValue: Stringifiable): string {
  return localStorage.getItem(key) ?? defaultValue.toString()
}
function saveToStorage(key: string, value: Stringifiable) {
  localStorage.setItem(key, value.toString())
}
function getLocalFlag(key: string, defaultValue: boolean): boolean {
  return getFromStorage(key, defaultValue) === 'true'
}
