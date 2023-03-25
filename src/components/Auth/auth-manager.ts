import type { Ref } from 'vue'
import type SigninPopup from '@/components/Auth/SignInPopup.vue'

import { useAuthStore } from '@/stores/auth-user'
import { useUserStore } from '@/stores/user'

let signInPopup: Ref<InstanceType<typeof SigninPopup> | undefined> | null = null

export function setSignInPopup(popup: Ref<InstanceType<typeof SigninPopup> | undefined>) {
  signInPopup = popup
}

// Important routes that do not require the user to complete the sign in process
const WHITELISTED_ROUTES = [
  '/tos',
  '/privacy',
  '/cookies',
  // Add /about here when needed
]

// Call this when the user refreshes the page
export async function signInRefresh() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  // Allow users to use the website without logging in
  if (!authStore.loggedUser) return
  // If the user is authenticated, make sure they have completed the sign in process
  // For social logins, choose a username
  const user = await userStore.getUserById(authStore.loggedUser.uid)
  if (!user) {
    // Logged but user document does not exist, show the choose username popup
    showPopupIfNotWhitelisted('chooseUsername')
    return
  }
  // For email logins, verify the email
  checkEmailVerified()
}

export function requestSignIn() {
  showPopup('loginRegister')
}

// Returns true if the user is verified, false otherwise
export function checkEmailVerified(): boolean {
  // Called then the user has created an account with email and password,
  // or every time the user refreshes the page
  const authStore = useAuthStore()
  if (!authStore.loggedUser) throw new Error('Only call checkEmailVerified when logged in')
  const verified = authStore.loggedUser.verified
  if (verified) {
    // Email is verified, nothing else to do
    return true
  }
  // Email is not verified, show a popup
  showPopupIfNotWhitelisted('verifyEmail')
  return false
}

export function hideSignInPopup() {
  if (!signInPopup) throw new Error('Sign in popup not set')
  if (!signInPopup.value) throw new Error('Sign in popup not initialized')
  signInPopup.value.hide()
}


function showPopup(stage: 'loginRegister'|'chooseUsername'|'verifyEmail') {
  if (!signInPopup) throw new Error('Sign in popup not set')
  if (!signInPopup.value) throw new Error('Sign in popup not initialized')
  signInPopup.value.show(stage)
}

function showPopupIfNotWhitelisted(stage: 'loginRegister'|'chooseUsername'|'verifyEmail') {
  if (!WHITELISTED_ROUTES.includes(window.location.pathname)) {
    showPopup(stage)
  }
}
