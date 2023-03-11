import { ref } from 'vue'
import { defineStore } from 'pinia'

import { auth, db } from '@/firebase'
import * as fb from 'firebase/auth'
import { User } from './user'
import { RechessError } from '@/utils/errors/RechessError'
import { UserNotFoundError } from '@/utils/errors/UserNotFoundError'


export class AuthUser extends User {
  public email: string
  public verified: boolean
  
  constructor(user: fb.User, username: string) {
    const displayName = user.displayName ?? undefined // null -> undefined
    const photoURL = user.photoURL ?? undefined // null -> undefined
    super(username, displayName, undefined, photoURL)
    
    if (!user.email) throw new Error('User has no email')
    this.email = user.email
    this.verified = user.emailVerified
  }
}

export const useAuthStore = defineStore('auth-user', () => {
  let initialized = false
  let inhibitLogIn = false
  const user = ref<AuthUser|null>(null)
  const verified = ref(false)
  
  // Called when user signs in or out (or when the page is refreshed)
  fb.onAuthStateChanged(auth, async newUser => {
    if (inhibitLogIn) return
    updateUser(newUser)
  })
  async function updateUser(newUser: fb.User|null) {
    if (!newUser || !newUser.email) {
      user.value = null
      return
    }
    verified.value = newUser.emailVerified
    // The auth token does not include the username, we need to fetch it from the database
    const username = await DB.getUsername(newUser.uid)
    user.value = new AuthUser(newUser, username)
    initialized = true
  }
  
  
  // Attemps to log in with an email and password, throws an error if it fails (e.g. wrong password or user does not exist)
  // Updates the stored user if successful
  async function emailLogIn(email: string, password: string): Promise<void> {
    try {
      initialized = false
      await fb.signInWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      initialized = true
      switch (e.code) {
        case 'auth/user-not-found':
          throw new UserNotFoundError()
        case 'auth/wrong-password':
          throw new RechessError('WRONG_PASSWORD')
        default:
          console.error('Unknown error while logging in with email and password', e)
          throw e
      }
    }
  }
  
  
  // Creates a new user with an email and password, and updates the stored user
  async function emailRegister(email: string, username: string, password: string): Promise<void> {
    // Do not store the user until the database is updated
    inhibitLogIn = true
    
    let credential: fb.UserCredential
    try {
      credential = await fb.createUserWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      switch (e.code) {
        case 'auth/email-already-in-use':
          throw new RechessError('EMAIL_ALREADY_IN_USE')
        default:
          throw e
      }
    }
    
    try {
      await DB.createUser(credential.user, username)
    } catch (e) {
      // If the database update fails, delete the user auth
      await credential.user.delete()
      throw e
    }
    // Update the user in the store
    await updateUser(credential.user)
    inhibitLogIn = false
  }
  
  
  // Signs out the user and updates the store
  async function signOut(): Promise<void> {
    await auth.signOut()
  }
  
  async function sendEmailVerification() {
    if (!auth.currentUser) throw new Error('User is not logged in')
    await fb.sendEmailVerification(auth.currentUser, {
      url: window.location.origin,
      handleCodeInApp: true
    })
    // Obtain code from the user.
    // await applyActionCode(auth, code)
  }
  
  // Returns true if the user is logged in, false otherwise
  async function isLogged() {
    // Wait for the user to be initialized
    while (!initialized) await new Promise(resolve => setTimeout(resolve, 100))
    return user.value !== null
  }
  
  // Returns true if a username is available
  async function checkUsername(username: string): Promise<boolean> {
    return (await DB.getUserId(username)) === undefined
  }

  return { emailLogIn, emailRegister, signOut, sendEmailVerification, isLogged, checkUsername, user }
})



// Firestore access

import { doc, getDoc, writeBatch } from 'firebase/firestore'
import type { UserDoc, UsernameDoc, UserPrivateDoc } from '@/firebase/firestore'
namespace DB {
  
  export async function createUser(user: fb.User, username: string) {
    const batch = writeBatch(db)
    const newPublicData: UserDoc = {
      name: user.displayName,
      about: '',
      profileImg: user.photoURL,
      SERVER: {
        username: username,
        numWins: 0,
      }
    }
    if (!user.email) throw new Error('User must have an email')
    const newPrivateData: UserPrivateDoc = {
      SERVER: {
        email: user.email,
        banned: false,
      }
    }
    const newUsername: UsernameDoc = {
      userId: user.uid,
    }
    batch.set(doc(db, "users", user.uid), newPublicData)
    batch.set(doc(db, "users", user.uid, "private", "doc"), newPrivateData)
    batch.set(doc(db, "usernames", username), newUsername)
    
    try {
      await batch.commit()
    } catch (e) {
      throw new RechessError('CANNOT_CREATE_USER')
    }
  }
  
  export async function getUsername(uid: string): Promise<string> {
    const document = await getDoc(doc(db, "users", uid))
    // The document should always exist
    if (!document.exists()) return '[ERROR]'
    const data = document.data() as UserDoc
    return data.SERVER.username
  }
  
  export async function getUserId(username: string): Promise<string | undefined> {
    const document = await getDoc(doc(db, "usernames", username))
    if (!document.exists()) return undefined
    const data = document.data() as UsernameDoc
    return data.userId
  }
}
