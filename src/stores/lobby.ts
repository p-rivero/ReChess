import { Timestamp, onSnapshot } from '@firebase/firestore'
import { LobbyDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import type { LobbySlotDoc, RequestedColor } from '@/firebase/db/schema'
import { useAuthStore } from './auth-user'

export type LobbySlot = {
  isFromCurrentUser: boolean
  timeCreated: Date
  creatorDisplayName: string
  creatorId: string
  requestedColor: RequestedColor
  challengerDisplayName?: string
  challengerId?: string
}

export type LobbyUpdateCallback = (lobby: LobbySlot[]) => void

const EMPTY_FN = () => { /* do nothing */ }

export const useLobbyStore = defineStore('lobby', () => {
  const authStore = useAuthStore()
  // Avoid subscribing to the same lobby twice
  let currentId: string | null = null
  
  // Callbacks
  let unsubscribe = EMPTY_FN
  let lobbyCreated: (a: RequestedColor) => void = EMPTY_FN
  let lobbyDeleted = EMPTY_FN
  
  // Get real time updates for the slots in a lobby
  function setUpdateListener(variantId: string, callback: LobbyUpdateCallback) {
    if (currentId === variantId) return
    
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
      // If one of the slots is from the current user, show the waiting popup
      let selectedColor: RequestedColor | undefined
      slots.filter(s => s.isFromCurrentUser).forEach(s => selectedColor = s.requestedColor)
      if (selectedColor) lobbyCreated(selectedColor)
      else lobbyDeleted()
    })
    currentId = variantId
  }
  
  function onLobbyCreated(callback: (color:RequestedColor)=>void) {
    lobbyCreated = callback
  }
  function onLobbyDeleted(callback: ()=>void) {
    lobbyDeleted = callback
  }
  
  // Unsubscribe from lobby updates
  function removeListeners() {
    unsubscribe()
    currentId = null
    unsubscribe = EMPTY_FN
    lobbyCreated = EMPTY_FN
    lobbyDeleted = EMPTY_FN
  }
  
  function readDocument(docId: string, doc: LobbySlotDoc): LobbySlot {
    const timeCreated = doc.IMMUTABLE.timeCreated instanceof Timestamp ?
      doc.IMMUTABLE.timeCreated.toDate() :
      new Date()
    return {
      isFromCurrentUser: docId === authStore.loggedUser?.uid,
      timeCreated: timeCreated,
      creatorDisplayName: doc.IMMUTABLE.creatorDisplayName,
      creatorId: docId,
      requestedColor: doc.IMMUTABLE.requestedColor,
      challengerDisplayName: doc.challengerDisplayName ?? undefined,
      challengerId: doc.challengerId ?? undefined,
    }
  }
  
  
  // Create a new lobby slot
  async function createSlot(variantId: string, requestedColor: RequestedColor) {
    const user = authStore.loggedUser
    if (!user) {
      throw new Error('User must be logged in to create a lobby slot')
    }
    await LobbyDB.createSlot(variantId, user.uid, user.displayName, requestedColor)
  }
  
  // Delete a lobby slot
  async function cancelSlot(variantId: string) {
    const user = authStore.loggedUser
    if (!user) {
      throw new Error('User must be logged in to cancel a lobby slot')
    }
    await LobbyDB.removeSlot(variantId, user.uid)
  }
  
  
  return { setUpdateListener, onLobbyCreated, onLobbyDeleted, removeListeners, createSlot, cancelSlot }
})
