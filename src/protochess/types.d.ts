
// PUBLIC API

export type Player = 'white' | 'black'

// Only the placement of the pieces, in the FEN format
type FenPlacements = string

/** See [this document](https://github.com/p-rivero/protochess-engine/tree/master/docs/FEN.md)
 *  for the custom FEN format */
type FullFen = string

type SearchCallback = (info: SearchResult) => void

/** Represents the Protochess engine, running as a WASM module. Currently this is a global object,
 *  so it's not possible to search the best move for 2 games at the same time. */
export interface Protochess {
  /** Console-friendly representation of the current state */
  toString(): Promise<string>,
  
  /** Get the player that has to move */
  playerToMove(): Promise<Player>,
  
  /** Check if the current position is valid. Throws an error if it's not. */
  validatePosition(): Promise<void>,
  
  /** Play a move. Returns the result of making this move, or throws an error if the move is illegal. */
  makeMove(move: MoveInfo): Promise<MakeMoveResult>,
  
  /** Same as makeMove, but accepts a string in long algebraic notation (e.g. "e2e4") */
  makeMoveStr(move: string): Promise<MakeMoveResult>,
  
  /** Searches the best move at the given depth. Returns the move and the evaluation of the position.
   * If a callback is provided, it will be called every `callbackPeriodMs` milliseconds (default: 100ms)
   * with the current best move. */
  getBestMove(depth: number, callback?: SearchCallback, callbackPeriodMs?: number): Promise<SearchResult>,
  
  /** Searches the best move for the given time (in **milliseconds**). If left undefined, it will keep
   * searching until `stopSearch()` is called. If a callback is provided, it will be called every
   * `callbackPeriodMs` milliseconds (default: 100ms) with the current best move.
   * @returns The move, the evaluation of the position, and the depth reached. */
  getBestMoveTimeout(timeout?: number, callback?: SearchCallback, callbackPeriodMs?: number): Promise<SearchResult>,
  
  /** Set the current state, formed by an InitialState, and the list of moves that were played.
    * If a FEN is provided, it will be applied before the moves.
    * After calling `setState()`, use `getStateDiff()` to update the GUI.
    * @returns The result of the **last move** in the move history, or `Ok` if there was none. */
  setState(state: GameState): Promise<MakeMoveResult>,
  
  /** Load a user-provided FEN string. See FullFen for the format.
    * After calling `loadFen()`, use `getStateDiff()` to update the GUI */
  loadFen(fen: FullFen): Promise<void>,
  
  /** Get the full current state, which can later be used in `setState()` */
  getState(): Promise<GameState>,
  
  /** Get the current state, but only the information that can change during a game */
  getStateDiff(): Promise<StateDiff>,
  
  /** Get all possible moves for the current player (for each origin square, what are the possible destinations) */
  legalMoves(): Promise<MoveList[]>,
  
  /** For a given move (from, to), returns the IDs of the pieces that can be promoted to */
  possiblePromotions(from: [number, number], to: [number, number]): Promise<string[]>,
  
  
  // Multi-threading control
  
  /** Returns true if this browser window supports `SharedArrayBuffer` */
  isMultiThreaded(): boolean,
  
  /** Returns the maximum number of threads that can be used in `setNumThreads()` */
  getMaxThreads(): Promise<number>,
  
  /** Tells the engine how many threads to use when searching */
  setNumThreads(threads: number): Promise<void>,
  
  
  // Direct memory access
  
  /** Interrupts the execution of `getBestMove` or `getBestMoveTimeout`, signaling the searching
   * thread(s) to return the best move found so far.
   */
  stopSearch(): void,
  
  /** Returns the best move found so far, without interrupting the current search.
   * The data is read directly from the WASM memory without waiting for the search to finish. Call it periodically to get real-time updates on the search progress. */
  getCurrentResult(): SearchResult,
}

export type MakeMoveFlag =
  'Ok' |
  'IllegalMove' |
  'Checkmate' |
  'LeaderCaptured' |
  'AllPiecesCaptured' |
  'PieceInWinSquare' |
  'CheckLimit' |
  'Stalemate' |
  'Repetition'
  
export type MakeMoveWinner = Player | 'none'

/** @see {isMakeMoveResult} ts-auto-guard:type-guard */
export interface MakeMoveResult {
  flag: MakeMoveFlag,
  winner: MakeMoveWinner,
  exploded: [number, number][],
}

/** @see {isMoveInfo} ts-auto-guard:type-guard */
export interface MoveInfo {
  // x, y coordinates between 0 and 15
  // (0, 0 is the bottom left corner)
  // promotion is a piece id (string of 1 character)
  from: [number, number],
  to: [number, number],
  promotion?: string,
}
export interface SearchResult extends MoveInfo {
  evaluation: number | `#${number}`,
  depth: number,
}
/** @see {isMoveList} ts-auto-guard:type-guard */
export interface MoveList {
  x: number,
  y: number,
  moves: MoveInfo[],
}


/** @see {isStateDiff} ts-auto-guard:type-guard */
export interface StateDiff {
  fen: FenPlacements, // Piece placements at the current position
  inCheck: boolean,
  playerToMove: 0 | 1,
}

// Immutable properties of the game
/** @see {isInitialState} ts-auto-guard:type-guard */
export interface InitialState {
  fen: FenPlacements, // Initial piece placements for this variant
  playerToMove: 0 | 1, // First player to move in this variant (0 = White, 1 = Black)
  pieceTypes: PieceDefinition[],
  boardWidth: number,
  boardHeight: number,
  globalRules: GlobalRules,
}

/** @see {isGameState} ts-auto-guard:type-guard */
export interface GameState {
  initialState: InitialState,
  initialFen?: FullFen,
  moveHistory: MoveInfo[],
}

/** @see {isVariant} ts-auto-guard:type-guard */
export interface Variant extends InitialState {
  pieceTypes: FullPieceDef[],
  displayName: string,
  description: string,
}

/** @see {isPublishedVariant} ts-auto-guard:type-guard */
export interface PublishedVariant extends Variant {
  uid: string,
  creationTime: Date,
  creatorDisplayName: string,
  creatorId?: string,
  numUpvotes: number,
  loggedUserUpvoted: boolean,
}


// Piece properties that affect the game logic
/** @see {isPieceDefinition} ts-auto-guard:type-guard */
export interface PieceDefinition {
  ids: [string|undefined|null, string|undefined|null],
  isLeader: boolean,
  castleFiles?: [number, number],
  isCastleRook: boolean,
  explodes: boolean,
  explosionDeltas: [number, number][],
  immuneToExplosion: boolean,
  promotionSquares: [number, number][],
  promoVals: [string[], string[]],
  doubleJumpSquares: [number, number][],
  attackSlidingDeltas: [number, number][][],
  attackJumpDeltas: [number, number][],
  attackNorth: boolean,
  attackSouth: boolean,
  attackEast: boolean,
  attackWest: boolean,
  attackNortheast: boolean,
  attackNorthwest: boolean,
  attackSoutheast: boolean,
  attackSouthwest: boolean,
  translateJumpDeltas: [number, number][],
  translateSlidingDeltas: [number, number][][],
  translateNorth: boolean,
  translateSouth: boolean,
  translateEast: boolean,
  translateWest: boolean,
  translateNortheast: boolean,
  translateNorthwest: boolean,
  translateSoutheast: boolean,
  translateSouthwest: boolean,
  winSquares: [number, number][],
}

// Piece properties that are only used for the GUI
export interface FullPieceDef extends PieceDefinition {
  displayName: string,
  imageUrls: [string|undefined|null, string|undefined|null],
}


export interface GlobalRules {
  capturingIsForced: boolean,
  checkIsForbidden: boolean,
  stalematedPlayerLoses: boolean,
  invertWinConditions: boolean,
  repetitionsDraw: number,
  checksToLose: number,
}



// Interface for the WASM module

export interface IWasmModule {
  init(): Promise<void>,
  supportsThreads: Promise<boolean>,
  memoryBuffer: Promise<ArrayBuffer>,
  wasmObject: {
    toString(): Promise<unknown>,
    playerToMove(): Promise<unknown>,
    validatePosition(): Promise<unknown>,
    makeMove(move: MoveInfo): Promise<unknown>,
    makeMoveStr(moveStr: string): Promise<unknown>,
    getBestMove(depth: number): Promise<unknown>,
    getBestMoveTimeout(): Promise<unknown>,
    setState(state: GameState): Promise<unknown>,
    loadFen(fen: FullFen): Promise<unknown>,
    getState(): Promise<unknown>,
    getStateDiff(): Promise<unknown>,
    legalMoves(): Promise<unknown>,
    possiblePromotions(fromX: number, fromY: number, toX: number, toY: number): Promise<unknown>,
    getMaxThreads(): Promise<unknown>,
    setNumThreads(threads: number): Promise<unknown>,
    
    getStopFlagPtr(): Promise<unknown>,
    getMvFromPtr(): Promise<unknown>,
    getMvToPtr(): Promise<unknown>,
    getMvPromoPtr(): Promise<unknown>,
    getScorePtr(): Promise<unknown>,
    getDepthPtr(): Promise<unknown>,
  }
}

export interface IWasmModuleConstructor {
  new(): Promise<IWasmModule>,
}

// TODO: Remove 2
/** @see {isMoveInfoWithEvalDepth2} ts-auto-guard:type-guard */
export interface MoveInfoWithEvalDepth2 {
  moveInfo: MoveInfo,
  evaluation: number,
  depth: number,
}
