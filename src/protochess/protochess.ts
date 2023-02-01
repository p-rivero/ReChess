
import * as Comlink from 'comlink'
import {
  Protochess,
  MakeMoveResult,
  MakeMoveResultWithDepth,
  MoveInfo,
  MoveInfoWithEval,
  MoveInfoWithEvalDepth,
  IWasmModule
} from "./interfaces"

// Call this at the start of the app to initialize the wasm module
let protochess: Protochess | null = null
export async function initializeProtochess() {
  protochess = await init()
}
// Use this to get a reference to the protochess object
export function getProtochess(): Protochess {
  if (protochess === null) {
    throw new Error('Protochess not initialized, make sure to call initializeProtochess() first')
  }
  return protochess
}



async function init(): Promise<Protochess> {
  // Create a separate thread from wasm-worker.js and get a proxy to its handler
  const WasmModule = Comlink.wrap(new Worker(new URL('./wasm-worker.js', import.meta.url), { type: 'module' }))
  // wasm is an object that lives in the worker thread, but appears to be local
  const wasm: IWasmModule = await new WasmModule()
  await wasm.init()
  
  if (await wasm.supportsThreads) {
    console.info('WebAssembly supports threads, using multi-threaded version')
  } else {
    console.warn('WebAssembly does not support threads, using single-threaded version')
  }
  
  return {
    async toString(): Promise<string> {
      return wasm.wasmObject.to_string()
    },
    async playBestMove(): Promise<MakeMoveResult> {
      return adaptMakeMoveResult(await wasm.wasmObject.play_best_move())
    },
    async playBestMoveTimeout(time: number): Promise<MakeMoveResultWithDepth> {
      return adaptMakeMoveResultWithDepth(await wasm.wasmObject.play_best_move_timeout(time))
    },
    async makeMove(move: MoveInfo): Promise<MakeMoveResult> {
      return adaptMakeMoveResult(await wasm.wasmObject.make_move(move))
    },
    async makeMoveStr(move_str: string): Promise<MakeMoveResult> {
      return adaptMakeMoveResult(await wasm.wasmObject.make_move_str(move_str))
    },
    async getBestMove(depth: number): Promise<MoveInfoWithEval> {
      return adaptMoveInfoWithEval(await wasm.wasmObject.get_best_move(depth))
    },
    async getBestMoveTimeout(time: number): Promise<MoveInfoWithEvalDepth> {
      return adaptMoveInfoWithEvalDepth(await wasm.wasmObject.get_best_move_timeout(time))
    },
    async isInCheck(): Promise<boolean> {
      return wasm.wasmObject.to_move_in_check()
    },
    async setState(state: string): Promise<void> {
      return wasm.wasmObject.set_state(state)
    },
    async loadFen(fen: string): Promise<void> {
      return wasm.wasmObject.load_fen(fen)
    },
    async movesFrom(x: number, y: number): Promise<MoveInfo[]> {
      return wasm.wasmObject.moves_from(x, y)
    },
    async getMaxThreads(): Promise<number> {
      return wasm.wasmObject.get_max_threads()
    },
    async setNumThreads(threads: number): Promise<void> {
      return wasm.wasmObject.set_num_threads(threads)
    },
  }
}


// ADAPTERS

function adaptMakeMoveResult(makeMoveRes: any): MakeMoveResult {
  const result = makeMoveRes.result
  let winner: 'White' | 'Black' | undefined
  if (makeMoveRes.winner_player === 0) {
    winner = 'White'
  } else if (makeMoveRes.winner_player === 1) {
    winner = 'Black'
  } else {
    winner = undefined
  }
  return { result, winner }
}

function adaptMakeMoveResultWithDepth(makeMoveRes: any): MakeMoveResultWithDepth {
  const makeMoveResult = adaptMakeMoveResult(makeMoveRes.make_move_result)
  const depth: number = makeMoveRes.depth
  return { ...makeMoveResult, depth }
}

function adaptMoveInfoWithEval(moveInfoEval: any): MoveInfoWithEval {
  const moveInfo: MoveInfo = moveInfoEval.move_info
  const evaluation: number = moveInfoEval.evaluation
  return { ...moveInfo, evaluation }
}

function adaptMoveInfoWithEvalDepth(moveInfoEval: any): MoveInfoWithEvalDepth {
  const moveInfo: MoveInfo = moveInfoEval.move_info
  const evaluation: number = moveInfoEval.evaluation
  const depth: number = moveInfoEval.depth
  return { ...moveInfo, evaluation, depth }
}
