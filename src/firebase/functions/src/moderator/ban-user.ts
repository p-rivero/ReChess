
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { FirebaseError } from 'firebase-admin'
import { UserDoc } from 'db/schema'
import { UserRecord } from 'firebase-admin/auth'
import { batchedUpdate, useAdmin } from '../helpers'
import { updateName } from '../user/rename-user'
import assertModerator from './helpers/assert-moderator'

/**
 * Called directly by the moderator in order to ban a user.
 * If the user is already banned, this function does nothing and returns successfully.
 *
 * This does the following:
 * - Replaces the user's name with "[deleted]" in their profile and all of their variants.
 * - Removes the user's profile picture
 * - Removes the user's about information
 * - Prevents the user from logging in
 *
 * The user's variants, reports, and upvotes are NOT affected. See `wipe-user.ts` for a more thorough wipe.
 * @param {any} data The data passed to the function
 * @param {string} data.userId UID of the user that the moderator wishes to ban
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The user to be banned does not exist
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
  if (context.auth?.uid === userId) {
    throw new HttpsError('invalid-argument', 'Please do not ban yourself :(')
  }
  
  const user = await fetchUser(userId)
  
  if (user.customClaims?.moderator) {
    throw new HttpsError('invalid-argument', 'You cannot ban moderators directly. Please demote them first.')
  }
  if (user.disabled) {
    console.warn('The user is already banned: ' + userId)
    return
  }
  
  await banUser(userId)
  
  // Important: Find and stop games *before* removing the userId from them
  try {
    await stopOngoingGames(userId)
  } catch (e) {
    throw new HttpsError('internal', 'Cannot stop ongoing games: ' + e)
  }
  
  const { db } = await useAdmin()
  const updateObj: Partial<UserDoc> = {
    name: '[deleted]',
    about: '',
    profileImg: null,
    banned: true,
  }
  await db.collection('users').doc(userId).update(updateObj)
  await updateName(userId, null)
}


/**
 * Gets the user data given a user ID.
 * @param {string} userId The UID of the user to fetch
 * @return {Promise<UserRecord>} A promise that resolves with the user data
 * @throws An HTTP error is returned if the user does not exist
 */
async function fetchUser(userId: string): Promise<UserRecord> {
  const { auth } = await useAdmin()
  try {
    return await auth.getUser(userId)
  } catch (untypedErr) {
    const e = untypedErr as FirebaseError
    if (e.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'The user to be banned does not exist.')
    }
    console.error(e)
    throw new HttpsError('internal', 'An unexpected error occurred while fetching the user to be banned: ' + e.message)
  }
}

/**
 * Updates the user auth record to ban them.
 * @param {string} userId The UID of the user to ban
 * @return {Promise<void>} A promise that resolves when the user is banned
 * @throws An HTTP error is returned if an unexpected error occurs
 */
async function banUser(userId: string): Promise<void> {
  const { auth } = await useAdmin()
  try {
    await auth.updateUser(userId, {
      displayName: '[deleted]',
      photoURL: null,
      disabled: true,
    })
  } catch (untypedErr) {
    const e = untypedErr as FirebaseError
    console.error(e)
    throw new HttpsError('internal', 'An unexpected error occurred while banning the user: ' + e.message)
  }
  // The user's session token will expire in 1 hour, at which point they will be logged out.
  // Until then, they can still use the app normally (but are unable to update their profile).
}

/**
 * Finds all games that the user is currently playing and makes them a draw.
 * @param {string} userId The UID of the user to ban
 * @return {Promise<void>} A promise that resolves when all games are stopped
 */
async function stopOngoingGames(userId: string): Promise<void> {
  const { db } = await useAdmin()
  
  const stopGame = {
    'playerToMove': 'game-over',
    'winner': 'draw',
    'IMMUTABLE.calledFinishGame': true,
  }
  
  const ongoingGamesWhite = await db.collection('games')
    .where('IMMUTABLE.whiteId', '==', userId)
    .where('winner', '==', null)
    .get()
  await batchedUpdate(ongoingGamesWhite, (batch, ref) => batch.update(ref, stopGame))
  
  const ongoingGamesBlack = await db.collection('games')
    .where('IMMUTABLE.blackId', '==', userId)
    .where('winner', '==', null)
    .get()
  await batchedUpdate(ongoingGamesBlack, (batch, ref) => batch.update(ref, stopGame))
}
