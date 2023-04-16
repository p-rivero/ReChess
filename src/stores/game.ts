import { onSnapshot } from '@firebase/firestore'
import { GameDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import type { GameDoc } from '@/firebase/db/schema'
import type { Variant } from '@/protochess/types'
import { readVariantDoc } from './variant'
import { useAuthStore } from './auth-user'

export type Game = {
  variant: Variant
  whiteName: string
  blackName: string
  
  loggedUserIsWhite: boolean
  loggedUserIsBlack: boolean
}

const EMPTY_FN = () => { /* do nothing */ }

export const useGameStore = defineStore('game', () => {
  let currentGameId: string | null = null
  const authStore = useAuthStore()
  
  // Callbacks
  let unsubscribe = EMPTY_FN
  let gameChangedCallback: (game: Game) => void = EMPTY_FN
  let invalidVariantCallback = EMPTY_FN
  
  // Get real time updates for the moves in a game
  // Call this function after setting the callbacks
  function listenForUpdates(gameId: string) {
    if (currentGameId === gameId) return
    
    // If subscribed to a different game, unsubscribe first
    unsubscribe()
    
    const gameRef = GameDB.getGameRef(gameId)
    
    unsubscribe = onSnapshot(gameRef, snap => {
      if (!snap.exists()) throw new Error('Game does not exist')
      const gameDoc = snap.data() as GameDoc
      
      const variant = readVariantDoc(gameDoc.IMMUTABLE.variant, false, '')
      if (!variant) {
        invalidVariantCallback()
        return
      }
      const game = readDocument(gameDoc, variant)
      
      gameChangedCallback(game)
      
    })
    currentGameId = gameId
  }
  
  function onGameChanged(callback: (game: Game) => void) {
    gameChangedCallback = callback
  }
  function onInvalidVariant(callback: () => void) {
    invalidVariantCallback = callback
  }

  
  // Unsubscribe from game updates
  function removeListeners() {
    unsubscribe()
    currentGameId = null
    unsubscribe = EMPTY_FN
    gameChangedCallback = EMPTY_FN
    invalidVariantCallback = EMPTY_FN
  }
  
  function readDocument(doc: GameDoc, variant: Variant): Game {
    return {
      variant,
      whiteName: doc.IMMUTABLE.whiteDisplayName,
      blackName: doc.IMMUTABLE.blackDisplayName,
      loggedUserIsWhite: authStore.loggedUser?.uid === doc.IMMUTABLE.whiteId,
      loggedUserIsBlack: authStore.loggedUser?.uid === doc.IMMUTABLE.blackId,
    }
  }
  
  
  return {
    listenForUpdates,
    removeListeners,
    onGameChanged,
    onInvalidVariant,
  }
})
