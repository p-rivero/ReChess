
// PUBLIC API

export interface Protochess {
  toString(): Promise<string>,
  playerToMove(): Promise<'white' | 'black'>,
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


export type MakeMoveFlag = 'Ok' | 'IllegalMove' | 'Checkmate' | 'LeaderCaptured' | 'PieceInWinSquare' | 'CheckLimit' | 'Stalemate' | 'Repetition';
export type MakeMoveWinner = 'White' | 'Black' | 'None';
export interface MakeMoveResult {
  flag: MakeMoveFlag,
  winner: MakeMoveWinner,
  exploded: [number, number][],
}
export interface MakeMoveResultWithDepth extends MakeMoveResult {
  depth: number,
}

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
  variantDisplayName?: string,
  variantDescription?: string,
}
/** @see {isGameStateGui} ts-auto-guard:type-guard */
export interface GameStateGui extends GameState {
  fen: string,
  inCheck: boolean,
}

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
  supportsThreads: boolean,
  wasmObject: {
    toString(): Promise<any>,
    playerToMove(): Promise<any>,
    validatePosition(): Promise<any>,
    playBestMove(depth: number): Promise<any>,
    playBestMoveTimeout(time: number): Promise<any>,
    makeMove(move: MoveInfo): Promise<any>,
    makeMoveStr(moveStr: string): Promise<any>,
    getBestMove(depth: number): Promise<any>,
    getBestMoveTimeout(time: number): Promise<any>,
    toMoveInCheck(): Promise<any>,
    setState(state: GameState): Promise<any>,
    getState(): Promise<any>,
    loadFen(fen: string): Promise<any>,
    movesFrom(x: number, y: number): Promise<any>,
    legalMoves(): Promise<any>,
    possiblePromotions(fromX: number, fromY: number, toX: number, toY: number): Promise<any>,
    getMaxThreads(): Promise<any>,
    setNumThreads(threads: number): Promise<any>,
  }
}
