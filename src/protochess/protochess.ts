
import * as Comlink from 'comlink'
import type {
  Protochess,
  MakeMoveResult,
  MakeMoveResultWithDepth,
  MoveInfo,
  MoveInfoWithEval,
  MoveInfoWithEvalDepth,
  IWasmModule,
  GameState,
  GameStateGui,
  MoveList,
} from "./interfaces"

// Call this at the start of the app to initialize the wasm module
let protochess: Protochess | null = null
let supportsThreads: boolean | undefined = undefined
export async function initializeProtochess() {
  protochess = await init()
}
// Use this to get a reference to the protochess object
export async function getProtochess(): Promise<Protochess> {
  // Wait for the wasm module to be initialized
  while (protochess === null) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  return protochess
}
export async function protochessSupportsThreads(): Promise<boolean> {
  // Wait for the wasm module to be initialized
  while (supportsThreads === undefined) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  return supportsThreads
}



async function init(): Promise<Protochess> {
  // Create a separate thread from wasm-worker.js and get a proxy to its handler
  const WasmModule = Comlink.wrap(new Worker(new URL('./wasm-worker.js', import.meta.url), { type: 'module' }))
  // WasmModule is a proxy to a class, so it's constructable even though tsc disagrees
  // @ts-ignore
  const wasm: IWasmModule = await new WasmModule()
  // wasm is an object that lives in the worker thread, but appears to be local
  await wasm.init()
  
  supportsThreads = wasm.supportsThreads
  if (supportsThreads) {
    console.info('WebAssembly supports threads, using multi-threaded version')
  } else {
    console.warn('WebAssembly does not support threads, using single-threaded version')
  }
  
  return {
    async toString(): Promise<string> {
      return wasm.wasmObject.toString()
    },
    async playerToMove(): Promise<'white' | 'black'> {
      const player: 0|1 = await wasm.wasmObject.playerToMove()
      return player === 0 ? 'white' : 'black'
    },
    async playBestMove(depth: number): Promise<MakeMoveResult> {
      return wasm.wasmObject.playBestMove(depth)
    },
    async playBestMoveTimeout(time: number): Promise<MakeMoveResultWithDepth> {
      return adaptMakeMoveResultWithDepth(await wasm.wasmObject.playBestMoveTimeout(time))
    },
    async makeMove(move: MoveInfo): Promise<MakeMoveResult> {
      return wasm.wasmObject.makeMove(move)
    },
    async makeMoveStr(moveStr: string): Promise<MakeMoveResult> {
      return wasm.wasmObject.makeMoveStr(moveStr)
    },
    async getBestMove(depth: number): Promise<MoveInfoWithEval> {
      return adaptMoveInfoWithEval(await wasm.wasmObject.getBestMove(depth))
    },
    async getBestMoveTimeout(time: number): Promise<MoveInfoWithEvalDepth> {
      return adaptMoveInfoWithEvalDepth(await wasm.wasmObject.getBestMoveTimeout(time))
    },
    async isInCheck(): Promise<boolean> {
      return wasm.wasmObject.toMoveInCheck()
    },
    async setState(state: GameState): Promise<void> {
      // Clone the state object manually to avoid errors when passing it to wasm
      const stateClone = JSON.parse(JSON.stringify(state))
      return wasm.wasmObject.setState(stateClone)
    },
    async getState(): Promise<GameStateGui> {
      return adaptGameStateGui(await wasm.wasmObject.getState())
    },
    async loadFen(fen: string): Promise<void> {
      return wasm.wasmObject.loadFen(fen)
    },
    async movesFrom(x: number, y: number): Promise<MoveInfo[]> {
      return wasm.wasmObject.movesFrom(x, y)
    },
    async legalMoves(): Promise<MoveList[]> {
      return wasm.wasmObject.legalMoves()
    },
    async possiblePromotions(fromX: number, fromY: number, toX: number, toY: number): Promise<string[]> {
      return wasm.wasmObject.possiblePromotions(fromX, fromY, toX, toY)
    },
    async getMaxThreads(): Promise<number> {
      return wasm.wasmObject.getMaxThreads()
    },
    async setNumThreads(threads: number): Promise<void> {
      return wasm.wasmObject.setNumThreads(threads)
    },
  }
}


// ADAPTERS

function adaptMakeMoveResultWithDepth(makeMoveRes: any): MakeMoveResultWithDepth {
  const makeMoveResult: MakeMoveResult = makeMoveRes.makeMoveResult
  const depth: number = makeMoveRes.depth
  return { ...makeMoveResult, depth }
}

function adaptMoveInfoWithEval(moveInfoEval: any): MoveInfoWithEval {
  // Engine constants
  const MATE_VALUE = 1_000_000
  const MAX_DEPTH = 256 // Actually 127, but this is a safe upper bound
  
  const moveInfo: MoveInfo = moveInfoEval.moveInfo
  const evalNumeric: number = moveInfoEval.evaluation
  // Depth in ply of a possible mate
  const mateDepth = MATE_VALUE - Math.abs(evalNumeric)
  const multiplier = evalNumeric < 0 ? -1 : 1
  // Possible mate in n moves (negative if engine is losing)
  const mate = multiplier * Math.floor(mateDepth/2)
  // If this is mate (mateDepth < MAX_DEPTH), return a string like "MATE 5"
  const evaluation: number | `#${number}` = mateDepth < MAX_DEPTH ? `#${mate}` : evalNumeric
  
  return { ...moveInfo, evaluation }
}

function adaptMoveInfoWithEvalDepth(moveInfoEval: any): MoveInfoWithEvalDepth {
  const moveEval: MoveInfoWithEval = adaptMoveInfoWithEval(moveInfoEval)
  const depth: number = moveInfoEval.depth
  return { ...moveEval, depth }
}

function adaptGameStateGui(gameStateGui: any): GameStateGui {
  const gameState: GameState = gameStateGui.state
  const fen: string = gameStateGui.fen
  const inCheck: boolean = gameStateGui.inCheck
  return { ...gameState, fen, inCheck }
}
