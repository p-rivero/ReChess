
import { clone, objectEquals } from '@/utils/ts-utils'
import type { GameState, InitialState, MakeMoveFlag, MakeMoveWinner, MoveInfo } from '@/protochess/types'

export type MoveResult = { flag: MakeMoveFlag, winner: MakeMoveWinner }

export type MoveHistoryQueryResult = Readonly<{ state: GameState, lastMove?: MoveInfo }>

type MoveTreeNode = {
  move: MoveInfo | 'root'
  children: MoveTreeNode[]
  parent: MoveTreeNode | null
}

export class MoveHistoryManager {
  private initialState: Readonly<InitialState> | null = null
  private initialFen: string | undefined = undefined
  private historyRoot: MoveTreeNode
  private currentNode: MoveTreeNode
  private branchingAllowed
  
  constructor(branchingAllowed: boolean) {
    this.branchingAllowed = branchingAllowed
    this.historyRoot = { move: 'root', children: [], parent: null }
    this.currentNode = this.historyRoot
  }
  
  // Starts a new history
  public initialize(state: Readonly<GameState>) {
    this.initialState = state.initialState
    this.initialFen = state.initialFen
    this.historyRoot.children = []
    this.currentNode = this.historyRoot
    for (const move of state.moveHistory) {
      this.newMove(move)
    }
  }
  
  // Returns true if the user can currently make a move
  public canMakeMove(): boolean {
    if (this.branchingAllowed) return true
    // Enforce linear history
    return this.currentNode.children.length === 0
  }

  // Stores a new move in the history
  public newMove(move: MoveInfo) {
    if (!this.canMakeMove()) {
      throw new Error('Moving is not allowed')
    }
    // Check if this branch already exists
    const index = this.currentNode.children.findIndex(child => objectEquals(child.move, move))
    if (index !== -1) {
      this.currentNode = this.currentNode.children[index]
    } else {
      // Create a new branch
      const newNode: MoveTreeNode = { move, children: [], parent: this.currentNode }
      this.currentNode.children.push(newNode)
      this.currentNode = newNode
    }
  }

  // Returns the state reached by undoing the last move, null if there is none
  public undo(): MoveHistoryQueryResult | null {
    // Can't undo at the root
    if (this.currentNode.parent === null) return null
    this.currentNode = this.currentNode.parent
    return this.buildResultFromCurrentNode()
  }

  // Returns the state reached by redoing the last move, null if there is none
  // If there is more than one alternative, goes to the first child (principal variation)
  public redo(): MoveHistoryQueryResult | null {
    if (this.currentNode.children.length === 0) return null
    this.currentNode = this.currentNode.children[0]
    return this.buildResultFromCurrentNode()
  }

  
  private buildResultFromCurrentNode(): MoveHistoryQueryResult {
    return {
      state: this.buildStateFromCurrentIndex(),
      lastMove: this.currentNode.move === 'root' ? undefined : this.currentNode.move,
    }
  }
      
  // Creates a GameState object with a move history that ends at the current index (inclusive)
  private buildStateFromCurrentIndex(): Readonly<GameState> {
    // Build the move history by traveling up the tree until we reach the root
    const moveHistory: MoveInfo[] = []
    let currentNode: MoveTreeNode = this.currentNode
    while (currentNode.move !== 'root') {
      moveHistory.push(currentNode.move)
      if (!currentNode.parent) throw new Error('Unexpected null parent')
      currentNode = currentNode.parent
    }
    moveHistory.reverse()
    
    return {
      initialState: clone(this.initialState) as InitialState,
      initialFen: this.initialFen,
      moveHistory,
    }
  }
}
