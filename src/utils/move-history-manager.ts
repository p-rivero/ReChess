
import type { GameState, MoveInfo } from "@/protochess/interfaces"
import { clone } from "@/utils/ts-utils"

type MoveHistoryEntry = {
  // The state that was reached by the move
  state: GameState
  // The move that was made to reach the state (for highlighting squares)
  move?: MoveInfo
}

export class MoveHistoryManager {
  private history: MoveHistoryEntry[] = []
  private currentIndex = -1
  private branchingAllowed
  
  constructor(branchingAllowed: boolean) {
    this.branchingAllowed = branchingAllowed
  }
  
  // Starts a new history
  public initialize(initialState: GameState) {
    this.history = [{ state: clone(initialState) }]
    this.currentIndex = 0
  }
  
  // Returns true if the user can currently make a move
  public canMakeMove(): boolean {
    if (this.branchingAllowed) return true
    return this.currentIndex === this.history.length - 1
  }

  // Stores a new move in the history
  public newMove(move: MoveInfo, newState: GameState) {
    const stateCopy = clone(newState)
    if (this.currentIndex !== this.history.length - 1) {
      // Create new branch
      if (!this.branchingAllowed) throw new Error("Move branching not allowed")
      // TODO
      return
    }
    this.history.push({ state: stateCopy, move })
    this.currentIndex++
  }

  // Returns the state reached by undoing the last move, null if there is none
  public undo(): MoveHistoryEntry | null {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return this.history[this.currentIndex]
    }
    return null
  }

  // Returns the state reached by redoing the last move, null if there is none
  public redo(): MoveHistoryEntry | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      return this.history[this.currentIndex]
    }
    return null
  }
}
