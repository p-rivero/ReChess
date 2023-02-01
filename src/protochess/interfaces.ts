
// PUBLIC API

export interface Protochess {
  toString(): Promise<string>,
  playBestMove(): Promise<MakeMoveResult>,
  playBestMoveTimeout(time: number): Promise<MakeMoveResultWithDepth>,
  makeMove(move: MoveInfo): Promise<MakeMoveResult>,
  makeMoveStr(move: string): Promise<MakeMoveResult>,
  getBestMove(depth: number): Promise<MoveInfoWithEval>,
  getBestMoveTimeout(time: number): Promise<MoveInfoWithEvalDepth>,
  isInCheck(): Promise<boolean>,
  // TODO: Add state interface
  setState(state: string): Promise<void>,
  loadFen(fen: string): Promise<void>,
  movesFrom(x: number, y: number): Promise<MoveInfo[]>,
  getMaxThreads(): Promise<number>,
  setNumThreads(threads: number): Promise<void>,
}


export interface MakeMoveResult {
  result:
    'Ok' |
    'IllegalMove' |
    'Checkmate' |
    'LeaderCaptured' |
    'PieceInWinSquare' |
    'CheckLimit' |
    'Stalemate' |
    'Repetition',
  winner?: 'White' | 'Black',
}
export interface MakeMoveResultWithDepth extends MakeMoveResult {
  depth: number,
}

export interface MoveInfo {
  // x, y coordinates between 0 and 15
  // (0, 0 is the bottom left corner)
  from: [number, number],
  to: [number, number],
  promotion?: number,
}
export interface MoveInfoWithEval extends MoveInfo {
  evaluation: number,
}
export interface MoveInfoWithEvalDepth extends MoveInfoWithEval {
  depth: number,
}

export interface GameState {
  pieceTypes: PieceDefinition[],
  validSquares: [number, number][],
  pieces: PiecePlacement[],
  playerToMove: 0 | 1,
  epSquareAndVictim?: [[number, number], [number, number]],
  timesInCheck?: [number, number],
  globalRules: GlobalRules,
}

export interface PieceDefinition {
  id: number,
  charRep: string,
  availableFor: (0 | 1)[],
  isLeader: boolean,
  castleFiles?: [number, number],
  isCastleRook: boolean,
  explodes: boolean,
  explosionDeltas: [number, number][],
  immuneToExplosion: boolean,
  promotionSquares: [number, number][],
  promoVals: number[],
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
  pieceId: number,
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
    to_string(): Promise<string>,
    play_best_move(): Promise<MakeMoveResult>,
    play_best_move_timeout(time: number): Promise<MakeMoveResultWithDepth>,
    make_move(move: MoveInfo): Promise<MakeMoveResult>,
    make_move_str(move: string): Promise<MakeMoveResult>,
    get_best_move(depth: number): Promise<MoveInfoWithEval>,
    get_best_move_timeout(time: number): Promise<MoveInfoWithEvalDepth>,
    to_move_in_check(): Promise<boolean>,
    set_state(state: string): Promise<void>,
    load_fen(fen: string): Promise<void>,
    moves_from(x: number, y: number): Promise<MoveInfo[]>,
    get_max_threads(): Promise<number>,
    set_num_threads(threads: number): Promise<void>,
  }
}
