import { GameDB } from '@/firebase/db'
import { defineStore } from 'pinia'
import { cancelGame as fnCancelGame } from '@/firebase'
import { moveToString, parseMove } from '@/helpers/chess/chess-coords'
import { objectEquals } from '@/helpers/ts-utils'
import { onSnapshot } from '@firebase/firestore'
import { readVariantDoc } from './variant'
import { useAuthStore } from './auth-user'
import type { GameDoc, GameSummary } from '@/firebase/db/schema'
import type { MoveInfo, PieceId, Player, PublishedVariant } from '@/protochess/types'

export interface Game {
  id: string
  variant: PublishedVariant
  moveHistory: MoveInfo[]
  moveHistoryString: string // Stringified version of moveHistory
  playerToMove: 'white' | 'black' | 'game-over'
  winner?: 'white' | 'black' | 'draw'
  createdAt: Date
  
  whiteName: string
  whiteId: string
  blackName: string
  blackId: string
  loggedUserIsWhite: boolean
  loggedUserIsBlack: boolean
}

type Callback = () => void | Promise<void>
type CallbackOf<T> = (arg: T) => void | Promise<void>
const EMPTY_FN = () => { /* do nothing */ }

export const useGameStore = defineStore('game', () => {
  let currentGameId: string | null = null
  let currentGame: Game | null = null
  let currentVariant: PublishedVariant | null = null
  const authStore = useAuthStore()
  
  // Callbacks
  let unsubscribe = EMPTY_FN
  let gameChangedCallback: CallbackOf<Game> = EMPTY_FN
  let gameNotExistsCallback: Callback = EMPTY_FN
  let invalidVariantCallback: Callback = EMPTY_FN
  
  // Get real time updates for the moves in a game
  // Call this function after setting the callbacks
  function listenForUpdates(gameId: string) {
    if (currentGameId === gameId) return
    
    // If subscribed to a different game, unsubscribe first
    unsubscribe()
    
    const gameRef = GameDB.getGameRef(gameId)
    
    unsubscribe = onSnapshot(gameRef, async snap => {
      if (!snap.exists()) {
        await gameNotExistsCallback()
        return
      }
      const gameDoc = snap.data() as GameDoc
      
      // Don't parse the variant doc every time a move is made
      // Only parse it when the game is first loaded
      if (currentVariant == null) {
        const variant = readVariantDoc(gameDoc.IMMUTABLE.variant, gameDoc.IMMUTABLE.variantId)
        if (!variant) {
          await invalidVariantCallback()
          return
        }
        currentVariant = variant
      }
      const newGame = readDocument(snap.id, gameDoc, currentVariant)
      // If the same user has 2 tabs open, we need to check which ones are outdated
      // and call the callback only when needed
      if (!objectEquals(newGame, currentGame)) {
        await gameChangedCallback(newGame)
        currentGame = newGame
      }
    })
    currentGameId = gameId
  }
  
  function onGameChanged(callback: CallbackOf<Game>) {
    gameChangedCallback = callback
  }
  function onGameNotExists(callback: Callback) {
    gameNotExistsCallback = callback
  }
  function onInvalidVariant(callback: Callback) {
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
  
  
  /** Makes a move on the current game, and optionally sets the winner of the game */
  async function movePiece(
    from: [number, number],
    to: [number, number],
    promotion: PieceId | undefined,
    playerToMove: Player,
    winner: 'white' | 'black' | 'draw' | undefined
  ) {
    if (!currentGameId || !currentGame) throw new Error('No game is being listened to')
    // Append the new move to the move history. Important: Add a space after the move
    currentGame.moveHistory.push({ from, to, promotion })
    currentGame.moveHistoryString += moveToString({ from, to, promotion }) + ' '
    
    currentGame.playerToMove = winner ? 'game-over' : playerToMove
    currentGame.winner = winner
    // Update the game in the database
    await GameDB.updateGame(currentGameId, currentGame.moveHistoryString, currentGame.playerToMove, currentGame.winner)
  }
  
  
  /** Returns a list of games that the user has played */
  async function getUserGames(userId: string): Promise<GameSummary[]> {
    const gameDocs = await GameDB.getUserGames(userId)
    return gameDocs.map(([doc, id]) => {
      const variant = readVariantDoc(doc.IMMUTABLE.variant, doc.IMMUTABLE.variantId)
      if (!variant) throw new Error('Invalid variant')
      
      const side = doc.IMMUTABLE.whiteId === userId ? 'white' : 'black'
      return {
        gameId: id,
        variantId: variant.uid,
        variantName: variant.displayName,
        timeCreatedMs: doc.IMMUTABLE.timeCreated.toMillis(),
        playedSide: side,
        result: doc.winner === side ? 'win' : doc.winner === 'draw' ? 'draw' : 'loss',
        opponentId: side === 'white' ? doc.IMMUTABLE.blackId : doc.IMMUTABLE.whiteId,
        opponentName: side === 'white' ? doc.IMMUTABLE.blackDisplayName : doc.IMMUTABLE.whiteDisplayName,
      }
    })
  }
  
  async function cancelGame(reason: string) {
    if (!currentGameId) throw new Error('No game is being listened to')
    try {
      await fnCancelGame({ gameId: currentGameId, reason })
    } catch (e) {
      console.error(e)
      // This could happen if the game was already cancelled or if the user has been banned
      // there is not much we can do about it, and throwing an error would just cause navigation issues
      // Return and pretend that the game was cancelled
    }
  }
  
  
  function readDocument(id: string, doc: GameDoc, variant: PublishedVariant): Game {
    const moveHistory: MoveInfo[] = []
    for (const move of doc.moveHistory.split(' ')) {
      if (move.length === 0) continue
      moveHistory.push(parseMove(move))
    }
    return {
      id,
      variant,
      moveHistory,
      moveHistoryString: doc.moveHistory,
      playerToMove: doc.playerToMove,
      winner: doc.winner ?? undefined,
      createdAt: doc.IMMUTABLE.timeCreated.toDate(),
      whiteName: doc.IMMUTABLE.whiteDisplayName,
      whiteId: doc.IMMUTABLE.whiteId,
      blackName: doc.IMMUTABLE.blackDisplayName,
      blackId: doc.IMMUTABLE.blackId,
      loggedUserIsWhite: authStore.loggedUser?.uid === doc.IMMUTABLE.whiteId,
      loggedUserIsBlack: authStore.loggedUser?.uid === doc.IMMUTABLE.blackId,
    }
  }
  
  
  return {
    listenForUpdates,
    removeListeners,
    onGameChanged,
    onGameNotExists,
    onInvalidVariant,
    
    movePiece,
    getUserGames,
    cancelGame,
  }
})
