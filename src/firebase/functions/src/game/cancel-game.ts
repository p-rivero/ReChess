
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { FieldValue } from 'firebase-admin/firestore'
import { fetchGameDoc } from './helpers/fetch-game'
import { updateVariantPopularity } from '../variant/helpers/update-variant-metrics'
import { useAdmin } from '../helpers'
import assertAuth from '../assert-auth'
import type { CancelledGameDoc, GameDoc } from 'db/schema'
import type { Timestamp } from 'firebase/firestore'

/**
 * Called directly by the client when it detects that the opponent has made an
 * illegal move. This function will cancel the game immediately.
 * The cancelled game will be moved to the `cancelledGames` collection for
 * the moderators to review.
 * Additionally, it updates the game popularity (-1 point).
 * @param {any} data The data passed to the function
 * @param {string} data.gameId The game to cancel
 * @param {string} data.reason The user-provided reason why the game was cancelled
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function completes
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  const auth = assertAuth(context)
  
  // Validate input
  const { gameId, reason } = data as { gameId: unknown, reason: unknown }
  if (!gameId || !reason) {
    throw new HttpsError('invalid-argument', 'The function must be called with a gameId and reason.')
  }
  if (typeof gameId !== 'string') {
    throw new HttpsError('invalid-argument', 'The gameId must be a string.')
  }
  if (typeof reason !== 'string') {
    throw new HttpsError('invalid-argument', 'The reason must be a string.')
  }
  if (reason.length > 500) {
    throw new HttpsError('invalid-argument', 'The reason must be at most 500 characters.')
  }
  
  const gameDoc = await fetchGameDoc(gameId)
  if (!gameDoc) {
    throw new HttpsError('not-found', 'The game does not exist.')
  }
  
  if (!userIsPlayerInGame(auth.uid, gameDoc)) {
    throw new HttpsError('permission-denied', 'The function must be called by either the white or black player.')
  }
  
  await Promise.all([
    backupCancelledGame([gameId, gameDoc], auth.uid, reason),
    deleteGame(gameId),
    updateVariantPopularity(gameDoc.IMMUTABLE.variantId, -1),
  ])
}

function userIsPlayerInGame(userId: string, gameDoc: GameDoc): boolean {
  return userId === gameDoc.IMMUTABLE.whiteId || userId === gameDoc.IMMUTABLE.blackId
}

async function backupCancelledGame(game: [string, GameDoc], userId: string, reason: string) {
  const { db } = await useAdmin()
  const [gameId, gameDoc] = game
  
  const cancelledGameDoc: CancelledGameDoc = {
    ...gameDoc,
    cancelledByUserId: userId,
    cancelReason: reason,
    cancelTime: FieldValue.serverTimestamp() as Timestamp,
  }
  try {
    await db.collection('cancelledGames').doc(gameId).set(cancelledGameDoc)
  } catch (e) {
    console.error('Cannot add cancelled game', gameId, e, cancelledGameDoc)
  }
}

async function deleteGame(gameId: string) {
  const { db } = await useAdmin()
  try {
    await db.collection('games').doc(gameId).delete()
  } catch (e) {
    console.error('Cannot delete game', gameId, e)
  }
}
