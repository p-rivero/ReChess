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
  let challengerJoined: (id: string, name: string) => void = EMPTY_FN
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
      let found = false
      slots.filter(s => s.isFromCurrentUser).forEach(s => {
        lobbyCreated(s.requestedColor)
        if (s.challengerId) challengerJoined(s.challengerId, s.challengerDisplayName ?? '[error]')
        found = true
      })
      if (!found) lobbyDeleted()
    })
    currentId = variantId
  }
  
  function onLobbyCreated(callback: (color:RequestedColor)=>void) {
    lobbyCreated = callback
  }
  function onChallengerJoined(callback: (id: string, name: string)=>void) {
    challengerJoined = callback
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
    challengerJoined = EMPTY_FN
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
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    await LobbyDB.createSlot(variantId, authStore.loggedUser.uid, authStore.loggedUser.displayName, requestedColor)
  }
  
  // Join an existing lobby slot
  async function joinSlot(variantId: string, creatorId: string) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    await LobbyDB.updateChallenger(variantId, creatorId, authStore.loggedUser.uid, authStore.loggedUser.displayName)
  }
  
  // Delete a lobby slot
  async function cancelSlot(variantId: string) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    await LobbyDB.removeSlot(variantId, authStore.loggedUser.uid)
  }
  
  // Accept the incoming challenger
  async function acceptChallenger(variantId: string) {
    // TODO
  }
  
  // Reject the incoming challenger
  async function rejectChallenger(variantId: string) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    await LobbyDB.updateChallenger(variantId, authStore.loggedUser.uid, null, null)
  }
  
  return { setUpdateListener, onLobbyCreated, onChallengerJoined, onLobbyDeleted, removeListeners,
    createSlot, joinSlot, cancelSlot, acceptChallenger, rejectChallenger }
})
