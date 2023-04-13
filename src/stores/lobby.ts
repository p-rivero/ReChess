import { Timestamp, onSnapshot } from '@firebase/firestore'
import { LobbyDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import type { LobbySlotDoc, RequestedColor } from '@/firebase/db/schema'
import { useAuthStore } from './auth-user'

export type LobbySlot = {
  creatorIsCurrentUser: boolean
  challengerIsCurrentUser: boolean
  
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
  let lobbyCreatedCallback: (a: RequestedColor) => void = EMPTY_FN
  let challengerJoinedCallback: (info: ChallengerInfo) => void = EMPTY_FN
  let challengerLeftCallback = EMPTY_FN
  let joinSlotCallback: (id: string, name: string) => void = EMPTY_FN
  let leaveslotCallback = EMPTY_FN
  let lobbyDeletedCallback = EMPTY_FN
  
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
      slots.filter(s => s.creatorIsCurrentUser).forEach(s => {
        lobbyCreatedCallback(s.requestedColor)
        if (s.challengerId) {
          challengerJoinedCallback({
            id: s.challengerId,
            name: s.challengerDisplayName ?? '[error]',
            image: s.challengerImage,
          })
        } else {
          challengerLeftCallback()
        }
        found = true
      })
      if (!found) lobbyDeletedCallback()
      
      // If the current user is joining a lobby, show the waiting popup
      found = false
      slots.filter(s => s.challengerIsCurrentUser).forEach(s => {
        joinSlotCallback(s.creatorId, s.creatorDisplayName)
        found = true
      })
      if (!found) leaveslotCallback()
    })
    currentId = variantId
  }
  
  function onLobbyCreated(callback: (color:RequestedColor)=>void) {
    lobbyCreatedCallback = callback
  }
  function onChallengerJoined(callback: (info: ChallengerInfo)=>void) {
    challengerJoinedCallback = callback
  }
  function onChallengerLeft(callback: ()=>void) {
    challengerLeftCallback = callback
  }
  function onJoinSlot(callback: (id: string, name: string)=>void) {
    joinSlotCallback = callback
  }
  function onLeaveSlot(callback: ()=>void) {
    leaveslotCallback = callback
  }
  function onLobbyDeleted(callback: ()=>void) {
    lobbyDeletedCallback = callback
  }
  
  // Unsubscribe from lobby updates
  function removeListeners() {
    unsubscribe()
    currentId = null
    unsubscribe = EMPTY_FN
    lobbyCreatedCallback = EMPTY_FN
    challengerJoinedCallback = EMPTY_FN
    challengerLeftCallback = EMPTY_FN
    joinSlotCallback = EMPTY_FN
    leaveslotCallback = EMPTY_FN
    lobbyDeletedCallback = EMPTY_FN
  }
  
  function readDocument(docId: string, doc: LobbySlotDoc): LobbySlot {
    const timeCreated = doc.IMMUTABLE.timeCreated instanceof Timestamp ?
      doc.IMMUTABLE.timeCreated.toDate() :
      new Date()
    const hasChallenger = !!doc.challengerId
    return {
      creatorIsCurrentUser: docId === authStore.loggedUser?.uid,
      challengerIsCurrentUser: hasChallenger && (doc.challengerId === authStore.loggedUser?.uid),
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
  
  // Leave a lobby (as challenger)
  async function cancelJoining(variantId: string, creatorId: string) {
    await LobbyDB.updateChallenger(variantId, creatorId, null, null, null)
  }
  
  return {
    setUpdateListener,
    onLobbyCreated,
    onChallengerJoined,
    onChallengerLeft,
    onLobbyDeleted,
    onJoinSlot,
    onLeaveSlot,
    removeListeners,
    
    createSlot,
    joinSlot,
    cancelSlot,
    acceptChallenger,
    rejectChallenger,
    cancelJoining,
  }
})
