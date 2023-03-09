
import type { Ref } from 'vue'
import type SigninPopup from './SignInPopup.vue'

let signInPopup: Ref<InstanceType<typeof SigninPopup> | undefined> | null = null

export function setSignInPopup(popup: Ref<InstanceType<typeof SigninPopup> | undefined>) {
  signInPopup = popup
}

export function getSignInPopup(): InstanceType<typeof SigninPopup> {
  if (!signInPopup) throw new Error('Sign in popup not set')
  if (!signInPopup.value) throw new Error('Sign in popup not initialized')
  return signInPopup.value
}
