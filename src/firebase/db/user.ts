import { db } from '@/firebase'
import type { UserDoc, UsernameDoc, UserPrivateDoc } from '@/firebase/db/schema'

import { doc, getDoc, writeBatch } from 'firebase/firestore'
import type { User } from '@firebase/auth'

// Creates a new user in the database (public data + private data + username)
export async function createUser(user: User, username: string) {
  const batch = writeBatch(db)
  const newPublicData: UserDoc = {
    name: user.displayName,
    about: '',
    profileImg: user.photoURL,
    IMMUTABLE: {
      username: username,
      numWins: 0,
    }
  }
  if (!user.email) throw new Error('User must have an email')
  const newPrivateData: UserPrivateDoc = {
    IMMUTABLE: {
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
  
  await batch.commit()
}

// username -> userId
export async function getId(username: string): Promise<string | undefined> {
  const document = await getDoc(doc(db, "usernames", username))
  if (!document.exists()) return undefined
  const data = document.data() as UsernameDoc
  return data.userId
}

// userId -> UserDoc
export async function getUserById(uid: string): Promise<UserDoc | undefined> {
  const document = await getDoc(doc(db, "users", uid))
  if (!document.exists()) return undefined
  return document.data() as UserDoc
}

// userId -> username
export async function getUsername(uid: string): Promise<string> {
  const user = await getUserById(uid)
  // If the user has logged in with a third-party provider, the document
  // doesn't exist until they choose a username.
  if (!user) return ''
  return user.IMMUTABLE.username
}

