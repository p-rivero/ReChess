import { db } from '@/firebase'
import type { ModerationDoc, ReportDoc, UserDoc, UserPrivateCacheDoc, UserPrivateDoc, UsernameDoc } from '@/firebase/db/schema'

import { Timestamp, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
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
      lastGamesOpponentIds: [],
      lastGamesVariantIds: [],
    },
  }
  if (!user.email) throw new Error('User must have an email')
  const newPrivateData: UserPrivateDoc = {
    IMMUTABLE: {
      email: user.email,
    },
  }
  const newUsername: UsernameDoc = {
    userId: user.uid,
  }
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', user.uid), newPublicData)
  batch.set(doc(db, 'users', user.uid, 'private', 'doc'), newPrivateData)
  batch.set(doc(db, 'users', user.uid, 'renameTrigger', 'doc'), { name: user.displayName, username })
  batch.set(doc(db, 'usernames', username), newUsername)
  
  await batch.commit()
  
  return newPublicData
}

// username -> [userId, UserDoc]
export async function getUserByUsername(username: string): Promise<[string, UserDoc] | undefined> {
  const q = query(collection(db, 'users'), where('IMMUTABLE.username', '==', username))
  const querySnapshot = await getDocs(q)
  if (querySnapshot.size === 0) return undefined
  if (querySnapshot.size > 1) throw new Error('Multiple users with the same username')
  const userId = querySnapshot.docs[0].id
  const doc = querySnapshot.docs[0].data() as UserDoc
  return [userId, doc]
}

// userId -> UserDoc
export async function getUserById(uid: string): Promise<UserDoc | undefined> {
  const document = await getDoc(doc(db, 'users', uid))
  if (!document.exists()) return undefined
  return document.data() as UserDoc
}
// userId -> UserPrivateCacheDoc
export async function getUserPrivateCache(uid: string): Promise<UserPrivateCacheDoc | undefined> {
  const document = await getDoc(doc(db, 'users', uid, 'privateCache', 'doc'))
  if (!document.exists()) return undefined
  return document.data() as UserPrivateCacheDoc
}

// Update a user's public data
export async function updateUser(uid: string, name: string|null, about: string, profileImg: string|null, updateName: boolean): Promise<void> {
  const editableFields = { name, about, profileImg }
  if (updateName) {
    const batch = writeBatch(db)
    batch.update(doc(db, 'users', uid), editableFields)
    batch.update(doc(db, 'users', uid, 'renameTrigger', 'doc'), { name })
    await batch.commit()
  } else {
    await updateDoc(doc(db, 'users', uid), editableFields)
  }
}

// Reports a user
export async function reportUser(reporterId: string, reportedUserId: string, onlyBlock: boolean, reason: string): Promise<void> {
  const reportDoc: ReportDoc = {
    time: serverTimestamp() as Timestamp,
    reason: reason,
    onlyBlock,
  }
  await setDoc(doc(db, 'users', reporterId, 'reportedUsers', reportedUserId), reportDoc)
}

// Gets a list of all moderation reports for users that have been reported 1 or more times
export async function getModerationReports(): Promise<[string, ModerationDoc][]> {
  const q = query(collection(db, 'userModeration'), where('numReports', '>=', 1), orderBy('numReports', 'desc'))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => [doc.id, doc.data() as ModerationDoc])
}
