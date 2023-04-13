import { Timestamp, onSnapshot } from '@firebase/firestore'
import { LobbyDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import type { LobbySlotDoc, RequestedColor } from '@/firebase/db/schema'
import { useAuthStore } from './auth-user'

export type LobbySlot = {
  isFromCurrentUser: boolean
  timeCreated: Date
  creatorId: string
  creatorDisplayName: string
  creatorImage?: string
  requestedColor: RequestedColor
  challengerId?: string
  challengerDisplayName?: string
  challengerImage?: string
}
export type ChallengerInfo = {
  id: string
  name: string
  image?: string
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
  let challengerJoined: (info: ChallengerInfo) => void = EMPTY_FN
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
        if (s.challengerId) {
          challengerJoined({
            id: s.challengerId,
            name: s.challengerDisplayName ?? '[error]',
            image: s.challengerImage,
          })
        }
        found = true
      })
      if (!found) lobbyDeleted()
    })
    currentId = variantId
  }
  
  function onLobbyCreated(callback: (color:RequestedColor)=>void) {
    lobbyCreated = callback
  }
  function onChallengerJoined(callback: (info: ChallengerInfo)=>void) {
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
      creatorId: docId,
      creatorDisplayName: doc.IMMUTABLE.creatorDisplayName,
      creatorImage: doc.IMMUTABLE.creatorImageUrl ?? undefined,
      requestedColor: doc.IMMUTABLE.requestedColor,
      challengerId: doc.challengerId ?? undefined,
      challengerDisplayName: doc.challengerDisplayName ?? undefined,
      challengerImage: doc.challengerImageUrl ?? undefined,
    }
  }
  
  
  // Create a new lobby slot
  async function createSlot(variantId: string, requestedColor: RequestedColor) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    const id = authStore.loggedUser.uid
    const name = authStore.loggedUser.displayName
    const img = authStore.loggedUser.profileImg ?? null
    await LobbyDB.createSlot(variantId, id, name, img, requestedColor)
  }
  
  // Join an existing lobby slot
  async function joinSlot(variantId: string, creatorId: string) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    const id = authStore.loggedUser.uid
    const name = authStore.loggedUser.displayName
    const img = authStore.loggedUser.profileImg ?? null
    await LobbyDB.updateChallenger(variantId, creatorId, id, name, img)
  }
  
  // Delete a lobby slot
  async function cancelSlot(variantId: string) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    await LobbyDB.removeSlot(variantId, authStore.loggedUser.uid)
  }
  
  // Accept the incoming challenger
  async function acceptChallenger(_variantId: string) {
    // TODO
  }
  
  // Reject the incoming challenger
  async function rejectChallenger(variantId: string) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    await LobbyDB.updateChallenger(variantId, authStore.loggedUser.uid, null, null, null)
  }
  
  return { setUpdateListener, onLobbyCreated, onChallengerJoined, onLobbyDeleted, removeListeners,
    createSlot, joinSlot, cancelSlot, acceptChallenger, rejectChallenger }
})
