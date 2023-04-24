import { collection, deleteDoc, doc, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from '@firebase/firestore'
import { db, createGame as dbCreateGame } from '@/firebase'
import type { LobbySlotDoc, RequestedColor } from './schema'

export function getLobbySlots(variantId: string) {
  return query(
    collection(db, 'variants', variantId, 'lobby'),
    orderBy('IMMUTABLE.timeCreated')
  )
}

export function getOngoingGames(variantId: string) {
  return query(
    collection(db, 'games'),
    where('IMMUTABLE.variantId', '==', variantId),
    where('winner', '==', null),
    orderBy('IMMUTABLE.timeCreated')
  )
}

// Creates a new lobby slot in the database
export async function createSlot(
  variantId: string,
  creatorId: string,
  creatorName: string,
  creatorImage: string | null,
  color: RequestedColor
): Promise<LobbySlotDoc> {
  const newDoc: LobbySlotDoc = {
    IMMUTABLE: {
      timeCreated: serverTimestamp(),
      creatorDisplayName: creatorName,
      creatorImageUrl: creatorImage,
      requestedColor: color,
    },
    challengerId: null,
    challengerDisplayName: null,
    challengerImageUrl: null,
    gameDocId: null,
  }
  await setDoc(doc(db, 'variants', variantId, 'lobby', creatorId), newDoc)
  return newDoc
}

// Deletes a lobby slot in the database
export async function deleteSlot(variantId: string,creatorId: string): Promise<void> {
  await deleteDoc(doc(db, 'variants', variantId, 'lobby', creatorId))
}

// Joins an existing slot in the database, or removes the challenger
export async function updateChallenger(
  variantId: string,
  creatorId: string,
  challengerId: string | null,
  challengerName: string | null,
  challengerImage: string | null
) {
  const update = {
    challengerId: challengerId,
    challengerDisplayName: challengerName,
    challengerImageUrl: challengerImage,
  }
  await updateDoc(doc(db, 'variants', variantId, 'lobby', creatorId), update)
}

// Deletes a lobby slot in the database
export async function removeSlot(variantId: string, creatorId: string) {
  await deleteDoc(doc(db, 'variants', variantId, 'lobby', creatorId))
}


// Creates a new game in the database by calling the createGame cloud function
// and then updates the lobby slot with the game id. Returns the game id.
export async function createGame(variantId: string, creatorId: string): Promise<string> {
  const result = await dbCreateGame({ variantId, creatorId })
  const gameDocId = result.data.gameId
  await updateDoc(doc(db, 'variants', variantId, 'lobby', creatorId), { gameDocId })
  return gameDocId
}

