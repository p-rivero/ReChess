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
  checkEmailVerified()
}

export async function requestSignIn(): Promise<void> {
  showPopup('loginRegister')
}

export async function checkEmailVerified() {
  // Called then the user has created an account with email and password,
  // or every time the user refreshes the page
  const authStore = useAuthStore()
  const isLogged = await authStore.isLogged()
  if (!isLogged) throw new Error('Only call checkEmailVerified when logged in')
  if (!authStore.user) throw new Error('User not set')
  const verified = authStore.user.verified
  if (verified) {
    // Email is verified, nothing else to do
    return
  }
  // Email is not verified, show a popup
  showPopup('verifyEmail')
}

function showPopup(stage: 'loginRegister'|'chooseUsername'|'verifyEmail') {
  if (!signInPopup) throw new Error('Sign in popup not set')
  if (!signInPopup.value) throw new Error('Sign in popup not initialized')
  signInPopup.value.show(stage)
}
