import type { Ref } from 'vue'
import type SigninPopup from '@/components/Popup/SignInPopup.vue'

import { useAuthStore } from '@/stores/auth-user'

let signInPopup: Ref<InstanceType<typeof SigninPopup> | undefined> | null = null

export function setSignInPopup(popup: Ref<InstanceType<typeof SigninPopup> | undefined>) {
  signInPopup = popup
}

export async function signInRefresh() {
  const authStore = useAuthStore()
  const isLogged = await authStore.isLogged()
  // Allow users to use the website without logging in
  if (!isLogged) return
  // If the user is authenticated, make sure they have completed the sign in process
  // TODO: Get the user from the database
}

export async function requestSignIn(): Promise<void> {
  if (!signInPopup) throw new Error('Sign in popup not set')
  if (!signInPopup.value) throw new Error('Sign in popup not initialized')
  await signInPopup.value.show('loginRegister')
}
