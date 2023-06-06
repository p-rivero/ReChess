import { LobbyDB } from '@/firebase/db'
import { Timestamp, onSnapshot } from '@firebase/firestore'
import { createGame } from '@/firebase'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth-user'
import type { GameDoc, LobbySlotDoc, RequestedColor } from '@/firebase/db/schema'

export type LobbySlot = {
  currentUserIsCreator: boolean
  currentUserIsChallenger: boolean
  
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

export type OngoingGameSlot = {
  currentUserIsPlayer: boolean
  
  gameId: string
  playerToMove: 'white' | 'black' | 'game-over'
  timeCreated: Date
  whiteId: string
  whiteDisplayName: string
  blackId: string
  blackDisplayName: string
}

export type ChallengerInfo = {
  name: string
  image?: string
  gameCreated: boolean
}

const EMPTY_FN = () => { /* do nothing */ }

export const useLobbyStore = defineStore('lobby', () => {
  const authStore = useAuthStore()
  let currentVariantId: string | null = null
  let showKickedPopup = false
  
  // Callbacks
  let unsubscribe = EMPTY_FN
  let lobbyLoadedCallback: (lobby: LobbySlot[]) => void = EMPTY_FN
  let ongoingLoadedCallback: (lobby: OngoingGameSlot[]) => void = EMPTY_FN
  let lobbyCreatedCallback: (a: RequestedColor) => void = EMPTY_FN
  let lobbyDeletedCallback = EMPTY_FN
  let challengerJoinedCallback: (info: ChallengerInfo) => void = EMPTY_FN
  let challengerLeftCallback = EMPTY_FN
  let joinSlotCallback: (id: string, name: string) => void = EMPTY_FN
  let kickedFromSlotCallback = EMPTY_FN
  let gameCreatedCallback: (gameId: string, creatorId: string) => void = EMPTY_FN
  
  // Get real time updates for the slots in a lobby
  // Call this function after setting the callbacks
  function listenForUpdates(variantId: string) {
    if (currentVariantId === variantId) return
    
    // If subscribed to a different lobby, unsubscribe first
    unsubscribe()
    
    const unsubscribeLobby = onSnapshot(LobbyDB.getLobbySlots(variantId), snap => {
      const slots: LobbySlot[] = []
      // Update the list of slots
      snap.forEach(docSnap => {
        const creatorId = docSnap.id
        // Skip slots created by reported users
        if (authStore.loggedUser && authStore.loggedUser.reportedUsers.includes(creatorId)) {
          return
        }
        const doc = docSnap.data() as LobbySlotDoc
        slots.push(readLobbyDocument(creatorId, doc))
      })
      lobbyLoadedCallback(slots)
      
      // If one of the slots is from the current user, show the waiting popup
      const mySlot = slots.find(s => s.currentUserIsCreator)
      if (mySlot) {
        lobbyCreatedCallback(mySlot.requestedColor)
        // If my slot has a challenger, show their info
        if (mySlot.challengerId) {
          // If challenger is reported, kick them automatically
          if (authStore.loggedUser && authStore.loggedUser.reportedUsers.includes(mySlot.challengerId)) {
            rejectChallenger()
            return
          }
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
      const joinedSlot = slots.find(s => s.currentUserIsChallenger)
      if (joinedSlot) {
        joinSlotCallback(joinedSlot.creatorId, joinedSlot.creatorDisplayName)
        showKickedPopup = true
        if (joinedSlot.gameDocId) {
          gameCreatedCallback(joinedSlot.gameDocId, joinedSlot.creatorId)
          // Don't show popup if the creator accepts the challenge
          showKickedPopup = false
        }
      } else if (showKickedPopup) {
        kickedFromSlotCallback()
        showKickedPopup = false
      }
    })
    const unsubscribeOngoing = onSnapshot(LobbyDB.getOngoingGames(variantId), snap => {
      let slots: OngoingGameSlot[] = []
      snap.forEach(docSnap => {
        const docId = docSnap.id
        const doc = docSnap.data() as GameDoc
        slots.push(readOngoingGameDocument(docId, doc))
      })
      // Move my games to the top
      const myId = authStore.loggedUser?.uid
      const myGames = slots.filter(s => s.whiteId === myId || s.blackId === myId)
      const otherGames = slots.filter(s => s.whiteId !== myId && s.blackId !== myId)
      slots = myGames.concat(otherGames)
      ongoingLoadedCallback(slots)
    })
    
    unsubscribe = () => {
      unsubscribeLobby()
      unsubscribeOngoing()
    }
    currentVariantId = variantId
  }
  
  function onLobbyLoaded(callback: (lobby: LobbySlot[]) => void) {
    lobbyLoadedCallback = callback
  }
  function onOngoingLoaded(callback: (lobby: OngoingGameSlot[]) => void) {
    ongoingLoadedCallback = callback
  }
  function onLobbyCreated(callback: (color: RequestedColor)=>void) {
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
  function onKickedFromSlot(callback: ()=>void) {
    kickedFromSlotCallback = callback
  }
  function onGameCreated(callback: (gameId: string, creatorId: string)=>void) {
    gameCreatedCallback = callback
  }
  
  // Unsubscribe from lobby updates
  function removeListeners() {
    unsubscribe()
    currentVariantId = null
    unsubscribe = EMPTY_FN
    lobbyLoadedCallback = EMPTY_FN
    ongoingLoadedCallback = EMPTY_FN
    lobbyCreatedCallback = EMPTY_FN
    challengerJoinedCallback = EMPTY_FN
    challengerLeftCallback = EMPTY_FN
    joinSlotCallback = EMPTY_FN
    kickedFromSlotCallback = EMPTY_FN
    lobbyDeletedCallback = EMPTY_FN
  }
  
  function readLobbyDocument(docId: string, doc: LobbySlotDoc): LobbySlot {
    const timeCreated = doc.IMMUTABLE.timeCreated instanceof Timestamp ?
      doc.IMMUTABLE.timeCreated.toDate() :
      new Date()
    const hasChallenger = !!doc.challengerId
    return {
      currentUserIsCreator: docId === authStore.loggedUser?.uid,
      currentUserIsChallenger: hasChallenger && (doc.challengerId === authStore.loggedUser?.uid),
      timeCreated: timeCreated,
      creatorId: docId,
      creatorDisplayName: doc.IMMUTABLE.creatorDisplayName,
      creatorImage: doc.IMMUTABLE.creatorImageUrl ?? undefined,
      requestedColor: doc.IMMUTABLE.requestedColor,
      challengerId: doc.challengerId ?? undefined,
      challengerDisplayName: doc.challengerDisplayName ?? undefined,
      challengerImage: doc.challengerImageUrl ?? undefined,
      gameDocId: doc.IMMUTABLE.gameDocId ?? undefined,
    }
  }
  
  function readOngoingGameDocument(docId: string, doc: GameDoc): OngoingGameSlot {
    const myId = authStore.loggedUser?.uid
    const isPlayer = doc.IMMUTABLE.whiteId === myId || doc.IMMUTABLE.blackId === myId
    return {
      currentUserIsPlayer: isPlayer,
      gameId: docId,
      playerToMove: doc.playerToMove,
      timeCreated: doc.IMMUTABLE.timeCreated.toDate(),
      whiteId: doc.IMMUTABLE.whiteId,
      whiteDisplayName: doc.IMMUTABLE.whiteDisplayName,
      blackId: doc.IMMUTABLE.blackId,
      blackDisplayName: doc.IMMUTABLE.blackDisplayName,
    }
  }
  
  
  // Create a new lobby slot
  async function createSlot(requestedColor: RequestedColor) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to create a lobby slot')
    }
    if (!currentVariantId) {
      throw new Error('Must call setUpdateListener before createSlot')
    }
    const id = authStore.loggedUser.uid
    const name = authStore.loggedUser.displayName
    const img = authStore.loggedUser.profileImg ?? null
    await LobbyDB.createSlot(currentVariantId, id, name, img, requestedColor)
  }
  
  // Delete a lobby slot
  async function removeSlot(creatorId: string) {
    if (!currentVariantId) {
      throw new Error('Must call setUpdateListener before removeSlot')
    }
    await LobbyDB.deleteSlot(currentVariantId, creatorId)
  }
  
  // Join an existing lobby slot
  async function joinSlot(creatorId: string) {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to join a lobby slot')
    }
    if (!currentVariantId) {
      throw new Error('Must call setUpdateListener before joinSlot')
    }
    const id = authStore.loggedUser.uid
    const name = authStore.loggedUser.displayName
    const img = authStore.loggedUser.profileImg ?? null
    await LobbyDB.updateChallenger(currentVariantId, creatorId, id, name, img)
  }
  
  // Delete a lobby slot
  async function cancelSlot() {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to cancel a lobby slot')
    }
    if (!currentVariantId) {
      throw new Error('Must call setUpdateListener before cancelSlot')
    }
    await LobbyDB.removeSlot(currentVariantId, authStore.loggedUser.uid)
  }
  
  // Accept the incoming challenger, return the ID of the new game
  async function acceptChallenger(): Promise<string> {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to create a game')
    }
    if (!currentVariantId) {
      throw new Error('Must call setUpdateListener before acceptChallenger')
    }
    // The cloud function already updates the lobby slot with the game id. Returns the game id.
    const result = await createGame({
      variantId: currentVariantId,
      lobbySlotCreatorId: authStore.loggedUser.uid,
    })
    return result.data.gameId
  }
  
  // Reject the incoming challenger
  async function rejectChallenger() {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to reject a challenger')
    }
    if (!currentVariantId) {
      throw new Error('Must call setUpdateListener before rejectChallenger')
    }
    await LobbyDB.updateChallenger(currentVariantId, authStore.loggedUser.uid, null, null, null)
  }
  
  // Leave a lobby (as challenger)
  async function cancelJoining(creatorId: string) {
    if (!currentVariantId) {
      throw new Error('Must call setUpdateListener before cancelJoining')
    }
    // Don't show popup when leaving voluntarily
    showKickedPopup = false
    await LobbyDB.updateChallenger(currentVariantId, creatorId, null, null, null)
  }
  
  return {
    listenForUpdates,
    removeListeners,
    onLobbyLoaded,
    onOngoingLoaded,
    onLobbyCreated,
    onLobbyDeleted,
    onChallengerJoined,
    onChallengerLeft,
    onGameCreated,
    onJoinSlot,
    onKickedFromSlot,
    
    createSlot,
    removeSlot,
    joinSlot,
    cancelSlot,
    acceptChallenger,
    rejectChallenger,
    cancelJoining,
  }
})
