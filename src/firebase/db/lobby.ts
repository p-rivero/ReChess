import { db } from '@/firebase'
import { collection, setDoc, serverTimestamp, doc, deleteDoc, query, orderBy } from '@firebase/firestore'
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

// Deletes a lobby slot in the database
export async function removeSlot(variantId: string, creatorId: string): Promise<void> {
  await deleteDoc(doc(db, 'variants', variantId, 'lobby', creatorId))
}
