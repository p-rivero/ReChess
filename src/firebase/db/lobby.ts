import { db } from '@/firebase'
import { collection, setDoc, serverTimestamp, doc, type Timestamp } from '@firebase/firestore'
import type { LobbySlotDoc, RequestedColor } from './schema'

export function getLobbySlots(variantId: string) {
  return collection(db, 'variants', variantId, 'lobby')
}

// Creates a new lobby slot in the database
export async function createSlot(variantId: string, creatorId: string, creatorName: string, color: RequestedColor): Promise<LobbySlotDoc> {
  const newDoc: LobbySlotDoc = {
    IMMUTABLE: {
      timeCreated: serverTimestamp() as Timestamp,
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
