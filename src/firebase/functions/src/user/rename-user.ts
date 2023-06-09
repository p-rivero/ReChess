
import { type QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore'
import type { Change } from 'firebase-functions'

import { batchedUpdate, useAdmin } from '../helpers'
import type { UserRenameTriggerDoc } from 'db/schema'


/**
 * Called when the user changes their name in the user document.
 * Updates the name also in the denormalized fields.
 * @param {Change<QueryDocumentSnapshot>} change Snapshots of the `renameTrigger` document before and after the change
 * @param {string} userId The UID of the user that changed
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(change: Change<QueryDocumentSnapshot>, userId: string): Promise<void> {
  // Timeout to prevent spamming: 5 minutes
  // Function is only triggered if current timestamp > renameAllowedAt
  const TIMEOUT_SECONDS = 5 * 60
  
  const doc = change.after.data() as UserRenameTriggerDoc
  const newName = doc.name || `@${doc.username}`
  
  await Promise.all([
    updateName(userId, newName),
    updateTimeout(userId, TIMEOUT_SECONDS),
  ])
}

async function updateTimeout(userId: string, timeoutSeconds: number) {
  const { db } = await useAdmin()
  const timeoutMs = Date.now() + 1000 * timeoutSeconds
  const timeoutDate = new Date(timeoutMs)
  const timeoutTimestamp = Timestamp.fromDate(timeoutDate)
  try {
    await db.collection('users').doc(userId).update({
      'IMMUTABLE.renameAllowedAt': timeoutTimestamp,
    })
  } catch (err) {
    console.error('Error while updating rename timeout for user', userId + ':')
    console.error(err)
  }
}


/**
 * Update the name of a user in all the denormalized fields across the database
 * (except for the user document itself)
 * @param {string} userId The UID of the user to update
 * @param {string|null} newName The new name of the user.
 * If null, the user ID will be removed from the denormalized fields to indicate that the user no longer exists
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function updateName(userId: string, newName: string | null): Promise<void> {
  const removeId = newName === null
  newName = newName ?? '[deleted]'
  
  await Promise.all([
    updateNameOfVariantCreator(userId, newName, removeId),
    updateNameOfWhitePlayer(userId, newName, removeId),
    updateNameOfBlackPlayer(userId, newName, removeId),
  ])
  
  // Do not update the name in the lobby entries, because they are short-lived and
  // it's not a problem to have the old name there for a while
  
  // TODO: User caches
}

async function updateNameOfVariantCreator(creatorId: string, newName: string, removeId: boolean) {
  const { db } = await useAdmin()
  const updatedVariants = await db.collection('variants').where('creatorId', '==', creatorId).get()
  try {
    await batchedUpdate(updatedVariants, (batch, ref) => {
      batch.update(ref, {
        'creatorDisplayName': newName,
        'creatorId': removeId ? null : creatorId,
      })
    })
  } catch (err) {
    console.error(`Error while updating variants for user ${creatorId}:`)
    console.error(err)
  }
}

async function updateNameOfWhitePlayer(playerId: string, newName: string, removeId: boolean) {
  const { db } = await useAdmin()
  const updatedGamesWhite = await db.collection('games').where('IMMUTABLE.whiteId', '==', playerId).get()
  try {
    await batchedUpdate(updatedGamesWhite, (batch, ref) => {
      batch.update(ref, {
        'IMMUTABLE.whiteDisplayName': newName,
        'IMMUTABLE.whiteId': removeId ? null : playerId,
      })
    })
  } catch (err) {
    console.error(`Error while updating games (white) for user ${playerId}:`)
    console.error(err)
  }
}

async function updateNameOfBlackPlayer(playerId: string, newName: string, removeId: boolean) {
  const { db } = await useAdmin()
  const updatedGamesBlack = await db.collection('games').where('IMMUTABLE.blackId', '==', playerId).get()
  try {
    await batchedUpdate(updatedGamesBlack, (batch, ref) => {
      batch.update(ref, {
        'IMMUTABLE.blackDisplayName': newName,
        'IMMUTABLE.blackId': removeId ? null : playerId,
      })
    })
  } catch (err) {
    console.error(`Error while updating games (black) for user ${playerId}:`)
    console.error(err)
  }
}
