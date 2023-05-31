import { FirebaseError } from 'firebase-admin/lib/utils/error'
import { HttpsError } from 'firebase-functions/v1/https'
import { UserRecord } from 'firebase-admin/lib/auth/user-record'
import { useAdmin } from '../../helpers'

/**
 * Gets the user data given a user ID.
 * @param {string} userId The UID of the user to fetch
 * @return {Promise<UserRecord>} A promise that resolves with the user data
 * @throws An HTTP error is returned if the user does not exist
 */
export async function fetchUser(userId: string): Promise<UserRecord> {
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
