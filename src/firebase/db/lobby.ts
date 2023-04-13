import { db } from '@/firebase'
import { collection, setDoc, serverTimestamp, doc, deleteDoc, query, orderBy, updateDoc } from '@firebase/firestore'
import type { LobbySlotDoc, RequestedColor } from './schema'

export function getLobbySlots(variantId: string) {
  return query(collection(db, 'variants', variantId, 'lobby'), orderBy('IMMUTABLE.timeCreated'))
}

// Creates a new lobby slot in the database
export async function createSlot(variantId: string, creatorId: string, creatorName: string, color: RequestedColor): Promise<LobbySlotDoc> {
  const newDoc: LobbySlotDoc = {
    IMMUTABLE: {
      timeCreated: serverTimestamp(),
      creatorDisplayName: creatorName,
      requestedColor: color,
    },
    challengerDisplayName: null,
    challengerId: null,
    gameDocId: null,
  }
  await setDoc(doc(db, 'variants', variantId, 'lobby', creatorId), newDoc)
  return newDoc
}

// Joins an existing slot in the database, or removes the challenger
export async function updateChallenger(variantId: string, creatorId: string, challengerId: string|null, challengerName: string|null) {
  const update = {
    challengerDisplayName: challengerName,
    challengerId: challengerId,
  }
  await updateDoc(doc(db, 'variants', variantId, 'lobby', creatorId), update)
  console.log('Updated lobby slot', variantId, creatorId, update)
}

// Deletes a lobby slot in the database
export async function removeSlot(variantId: string, creatorId: string) {
  await deleteDoc(doc(db, 'variants', variantId, 'lobby', creatorId))
}
