import { onSnapshot } from '@firebase/firestore'
import { GameDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import type { GameDoc } from '@/firebase/db/schema'
import type { MoveInfo, Player, Variant } from '@/protochess/types'
import { readVariantDoc } from './variant'
import { useAuthStore } from './auth-user'
import { object_equals } from '@/utils/ts-utils'

export type Game = {
  variant: Variant
  moveHistory: MoveInfo[]
  moveHistoryString: string // Stringified version of moveHistory
  playerToMove: 'white' | 'black' | 'game-over'
  winner?: 'white' | 'black' | 'draw'
  
  whiteName: string
  blackName: string
  loggedUserIsWhite: boolean
  loggedUserIsBlack: boolean
}

const EMPTY_FN = () => { /* do nothing */ }

export const useGameStore = defineStore('game', () => {
  let currentGameId: string | null = null
  let currentGame: Game | null = null
  let currentVariant: Variant | null = null
  const authStore = useAuthStore()
  
  // Callbacks
  let unsubscribe = EMPTY_FN
  let gameChangedCallback: (game: Game) => void = EMPTY_FN
  let gameNotExistsCallback = EMPTY_FN
  let invalidVariantCallback = EMPTY_FN
  
  // Get real time updates for the moves in a game
  // Call this function after setting the callbacks
  function listenForUpdates(gameId: string) {
    if (currentGameId === gameId) return
    
    // If subscribed to a different game, unsubscribe first
    unsubscribe()
    
    const gameRef = GameDB.getGameRef(gameId)
    
    unsubscribe = onSnapshot(gameRef, snap => {
      if (!snap.exists()) {
        gameNotExistsCallback()
        return
      }
      const gameDoc = snap.data() as GameDoc
      
      // Don't parse the variant doc every time a move is made
      // Only parse it when the game is first loaded
      if (currentVariant == null) {
        const variant = readVariantDoc(gameDoc.IMMUTABLE.variant, false, '')
        if (!variant) {
          invalidVariantCallback()
          return
        }
        currentVariant = variant
      }
      const newGame = readDocument(gameDoc, currentVariant)
      // If the same user has 2 tabs open, we need to check which ones are outdated
      // and call the callback only when needed
      if (!object_equals(newGame, currentGame)) {
        gameChangedCallback(newGame)
        currentGame = newGame
      }
    })
    currentGameId = gameId
  }
  
  function onGameChanged(callback: (game: Game) => void) {
    gameChangedCallback = callback
  }
  function onGameNotExists(callback: () => void) {
    gameNotExistsCallback = callback
  }
  function onInvalidVariant(callback: () => void) {
    invalidVariantCallback = callback
  }

  
  // Unsubscribe from game updates
  function removeListeners() {
    unsubscribe()
    currentGameId = null
    currentVariant = null
    currentGame = null
    unsubscribe = EMPTY_FN
    gameChangedCallback = EMPTY_FN
    gameNotExistsCallback = EMPTY_FN
    invalidVariantCallback = EMPTY_FN
  }
  
  
  async function movePiece(
    from: [number, number],
    to: [number, number],
    promotion: string | undefined,
    playerToMove: Player,
    winner: 'white' | 'black' | 'draw' | undefined
  ) {
    if (!currentGameId || !currentGame) throw new Error('No game is being listened to')
    // Append the new move to the move history
    currentGame.moveHistory.push({ from, to, promotion })
    currentGame.moveHistoryString += stringifyMove(from, to, promotion)
    currentGame.playerToMove = winner ? 'game-over' : playerToMove
    currentGame.winner = winner
    // Update the game in the database
    await GameDB.updateGame(currentGameId, currentGame.moveHistoryString, currentGame.playerToMove, currentGame.winner)
  }
  
  
  function readDocument(doc: GameDoc, variant: Variant): Game {
    const moveHistory: MoveInfo[] = []
    for (const move of doc.moveHistory.split(' ')) {
      if (move.length === 0) continue
      moveHistory.push(parseMove(move))
    }
    return {
      variant,
      moveHistory,
      moveHistoryString: doc.moveHistory,
      playerToMove: doc.playerToMove,
      winner: doc.winner ?? undefined,
      whiteName: doc.IMMUTABLE.whiteDisplayName,
      blackName: doc.IMMUTABLE.blackDisplayName,
      loggedUserIsWhite: authStore.loggedUser?.uid === doc.IMMUTABLE.whiteId,
      loggedUserIsBlack: authStore.loggedUser?.uid === doc.IMMUTABLE.blackId,
    }
  }
  
  function parseMove(move: string): MoveInfo {
    const moveRegex = /^([a-p])([0-9]{1,2})([a-p])([0-9]{1,2})(=..?)?$/
    const match = move.match(moveRegex)
    if (!match) throw new Error(`Invalid move string: "${move}"`)
    const [, fromFile, fromRank, toFile, toRank, promotion] = match
    const fromX = fromFile.charCodeAt(0) - 'a'.charCodeAt(0)
    const fromY = parseInt(fromRank) - 1
    const toX = toFile.charCodeAt(0) - 'a'.charCodeAt(0)
    const toY = parseInt(toRank) - 1
    // Skip '='
    const promotionId = promotion ? promotion[1] : undefined
    return {
      from: [fromX, fromY],
      to: [toX, toY],
      promotion: promotionId,
    }
  }
  
  function stringifyMove(from: [number, number], to: [number, number], promotion: string|undefined) {
    const promotionStr = promotion ? `=${promotion}` : ''
    // Important: the space at the end is required
    return stringifyCoord(from) + stringifyCoord(to) + promotionStr + ' '
  }
  function stringifyCoord(coord: [number, number]) {
    const file = String.fromCharCode('a'.charCodeAt(0) + coord[0])
    const rank = coord[1] + 1
    return file + rank
  }
  
  
  return {
    listenForUpdates,
    removeListeners,
    onGameChanged,
    onGameNotExists,
    onInvalidVariant,
    
    movePiece,
  }
})
