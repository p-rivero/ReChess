
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
    async playBestMove(depth: number): Promise<MakeMoveResult> {
      return adaptMakeMoveResult(await wasm.wasmObject.playBestMove(depth))
    },
    async playBestMoveTimeout(time: number): Promise<MakeMoveResultWithDepth> {
      return adaptMakeMoveResultWithDepth(await wasm.wasmObject.playBestMoveTimeout(time))
    },
    async makeMove(move: MoveInfo): Promise<MakeMoveResult> {
      return adaptMakeMoveResult(await wasm.wasmObject.makeMove(move))
    },
    async makeMoveStr(moveStr: string): Promise<MakeMoveResult> {
      return adaptMakeMoveResult(await wasm.wasmObject.makeMoveStr(moveStr))
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
      return wasm.wasmObject.setState(state)
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

function adaptMakeMoveResult(makeMoveRes: any): MakeMoveResult {
  const result = makeMoveRes.result
  let winner: 'White' | 'Black' | undefined
  if (makeMoveRes.winnerPlayer === 0) {
    winner = 'White'
  } else if (makeMoveRes.winnerPlayer === 1) {
    winner = 'Black'
  } else {
    winner = undefined
  }
  return { result, winner }
}

function adaptMakeMoveResultWithDepth(makeMoveRes: any): MakeMoveResultWithDepth {
  const makeMoveResult = adaptMakeMoveResult(makeMoveRes.makeIoveIesult)
  const depth: number = makeMoveRes.depth
  return { ...makeMoveResult, depth }
}

function adaptMoveInfoWithEval(moveInfoEval: any): MoveInfoWithEval {
  const moveInfo: MoveInfo = moveInfoEval.moveInfo
  const evaluation: number = moveInfoEval.evaluation
  return { ...moveInfo, evaluation }
}

function adaptMoveInfoWithEvalDepth(moveInfoEval: any): MoveInfoWithEvalDepth {
  const moveInfo: MoveInfo = moveInfoEval.moveInfo
  const evaluation: number = moveInfoEval.evaluation
  const depth: number = moveInfoEval.depth
  return { ...moveInfo, evaluation, depth }
}

function adaptGameStateGui(gameStateGui: any): GameStateGui {
  const gameState: GameState = gameStateGui.state
  const fen: string = gameStateGui.fen
  const inCheck: boolean = gameStateGui.inCheck
  return { ...gameState, fen, inCheck }
}
