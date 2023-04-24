import { db } from '@/firebase'
import type { UserDoc, UserPrivateDoc, UsernameDoc } from '@/firebase/db/schema'

import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore'
import type { User } from '@firebase/auth'

// Creates a new user in the database (public data + private data + username)
export async function createUser(user: User, username: string): Promise<UserDoc> {
  const newPublicData: UserDoc = {
    name: user.displayName,
    about: '',
    profileImg: user.photoURL,
    IMMUTABLE: {
      username: username,
      renameAllowedAt: null,
      numGamesPlayed: 0,
      numWinPoints: 0,
      last5Games: '[]',
    },
  }
  if (!user.email) throw new Error('User must have an email')
  const newPrivateData: UserPrivateDoc = {
    IMMUTABLE: {
      email: user.email,
      banned: false,
    },
  }
  const newUsername: UsernameDoc = {
    userId: user.uid,
  }
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', user.uid), newPublicData)
  batch.set(doc(db, 'users', user.uid, 'private', 'doc'), newPrivateData)
  batch.set(doc(db, 'usernames', username), newUsername)
  
  await batch.commit()
  
  return newPublicData
}

// username -> userId
export async function getId(username: string): Promise<string | undefined> {
  const document = await getDoc(doc(db, 'usernames', username))
  if (!document.exists()) return undefined
  const data = document.data() as UsernameDoc
  return data.userId
}

// userId -> UserDoc
export async function getUserById(uid: string): Promise<UserDoc | undefined> {
  const document = await getDoc(doc(db, 'users', uid))
  if (!document.exists()) return undefined
  return document.data() as UserDoc
}

// Update a user's public data
export async function updateUser(uid: string, name: string|null, about: string, profileImg: string|null): Promise<void> {
  const editableFields = { name, about, profileImg }
  await updateDoc(doc(db, 'users', uid), editableFields)
}
