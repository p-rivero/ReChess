import { onSnapshot } from '@firebase/firestore'
import { LobbyDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import type { Unsubscribe } from 'firebase/firestore'
import type { LobbySlotDoc, RequestedColor } from '@/firebase/db/schema'
import { useAuthStore } from './auth-user'

export type LobbySlot = {
  timeCreated: Date
  creatorDisplayName: string
  creatorId: string
  requestedColor: RequestedColor
  challengerDisplayName?: string
  challengerId?: string
}

export type LobbyUpdateCallback = (lobby: LobbySlot[]) => void

const EMPTY_UNSUBSCRIBE: Unsubscribe = () => { /* do nothing */ }

export const useLobbyStore = defineStore('lobby', () => {
  const authStore = useAuthStore()
  
  let unsubscribe = EMPTY_UNSUBSCRIBE
  
  // Get real time updates for the slots in a lobby
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
  
  // Unsubscribe from lobby updates
  function removeUpdateListener() {
    console.log('removeUpdateListener')
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
  
  
  // Create a new lobby slot
  async function createLobbySlot(variantId: string, requestedColor: RequestedColor) {
    const user = authStore.loggedUser
    if (!user) {
      throw new Error('User must be logged in to create a lobby slot')
    }
    await LobbyDB.createSlot(variantId, user.uid, user.displayName, requestedColor)
  }
  
  
  return { setUpdateListener, removeUpdateListener }
})
