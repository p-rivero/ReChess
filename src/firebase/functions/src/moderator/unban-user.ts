
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { FieldValue } from 'firebase-admin/firestore'
import { UserDoc } from 'db/schema'
import { batchedUpdate, useAdmin } from '../helpers'
import { fetchDataBackup, removeDataBackup } from './helpers/report-utils'
import { fetchUserAuth, fetchUserDoc } from '../user/helpers/fetch-user'
import assertModerator from './helpers/assert-moderator'

/**
 * Called directly by the moderator in order to lift a user's ban.
 * If the user is not banned, this function does nothing and returns successfully.
 *
 * This does the following:
 * - Restores the user's name in their profile and all of their variants.
 * - Restores the user's profile picture and about information
 * - Allows the user to log in again
 *
 * If the user information has been deleted with `wipe-user.ts`, it will not be restored.
 * @param {any} data The data passed to the function
 * @param {string} data.userId UID of the user that the moderator wants to unban
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The user to be unbanned does not exist
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  assertModerator(context)
  
  // Validate input
  const { userId } = data as { userId: unknown }
  if (!userId) {
    throw new HttpsError('invalid-argument', 'The function must be called with a userId.')
  }
  if (typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'The userId must be a string.')
  }
  const user = await fetchUserAuth(userId)
  
  if (!user.disabled) {
    console.warn('The user is not banned: ' + userId)
    return
  }
  
  await restoreDataFromBackup(userId)
  await unbanUser(userId)
  await removeDataBackup(userId)
}

async function unbanUser(userId: string): Promise<void> {
  const { auth } = await useAdmin()
  try {
    await auth.updateUser(userId, {
      disabled: false,
    })
  } catch (untypedErr) {
    const e = untypedErr as Error
    console.error(e)
    throw new HttpsError('internal', 'An unexpected error occurred while unbanning the user: ' + e.message)
  }
  // The user's session token will expire in 1 hour, at which point they will be logged out.
  // Until then, they can still use the app normally (but are unable to update their profile).
}


async function restoreDataFromBackup(userId: string): Promise<void> {
  const { db } = await useAdmin()
  const [userDoc, userBackup] = await Promise.all([
    fetchUserDoc(userId),
    fetchDataBackup(userId),
  ])
  if (!userDoc) {
    throw new HttpsError('not-found', `Cannot find user ${userId}.`)
  }
  if (!userBackup) {
    throw new HttpsError('not-found', `Cannot find backup of user ${userId}.`)
  }
  const updateObj: Partial<UserDoc> = {
    name: userBackup.name,
    about: userBackup.about,
    profileImg: userBackup.profileImg,
    banned: FieldValue.delete() as unknown as undefined,
  }
  await db.collection('users').doc(userId).update(updateObj)
  
  const displayName = userBackup.name ?? `@${userDoc.IMMUTABLE.username}`
  
  const gamesAsWhite = userBackup.gamesAsWhite.split(' ')
    .filter((id) => id !== '')
    .map((gameId) => db.collection('games').doc(gameId))
  await batchedUpdate(gamesAsWhite, (batch, ref) => {
    batch.update(ref, {
      'IMMUTABLE.whiteId': userId,
      'IMMUTABLE.whiteDisplayName': displayName,
    })
  })
  
  const gamesAsBlack = userBackup.gamesAsBlack.split(' ')
    .filter((id) => id !== '')
    .map((gameId) => db.collection('games').doc(gameId))
  await batchedUpdate(gamesAsBlack, (batch, ref) => {
    batch.update(ref, {
      'IMMUTABLE.blackId': userId,
      'IMMUTABLE.blackDisplayName': displayName,
    })
  })
  
  const variants = userBackup.publishedVariants.split(' ')
    .filter((id) => id !== '')
    .map((variantId) => db.collection('variants').doc(variantId))
  await batchedUpdate(variants, (batch, ref) => {
    batch.update(ref, {
      creatorId: userId,
      creatorDisplayName: displayName,
    })
  })
}
