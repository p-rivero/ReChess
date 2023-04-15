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
  gameDocId?: string
}
export type ChallengerInfo = {
  name: string
  image?: string
  gameCreated: boolean
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
  let lobbyDeletedCallback = EMPTY_FN
  let challengerJoinedCallback: (info: ChallengerInfo) => void = EMPTY_FN
  let challengerLeftCallback = EMPTY_FN
  let joinSlotCallback: (id: string, name: string) => void = EMPTY_FN
  let leaveSlotCallback = EMPTY_FN
  let gameCreatedCallback: (gameId: string, variantId: string, creatorId: string) => void = EMPTY_FN
  
  // Get real time updates for the slots in a lobby
  function setUpdateListener(variantId: string, callback: LobbyUpdateCallback) {
    if (currentId === variantId) return
    
    // If subscribed to a different lobby, unsubscribe first
    unsubscribe()
    
    const lobby = LobbyDB.getLobbySlots(variantId)
    
    unsubscribe = onSnapshot(lobby, snap => {
      const slots: LobbySlot[] = []
      // Update the list of slots
      snap.forEach(docSnap => {
        const docId = docSnap.id
        const doc = docSnap.data() as LobbySlotDoc
        slots.push(readDocument(docId, doc))
      })
      callback(slots)
      
      // If one of the slots is from the current user, show the waiting popup
      const mySlot = slots.find(s => s.creatorIsCurrentUser)
      if (mySlot) {
        lobbyCreatedCallback(mySlot.requestedColor)
        // If my slot has a challenger, show their info
        if (mySlot.challengerId) {
          challengerJoinedCallback({
            name: mySlot.challengerDisplayName ?? '[error]',
            image: mySlot.challengerImage,
            gameCreated: mySlot.gameDocId !== undefined,
          })
        } else {
          challengerLeftCallback()
        }
      } else {
        lobbyDeletedCallback()
      }
      
      // If the current user is joining a lobby, show the waiting popup
      // and redirect to the game when it's created
      const joinedSlot = slots.find(s => s.challengerIsCurrentUser)
      if (joinedSlot) {
        joinSlotCallback(joinedSlot.creatorId, joinedSlot.creatorDisplayName)
        if (joinedSlot.gameDocId) {
          gameCreatedCallback(joinedSlot.gameDocId, variantId, joinedSlot.creatorId)
        }
      } else {
        leaveSlotCallback()
      }
    })
    currentId = variantId
  }
  
  function onLobbyCreated(callback: (color:RequestedColor)=>void) {
    lobbyCreatedCallback = callback
  }
  function onLobbyDeleted(callback: ()=>void) {
    lobbyDeletedCallback = callback
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
    leaveSlotCallback = callback
  }
  function onGameCreated(callback: (gameId: string, variantId: string, creatorId: string)=>void) {
    gameCreatedCallback = callback
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
    leaveSlotCallback = EMPTY_FN
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
      gameDocId: doc.gameDocId ?? undefined,
    }
  }
  
  
  // Create a new lobby slot
  async function createSlot(variantId: string, requestedColor: RequestedColor) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to create a lobby slot')
    }
    const id = authStore.loggedUser.uid
    const name = authStore.loggedUser.displayName
    const img = authStore.loggedUser.profileImg ?? null
    await LobbyDB.createSlot(variantId, id, name, img, requestedColor)
  }
  
  // Delete a lobby slot
  async function removeSlot(variantId: string, creatorId: string) {
    await LobbyDB.deleteSlot(variantId, creatorId)
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
      throw new Error('User must be logged in to cancel a lobby slot')
    }
    await LobbyDB.removeSlot(variantId, authStore.loggedUser.uid)
  }
  
  // Accept the incoming challenger, return the ID of the new game
  async function acceptChallenger(variantId: string): Promise<string> {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to create a game')
    }
    return LobbyDB.createGame(variantId, authStore.loggedUser.uid)
  }
  
  // Reject the incoming challenger
  async function rejectChallenger(variantId: string) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to reject a challenger')
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
    onLobbyDeleted,
    onChallengerJoined,
    onChallengerLeft,
    onGameCreated,
    onJoinSlot,
    onLeaveSlot,
    removeListeners,
    
    createSlot,
    removeSlot,
    joinSlot,
    cancelSlot,
    acceptChallenger,
    rejectChallenger,
    cancelJoining,
  }
})
