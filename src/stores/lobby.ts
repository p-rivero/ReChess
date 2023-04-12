import { onSnapshot } from '@firebase/firestore'
import { LobbyDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import type { Unsubscribe } from 'firebase/firestore'
import type { LobbySlotDoc } from '@/firebase/db/schema'

export type LobbySlot = {
  timeCreated: Date
  creatorDisplayName: string
  creatorId: string
  requestedColor: 'white' | 'black' | 'random'
  challengerDisplayName?: string
  challengerId?: string
}

export type LobbyUpdateCallback = (lobby: LobbySlot[]) => void

const EMPTY_UNSUBSCRIBE: Unsubscribe = () => { /* do nothing */ }

export const useUserStore = defineStore('lobby', () => {
  let unsubscribe = EMPTY_UNSUBSCRIBE
  
  function setUpdateListener(variantId: string, callback: LobbyUpdateCallback) {
    console.log('setUpdateListener', variantId)
    // If subscribed to a different lobby, unsubscribe first
    unsubscribe()
    
    const lobby = LobbyDB.getLobbySlots(variantId)
    
    unsubscribe = onSnapshot(lobby, snap => {
      const slots: LobbySlot[] = []
      snap.forEach(docSnap => {
        const docId = docSnap.id
        const doc = docSnap.data() as LobbySlotDoc
        slots.push(readDocument(docId, doc))
      })
      callback(slots)
    })
  }
  
  function removeUpdateListener() {
    unsubscribe()
    unsubscribe = EMPTY_UNSUBSCRIBE
  }
  
  function readDocument(docId: string, doc: LobbySlotDoc): LobbySlot {
    return {
      timeCreated: doc.IMMUTABLE.timeCreated.toDate(),
      creatorDisplayName: doc.IMMUTABLE.creatorDisplayName,
      creatorId: docId,
      requestedColor: doc.IMMUTABLE.requestedColor,
      challengerDisplayName: doc.challengerDisplayName ?? undefined,
      challengerId: doc.challengerId ?? undefined,
    }
  }
  
  return { setUpdateListener, removeUpdateListener }
})
