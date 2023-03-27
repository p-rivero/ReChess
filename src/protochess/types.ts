
// PUBLIC API

export type Player = 'white' | 'black'

export interface Protochess {
  toString(): Promise<string>,
  playerToMove(): Promise<Player>,
  validatePosition(): Promise<void>,
  playBestMove(depth: number): Promise<MakeMoveResult>,
  playBestMoveTimeout(time: number): Promise<MakeMoveResultWithDepth>,
  makeMove(move: MoveInfo): Promise<MakeMoveResult>,
  makeMoveStr(move: string): Promise<MakeMoveResult>,
  getBestMove(depth: number): Promise<MoveInfoWithEval>,
  getBestMoveTimeout(time: number): Promise<MoveInfoWithEvalDepth>,
  isInCheck(): Promise<boolean>,
  setState(state: GameState): Promise<void>,
  getState(): Promise<GameStateGui>,
  loadFen(fen: string): Promise<void>,
  movesFrom(x: number, y: number): Promise<MoveInfo[]>,
  legalMoves(): Promise<MoveList[]>,
  possiblePromotions(fromX: number, fromY: number, toX: number, toY: number): Promise<string[]>,
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
export interface MakeMoveResultWithDepth extends MakeMoveResult {
  depth: number,
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

/** @see {isGameState} ts-auto-guard:type-guard */
export interface GameState {
  pieceTypes: PieceDefinition[],
  boardWidth: number,
  boardHeight: number,
  invalidSquares: [number, number][],
  pieces: PiecePlacement[],
  playerToMove: 0 | 1,
  epSquareAndVictim?: [[number, number], [number, number]],
  timesInCheck?: [number, number],
  globalRules: GlobalRules,
}
/** @see {isGameStateGui} ts-auto-guard:type-guard */
export interface GameStateGui extends GameState {
  fen: string,
  inCheck: boolean,
}
/** @see {isVariant} ts-auto-guard:type-guard */
export interface Variant extends GameState {
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
/** @see {isVariantGui} ts-auto-guard:type-guard */
export interface PublishedVariantGui extends PublishedVariant, GameStateGui { }


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
  displayName: string,
  imageUrls: [string|undefined|null, string|undefined|null],
}

export interface PiecePlacement {
  pieceId: string,
  x: number,
  y: number,
  canCastle?: boolean,
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
    playBestMove(depth: number): Promise<unknown>,
    playBestMoveTimeout(time: number): Promise<unknown>,
    makeMove(move: MoveInfo): Promise<unknown>,
    makeMoveStr(moveStr: string): Promise<unknown>,
    getBestMove(depth: number): Promise<unknown>,
    getBestMoveTimeout(time: number): Promise<unknown>,
    toMoveInCheck(): Promise<unknown>,
    setState(state: GameState): Promise<unknown>,
    getState(): Promise<unknown>,
    loadFen(fen: string): Promise<unknown>,
    movesFrom(x: number, y: number): Promise<unknown>,
    legalMoves(): Promise<unknown>,
    possiblePromotions(fromX: number, fromY: number, toX: number, toY: number): Promise<unknown>,
    getMaxThreads(): Promise<unknown>,
    setNumThreads(threads: number): Promise<unknown>,
  }
}

export interface IWasmModuleConstructor {
  new(): Promise<IWasmModule>,
}

/** @see {isPlayBestMoveTimeoutResult} ts-auto-guard:type-guard */
export interface PlayBestMoveTimeoutResult {
  makeMoveResult: MakeMoveResult,
  depth: number,
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

/** @see {isGetStateResult} ts-auto-guard:type-guard */
export interface GetStateResult {
  state: GameState,
  fen: string,
  inCheck: boolean,
}
