
// PUBLIC API

export interface Protochess {
  toString(): Promise<string>,
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


export interface MakeMoveResult {
  flag:
    'Ok' |
    'IllegalMove' |
    'Checkmate' |
    'LeaderCaptured' |
    'PieceInWinSquare' |
    'CheckLimit' |
    'Stalemate' |
    'Repetition',
  winner: 'White' | 'Black' | 'None',
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
  evaluation: number | `MATE ${number}`,
}
export interface MoveInfoWithEvalDepth extends MoveInfoWithEval {
  depth: number,
}
export interface MoveList {
  x: number,
  y: number,
  moves: MoveInfo[],
}

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
export interface GameStateGui extends GameState {
  fen: string,
  inCheck: boolean,
}

export interface PieceDefinition {
  id: string,
  availableFor: (0 | 1)[],
  isLeader: boolean,
  castleFiles?: [number, number],
  isCastleRook: boolean,
  explodes: boolean,
  explosionDeltas: [number, number][],
  immuneToExplosion: boolean,
  promotionSquares: [number, number][],
  promoVals: string[],
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

export interface PiecePlacement {
  owner: 0 | 1,
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
