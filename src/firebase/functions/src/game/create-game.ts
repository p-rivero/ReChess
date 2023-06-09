
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { FieldValue } from 'firebase-admin/firestore'
import { updateVariantPopularity } from '../variant/helpers/update-variant-metrics'
import { useAdmin } from '../helpers'
import assertAuth from '../assert-auth'
import type { GameDoc, LobbySlotDoc, VariantDoc } from 'db/schema'
import type { Timestamp } from 'firebase/firestore'

/**
 * Called directly by the client in order to create a new game.
 * Additionally, it updates the game popularity (+1 point).
 * @param {any} data The data passed to the function
 * @param {string} data.variantId UID of the variant that the user wishes to play
 * @param {string} data.lobbySlotCreatorId UID of the user that created the lobby slot.
 *  There MUST be a lobby slot for this user and variant.
 * @param {CallableContext} context The context of the function call
 * @return {Promise<{gameId: string}>} The UID of the newly created game
 * @throws An HTTP error is returned if some of the following errors occur:
 * - The user is not authenticated as the creator of the lobby slot (i.e. `lobbySlotCreatorId !== auth.uid`)
 * - There is no lobby slot for the given variant and creator
 * - The lobby slot has no challenger
 */
export default async function(data: unknown, context: CallableContext): Promise<{gameId: string}> {
  const auth = assertAuth(context)
  
  // Validate input
  const { variantId, lobbySlotCreatorId } = data as { variantId: unknown, lobbySlotCreatorId: unknown }
  if (!variantId || !lobbySlotCreatorId) {
    throw new HttpsError('invalid-argument', 'The function must be called with a variantId and lobbySlotCreatorId.')
  }
  if (typeof variantId !== 'string') {
    throw new HttpsError('invalid-argument', 'The variantId must be a string.')
  }
  if (typeof lobbySlotCreatorId !== 'string') {
    throw new HttpsError('invalid-argument', 'The lobbySlotCreatorId must be a string.')
  }
  if (auth.uid !== lobbySlotCreatorId) {
    throw new HttpsError('permission-denied', 'The function must be called by the user that created the lobby slot.')
  }
  
  const [slotDoc, variantDoc] = await Promise.all([
    fetchLobbySlot(variantId, lobbySlotCreatorId),
    fetchVariant(variantId),
  ])
  
  if (slotDoc.IMMUTABLE.gameDocId) {
    throw new HttpsError('failed-precondition', 'The lobby slot already has a game.')
  }
  
  const gameId = await createGame([variantId, variantDoc], [lobbySlotCreatorId, slotDoc])
  
  await Promise.all([
    updateVariantPopularity(variantId, 1),
    addGameIdToSlot(variantId, lobbySlotCreatorId, gameId),
  ])
  return { gameId }
}


async function fetchLobbySlot(variantId: string, lobbySlotCreatorId: string): Promise<LobbySlotDoc> {
  const { db } = await useAdmin()
  const slot = await db.collection('variants').doc(variantId).collection('lobby').doc(lobbySlotCreatorId).get()
  if (!slot.exists) {
    throw new HttpsError('failed-precondition', 'The lobby slot does not exist: ' + slot.ref.path)
  }
  return slot.data() as LobbySlotDoc
}

async function fetchVariant(variantId: string): Promise<VariantDoc> {
  const { db } = await useAdmin()
  const variant = await db.collection('variants').doc(variantId).get()
  if (!variant.exists) {
    throw new HttpsError('not-found', 'The variant does not exist.')
  }
  return variant.data() as VariantDoc
}


async function createGame(variant: [string, VariantDoc], slot: [string, LobbySlotDoc]): Promise<string> {
  const [variantId, variantDoc] = variant
  const [slotCreator, slotDoc] = slot
  if (!slotDoc.challengerId || !slotDoc.challengerDisplayName) {
    throw new HttpsError('failed-precondition', 'The lobby slot has no challenger.')
  }
  
  // Here it's safe to use Math.random instead of crypto because this is not a cryptographic
  // operation, we just want users to be assigned each side approximately half the time
  const creatorPlaysAsWhite =
    slotDoc.IMMUTABLE.requestedColor === 'white' ||
    (slotDoc.IMMUTABLE.requestedColor === 'random' && Math.random() < 0.5)
    
  const [whiteId, whiteDisplayName] = creatorPlaysAsWhite ?
    [slotCreator, slotDoc.IMMUTABLE.creatorDisplayName] :
    [slotDoc.challengerId, slotDoc.challengerDisplayName]
    
  const [blackId, blackDisplayName] = creatorPlaysAsWhite ?
    [slotDoc.challengerId, slotDoc.challengerDisplayName] :
    [slotCreator, slotDoc.IMMUTABLE.creatorDisplayName]
  
  const newGame: GameDoc = {
    moveHistory: '',
    playerToMove: getFirstPlayerToMove(variantDoc),
    winner: null,
    IMMUTABLE: {
      timeCreated: FieldValue.serverTimestamp() as Timestamp,
      variantId,
      variant: variantDoc,
      whiteId,
      whiteDisplayName,
      blackId,
      blackDisplayName,
      requestedColor: slotDoc.IMMUTABLE.requestedColor,
      players: [whiteId, blackId],
      calledFinishGame: false,
    },
  }
  const { db } = await useAdmin()
  const gameRef = await db.collection('games').add(newGame)
  return gameRef.id
}

function getFirstPlayerToMove(variant: VariantDoc): 'white' | 'black' {
  const variantInitialState = JSON.parse(variant.initialState) as {playerToMove: number}
  if (variantInitialState.playerToMove !== 0 && variantInitialState.playerToMove !== 1) {
    throw new HttpsError('internal', 'The variant has an invalid initial state.')
  }
  return variantInitialState.playerToMove === 0 ? 'white' : 'black'
}

async function addGameIdToSlot(variantId: string, lobbySlotCreatorId: string, gameId: string) {
  const { db } = await useAdmin()
  try {
    await db.collection('variants').doc(variantId).collection('lobby').doc(lobbySlotCreatorId).update({
      'IMMUTABLE.gameDocId': gameId,
    })
  } catch (e) {
    console.error('Cannot update lobby slot', variantId, lobbySlotCreatorId, e)
  }
}
