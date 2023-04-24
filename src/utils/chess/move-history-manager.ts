
import { clone } from '@/utils/ts-utils'
import type { GameState, InitialState, MakeMoveFlag, MakeMoveWinner, MoveInfo } from '@/protochess/types'

export type MoveResult = { flag: MakeMoveFlag, winner: MakeMoveWinner }

export type MoveHistoryQueryResult = Readonly<{ state: GameState, lastMove?: MoveInfo }>

export class MoveHistoryManager {
  private initialState: Readonly<InitialState> | null = null
  private initialFen: string | undefined = undefined
  private history: MoveInfo[] = []
  private currentIndex = -1
  private branchingAllowed
  
  constructor(branchingAllowed: boolean) {
    this.branchingAllowed = branchingAllowed
  }
  
  // Starts a new history
  public initialize(state: Readonly<GameState>) {
    this.initialState = state.initialState
    this.initialFen = state.initialFen
    this.history = []
    this.currentIndex = -1
    for (const move of state.moveHistory) {
      this.newMove(move)
    }
  }
  
  // Returns true if the user can currently make a move
  public canMakeMove(): boolean {
    if (this.branchingAllowed) return true
    return this.currentIndex === this.history.length - 1
  }

  // Stores a new move in the history
  public newMove(move: MoveInfo) {
    if (this.currentIndex !== this.history.length - 1) {
      // Create new branch
      if (!this.branchingAllowed) throw new Error('Move branching not allowed')
      // TODO
      return
    }
    this.history.push(move)
    this.currentIndex++
  }

  // Returns the state reached by undoing the last move, null if there is none
  public undo(): MoveHistoryQueryResult | null {
    if (this.currentIndex > -1) {
      this.currentIndex--
      return this.buildResultFromCurrentIndex()
    }
    return null
  }

  // Returns the state reached by redoing the last move, null if there is none
  public redo(): MoveHistoryQueryResult | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      return this.buildResultFromCurrentIndex()
    }
    return null
  }

  
  private buildResultFromCurrentIndex(): MoveHistoryQueryResult {
    return {
      state: this.buildStateFromCurrentIndex(),
      lastMove: this.history[this.currentIndex], // Returns undefined if currentIndex is -1
    }
  }
      
  // Creates a GameState object with a move history that ends at the current index (inclusive)
  private buildStateFromCurrentIndex(): Readonly<GameState> {
    return {
      initialState: clone(this.initialState) as InitialState,
      initialFen: this.initialFen,
      // End index is inclusive, add 1
      moveHistory: this.history.slice(0, this.currentIndex+1),
    }
  }
}
