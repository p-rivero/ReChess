import { FirebaseError } from 'firebase-admin/lib/utils/error'
import { HttpsError } from 'firebase-functions/v1/https'
import { UserDoc, UserPrivateCacheDoc } from 'db/schema'
import { UserRecord } from 'firebase-admin/lib/auth/user-record'
import { useAdmin } from '../../helpers'

/**
 * Gets the user auth data, given a user ID.
 * @param {string} userId The UID of the user to fetch
 * @return {Promise<UserRecord>} A promise that resolves with the user data
 * @throws An HTTP error is returned if the user does not exist
 */
export async function fetchUserAuth(userId: string): Promise<UserRecord> {
  const { auth } = await useAdmin()
  try {
    return await auth.getUser(userId)
  } catch (untypedErr) {
    const e = untypedErr as FirebaseError
    if (e.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', `The user ${userId} does not exist.`)
    }
    console.error(e)
    throw new HttpsError('internal', 'An unexpected error occurred while fetching the user: ' + e.message)
  }
}

/**
 * Gets the user database document, given a user ID.
 * @param {string} userId The UID of the user to fetch
 * @return {Promise<UserDoc | undefined>} A promise that resolves with the user data,
 * or undefined if the user does not exist
 */
export async function fetchUserDoc(userId: string): Promise<UserDoc | undefined> {
  const { db } = await useAdmin()
  const userSnapshot = await db.collection('users').doc(userId).get()
  return userSnapshot.data() as UserDoc | undefined
}

/**
 * Gets the user private cache, given a user ID.
 * @param {string} userId The UID of the user to fetch the cache for
 * @return {Promise<UserPrivateCacheDoc | undefined>} A promise that resolves with the user cache,
 * or undefined if the user does not exist
 */
export async function fetchUserCache(userId: string): Promise<UserPrivateCacheDoc | undefined> {
  const { db } = await useAdmin()
  const userSnapshot = await db.collection('users').doc(userId).collection('privateCache').doc('doc').get()
  return userSnapshot.data() as UserPrivateCacheDoc | undefined
}
