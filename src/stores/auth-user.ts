import { ref } from 'vue'
import { defineStore } from 'pinia'

import { auth } from '@/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  type User,
  updateProfile,
} from 'firebase/auth'


export const useAuthStore = defineStore('auth-user', () => {
  let initialized = false
  const user = ref<User|null>(null)
  let inhibitLogIn = false
  
  // Called when user signs in or out (or when the page is refreshed)
  onAuthStateChanged(auth, newUser => {
    if (inhibitLogIn) return
    initialized = true
    user.value = newUser
  });
  
  
  // Attemps to log in with an email and password, returning true if the user exists
  async function emailLogIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password)
  }
  
  async function emailRegister(email: string, username: string, password: string): Promise<void> {
    // Do not store the user until the username is set
    inhibitLogIn = true
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: username })
    // Update the user
    user.value = credential.user
    initialized = true
    inhibitLogIn = false
  }
  
  async function signOut(): Promise<void> {
    await auth.signOut()
  }
  
  async function isLogged() {
    // Wait for the user to be initialized
    while (!initialized) await new Promise(resolve => setTimeout(resolve, 100))
    return user.value !== null
  }

  return { emailRegister, emailLogIn, signOut, isLogged, user }
})
