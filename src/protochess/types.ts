
// PUBLIC API

export type Player = 'white' | 'black'

// Only the placement of the pieces, in the FEN format
type FenPlacements = string

/**  String containing the following parts, separated by spaces:
  * - Placement of the pieces, in the FEN format
  * - Player to move (w or b)
  * - Castling rights. This format needs to support arbitrary variants, so a custom format is used.
  *   The squares with a piece that has not moved are enclosed in square brackets and separated by commas (no spaces).
  *   To keep it short, only the rellevant squares are included (pieces that participate in castling).
  *   For example, the starting position would be: `[a1,h1,e1,a8,h8,e8]`
  *   To mantain compatibility with traditional FEN, `QKqk` and `AHah` formats are also supported.
  * - En passant square (if any)
  * - (Optional) Check count for variants like 3-check.
  *   Format: +W+B, where W is the number of times White put Black in check
  * - (Optional) Halfmove clock (ignored)
  * - (Optional) Fullmove number (ignored) */
type FullFen = string

export interface Protochess {
  /** Console-friendly representation of the current state */
  toString(): Promise<string>,
  /** Get the player that has to move */
  playerToMove(): Promise<Player>,
  /** Check if the current position is valid. Throws an error if it's not. */
  validatePosition(): Promise<void>,
  /** Play a (legal) move. Returns the result of making this move. */
  makeMove(move: MoveInfo): Promise<MakeMoveResult>,
  /** Same as makeMove, but accepts a string in long algebraic notation (e.g. "e2e4") */
  makeMoveStr(move: string): Promise<MakeMoveResult>,
  /** Searches the best move at the given depth. Returns the move and the evaluation of the position. */
  getBestMove(depth: number): Promise<MoveInfoWithEval>,
  /** Searches the best move for the given time (in seconds). Returns the move, the evaluation of the position, and the depth reached. */
  getBestMoveTimeout(time: number): Promise<MoveInfoWithEvalDepth>,
  /** Set the current state, formed by an InitialState, and the list of moves that were played.
    * If a FEN is provided, it will be applied before the moves. */
  setState(state: GameState2): Promise<StateDiff>,
  /** Load a user-provided FEN string. See FullFen for the format. */
  loadFen(fen: FullFen): Promise<void>,
  /** Get the full current state, which can later be used in `setState()` */
  getState(): Promise<GameState2>,
  /** Get the current state, but only the information that can change during a game */
  getStateDiff(): Promise<StateDiff>,
  /** Get all possible moves for the current player (for each origin square, what are the possible destinations) */
  legalMoves(): Promise<MoveList[]>,
  /** For a given move (from, to), returns the IDs of the pieces that can be promoted to */
  possiblePromotions(move: MoveInfo): Promise<string[]>,
  
  // Multi-threading control
  /** Returns the maximum number of threads that can be used in `setNumThreads()` */
  getMaxThreads(): Promise<number>,
  setNumThreads(threads: number): Promise<void>,
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
export interface MoveInfoWithEval extends MoveInfo {
  evaluation: number | `#${number}`,
}
export interface MoveInfoWithEvalDepth extends MoveInfoWithEval {
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
export interface InitialState extends StateDiff {
  pieceTypes: PieceDefinitionLogic[],
  boardWidth: number,
  boardHeight: number,
  invalidSquares: [number, number][],
  globalRules: GlobalRules,
}

/** @see {isGameState2} ts-auto-guard:type-guard */
export interface GameState2 {
  initialState: InitialState,
  initialFen?: FullFen,
  moveHistory: MoveInfo[],
}

/** @see {isVariant} ts-auto-guard:type-guard */
export interface Variant extends InitialState {
  pieceTypes: PieceDefinition[],
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
/** @see {isPieceDefinitionLogic} ts-auto-guard:type-guard */
export interface PieceDefinitionLogic {
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
export interface PieceDefinition extends PieceDefinitionLogic {
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
  wasmObject: {
    toString(): Promise<unknown>,
    playerToMove(): Promise<unknown>,
    validatePosition(): Promise<unknown>,
    makeMove(move: MoveInfo): Promise<unknown>,
    makeMoveStr(moveStr: string): Promise<unknown>,
    getBestMove(depth: number): Promise<unknown>,
    getBestMoveTimeout(time: number): Promise<unknown>,
    setState(state: GameState2): Promise<unknown>,
    loadFen(fen: FullFen): Promise<unknown>,
    getState(): Promise<unknown>,
    getStateDiff(): Promise<unknown>,
    legalMoves(): Promise<unknown>,
    possiblePromotions(move: MoveInfo): Promise<unknown>,
    getMaxThreads(): Promise<unknown>,
    setNumThreads(threads: number): Promise<unknown>,
  }
}

export interface IWasmModuleConstructor {
  new(): Promise<IWasmModule>,
}

/** @see {isGetBestMoveResult} ts-auto-guard:type-guard */
export interface GetBestMoveResult {
  moveInfo: MoveInfo,
  evaluation: number,
}

/** @see {isGetBestMoveTimeoutResult} ts-auto-guard:type-guard */
export interface GetBestMoveTimeoutResult {
  moveInfo: MoveInfo,
  evaluation: number,
  depth: number,
}
