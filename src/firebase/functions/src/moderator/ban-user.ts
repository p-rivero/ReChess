
import { BannedUserDataDoc, UserDoc } from 'db/schema'
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { fetchUserAuth } from '../user/helpers/fetch-user'
import { stopOngoingGames } from '../game/helpers/stop-ongoing-games'
import { updateName } from '../user/rename-user'
import { useAdmin } from '../helpers'
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
 * @param {string} data.userId UID of the user that the moderator wants to ban
 * @param {boolean} data.doNotBackup (Optional) If true, the user's data will not be backed up before being deleted
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function is complete
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as a moderator
 * - The user to be banned does not exist
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  assertModerator(context)
  
  // Validate input
  const { userId, doNotBackup } = data as { userId: unknown, doNotBackup: unknown }
  if (!userId) {
    throw new HttpsError('invalid-argument', 'The function must be called with a userId.')
  }
  if (typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'The userId must be a string.')
  }
  if (context.auth?.uid === userId) {
    throw new HttpsError('invalid-argument', 'Please do not ban yourself :(')
  }
  if (doNotBackup !== undefined && typeof doNotBackup !== 'boolean') {
    throw new HttpsError('invalid-argument', 'The doNotBackup parameter must be a boolean.')
  }
  
  const user = await fetchUserAuth(userId)
  
  if (user.customClaims?.moderator) {
    throw new HttpsError('invalid-argument', 'You cannot ban moderators directly. Please demote them first.')
  }
  if (user.disabled) {
    console.warn('The user is already banned: ' + userId)
    return
  }
    
  // Important: Find and stop games *before* removing the userId from them
  await stopOngoingGames(userId)
  
  if (!doNotBackup) await backupUserData(userId)
  await removeUserData(userId)
  await banUser(userId)
}


async function banUser(userId: string): Promise<void> {
  const { auth } = await useAdmin()
  try {
    await auth.updateUser(userId, {
      disabled: true,
    })
  } catch (untypedErr) {
    const e = untypedErr as Error
    console.error(e)
    throw new HttpsError('internal', 'An unexpected error occurred while banning the user: ' + e.message)
  }
  // The user's session token will expire in 1 hour, at which point they will be logged out.
  // Until then, they can still use the app normally (but are unable to update their profile).
}

async function backupUserData(userId: string): Promise<void> {
  const { db } = await useAdmin()
  const userDoc = await db.collection('users').doc(userId).get()
  const user = userDoc.data() as UserDoc | undefined
  if (!user) {
    throw new HttpsError('not-found', 'The user to be banned does not exist.')
  }
  const variants = await db.collection('variants').where('creatorId', '==', userId).select().get()
  const gamesAsWhite = await db.collection('games').where('IMMUTABLE.whiteId', '==', userId).select().get()
  const gamesAsBlack = await db.collection('games').where('IMMUTABLE.blackId', '==', userId).select().get()
  
  const bannedUserData: BannedUserDataDoc = {
    name: user.name,
    about: user.about,
    profileImg: user.profileImg,
    publishedVariants: variants.docs.map((doc) => doc.id).join(' '),
    gamesAsWhite: gamesAsWhite.docs.map((doc) => doc.id).join(' '),
    gamesAsBlack: gamesAsBlack.docs.map((doc) => doc.id).join(' '),
  }
  await db.collection('bannedUserData').doc(userId).set(bannedUserData)
}

async function removeUserData(userId: string): Promise<void> {
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
