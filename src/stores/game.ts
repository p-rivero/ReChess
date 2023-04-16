import { onSnapshot } from '@firebase/firestore'
import { GameDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import type { GameDoc } from '@/firebase/db/schema'
import type { MoveInfo, Player, Variant } from '@/protochess/types'
import { readVariantDoc } from './variant'
import { useAuthStore } from './auth-user'

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
  let currentGameVariant: Variant | null = null
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
      let reloadRequired = false
      if (!snap.exists()) throw new Error('Game does not exist')
      const gameDoc = snap.data() as GameDoc
      
      // Don't parse the variant doc every time a move is made
      // Only parse it when the game is first loaded
      if (currentGameVariant == null) {
        const variant = readVariantDoc(gameDoc.IMMUTABLE.variant, false, '')
        if (!variant) {
          invalidVariantCallback()
          return
        }
        currentGameVariant = variant
        reloadRequired = true
      }
      const game = readDocument(gameDoc, currentGameVariant)
      
      // When the user makes a move, the game is updated and onSnapshot is called with the values we just set.
      // We don't need to re-update the board in this case.
      const skipCallback = game.loggedUserIsWhite && game.playerToMove === 'black'
        || game.loggedUserIsBlack && game.playerToMove === 'white'
      // If this is the first load, always update the board.
      if (!skipCallback || reloadRequired) {
        gameChangedCallback(game)
      }
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
    currentGameVariant = null
    unsubscribe = EMPTY_FN
    gameChangedCallback = EMPTY_FN
    invalidVariantCallback = EMPTY_FN
  }
  
  
  async function movePiece(
    game: Game,
    from: [number, number],
    to: [number, number],
    promotion: string | undefined,
    playerToMove: Player,
    winner: 'white' | 'black' | 'draw' | undefined
  ) {
    if (!currentGameId) throw new Error('No game is being listened to')
    // Append the new move to the move history
    game.moveHistory.push({ from, to, promotion })
    game.moveHistoryString += stringifyMove(from, to, promotion)
    game.playerToMove = winner ? 'game-over' : playerToMove
    game.winner = winner
    // Update the game in the database
    await GameDB.updateGame(currentGameId, game.moveHistoryString, game.playerToMove, game.winner)
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
    onInvalidVariant,
    
    movePiece,
  }
})
