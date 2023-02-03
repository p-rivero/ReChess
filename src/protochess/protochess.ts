
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
} from "./interfaces"

// Call this at the start of the app to initialize the wasm module
let protochess: Protochess | null = null
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



async function init(): Promise<Protochess> {
  // Create a separate thread from wasm-worker.js and get a proxy to its handler
  const WasmModule = Comlink.wrap(new Worker(new URL('./wasm-worker.js', import.meta.url), { type: 'module' }))
  // WasmModule is a proxy to a class, so it's constructable even though tsc disagrees
  // @ts-ignore
  const wasm: IWasmModule = await new WasmModule()
  // wasm is an object that lives in the worker thread, but appears to be local
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
    async setState(state: GameState): Promise<void> {
      return wasm.wasmObject.set_state(state)
    },
    async getState(): Promise<GameState> {
      return wasm.wasmObject.get_state()
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
