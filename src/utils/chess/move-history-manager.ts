
import type { GameState, InitialState, MakeMoveFlag, MakeMoveWinner, MoveInfo } from '@/protochess/types'
import { clone } from '@/utils/ts-utils'

export type MoveResult = { flag: MakeMoveFlag, winner: MakeMoveWinner }

export type MoveHistoryQueryResult = { state: GameState, result?: MoveResult, lastMove?: MoveInfo } | null

type MoveHistoryEntry = {
  // The move that was made to reach the state. Undefined in the initial state.
  move: MoveInfo
  // The result of the move (for updating the game result)
  result?: MoveResult
}

const DUMMY_MOVE: Readonly<MoveInfo> = { from: [0, 0], to: [0, 0] }

export class MoveHistoryManager {
  private initialState: Readonly<InitialState> | null = null
  private initialFen: string | undefined = undefined
  private history: MoveHistoryEntry[] = []
  private currentIndex = -1
  private branchingAllowed
  
  constructor(branchingAllowed: boolean) {
    this.branchingAllowed = branchingAllowed
  }
  
  // Starts a new history
  public initialize(initialState: Readonly<InitialState>, initialFen?: string) {
    this.initialState = initialState
    this.initialFen = initialFen
    this.history = [{ move: clone(DUMMY_MOVE), result: undefined }]
    this.currentIndex = 0
  }
  
  // Returns true if the user can currently make a move
  public canMakeMove(): boolean {
    if (this.branchingAllowed) return true
    return this.currentIndex === this.history.length - 1
  }

  // Stores a new move in the history
  public newMove(move: MoveInfo, result?: MoveResult) {
    if (this.currentIndex !== this.history.length - 1) {
      // Create new branch
      if (!this.branchingAllowed) throw new Error('Move branching not allowed')
      // TODO
      return
    }
    this.history.push({ move, result })
    this.currentIndex++
  }

  // Returns the state reached by undoing the last move, null if there is none
  public undo(): MoveHistoryQueryResult {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return {
        state: this.buildStateFromCurrentIndex(),
        result: this.history[this.currentIndex].result,
        lastMove: this.history[this.currentIndex].move,
      }
    }
    return null
  }

  // Returns the state reached by redoing the last move, null if there is none
  public redo(): MoveHistoryQueryResult {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      return {
        state: this.buildStateFromCurrentIndex(),
        result: this.history[this.currentIndex].result,
        lastMove: this.history[this.currentIndex].move,
      }
    }
    return null
  }
  
  private buildStateFromCurrentIndex(): GameState {
    return {
      initialState: clone(this.initialState) as InitialState,
      initialFen: this.initialFen,
      moveHistory: this.history.slice(1, this.currentIndex).map(entry => entry.move),
    }
  }
}
