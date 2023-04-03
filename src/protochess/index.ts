
import { clone } from '@/utils/ts-utils'
import * as Comlink from 'comlink'
import type * as t from './types'
import * as guard from './types.guard'
import type { MoveInfo } from './types'

// Call this at the start of the app to initialize the wasm module
let protochess: t.Protochess | null = null
let supportsThreads: boolean | undefined = undefined
export async function initializeProtochess() {
  protochess = await init()
}
// Use this to get a reference to the protochess object
export async function getProtochess(): Promise<t.Protochess> {
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



async function init(): Promise<t.Protochess> {
  // Create a separate thread from wasm-worker.js and get a proxy to its handler
  const WasmModule = Comlink.wrap(new Worker(new URL('./wasm-worker.js', import.meta.url), { type: 'module' })) as unknown as t.IWasmModuleConstructor
  // WasmModule is a proxy to a class, so it's constructable even though tsc disagrees
  const wasm: t.IWasmModule = await new WasmModule()
  // wasm is an object that lives in the worker thread, but appears to be local
  await wasm.init()
  
  supportsThreads = await wasm.supportsThreads
  if (supportsThreads) {
    console.info('WebAssembly supports threads, using multi-threaded version')
  } else {
    console.warn('WebAssembly does not support threads, using single-threaded version')
  }
  
  return {
    async toString(): Promise<string> {
      const str = await wasm.wasmObject.toString()
      if (typeof str !== 'string') {
        throw new Error(`Expected string, got ${str}`)
      }
      return str
    },
    
    async playerToMove(): Promise<t.Player> {
      const player = await wasm.wasmObject.playerToMove()
      if (typeof player !== 'number' || !(player === 0 || player === 1)) {
        throw new Error(`Expected 0 or 1, got ${player}`)
      }
      return player === 0 ? 'white' : 'black'
    },
    
    async validatePosition(): Promise<void> {
      const ret = await wasm.wasmObject.validatePosition()
      if (typeof ret !== 'undefined') {
        throw new Error(`Unexpected return value: ${ret}`)
      }
    },
    
    async makeMove(move: t.MoveInfo): Promise<t.MakeMoveResult> {
      const result = await wasm.wasmObject.makeMove(move)
      if (!guard.isMakeMoveResult(result)) {
        throw new Error(`Expected MakeMoveResult, got ${result}`)
      }
      return result
    },
    
    async makeMoveStr(moveStr: string): Promise<t.MakeMoveResult> {
      const result = await wasm.wasmObject.makeMoveStr(moveStr)
      if (!guard.isMakeMoveResult(result)) {
        throw new Error(`Expected MakeMoveResult, got ${result}`)
      }
      return result
    },
    
    async getBestMove(depth: number): Promise<t.MoveInfoWithEval> {
      const result = await wasm.wasmObject.getBestMove(depth)
      if (!guard.isGetBestMoveResult(result)) {
        throw new Error(`Expected GetBestMoveResult, got ${result}`)
      }
      return adaptMoveInfoWithEval(result)
    },
    
    async getBestMoveTimeout(time: number): Promise<t.MoveInfoWithEvalDepth> {
      const result = await wasm.wasmObject.getBestMoveTimeout(time)
      if (!guard.isGetBestMoveTimeoutResult(result)) {
        throw new Error(`Expected PlayBestMoveTimeoutResult, got ${result}`)
      }
      const moveEval = adaptMoveInfoWithEval(result)
      return { ...moveEval, depth: result.depth }
    },
    
    async setState(state: t.GameState2): Promise<t.StateDiff> {
      // Clone the state object manually to avoid errors when passing it to wasm
      const stateClone = clone(state)
      const ret = await wasm.wasmObject.setState(stateClone)
      if (!guard.isStateDiff(ret)) {
        throw new Error(`Expected StateDiff, got ${ret}`)
      }
      return ret
    },
    
    async loadFen(fen: string): Promise<void> {
      const ret = await wasm.wasmObject.loadFen(fen)
      if (typeof ret !== 'undefined') {
        throw new Error(`Unexpected return value: ${ret}`)
      }
    },
    
    async getState(): Promise<t.GameState2> {
      const result = await wasm.wasmObject.getState()
      if (!guard.isGameState2(result)) {
        throw new Error(`Expected GetStateResult, got ${result}`)
      }
      return result
    },
    
    async getStateDiff(): Promise<t.StateDiff> {
      const result = await wasm.wasmObject.getStateDiff()
      if (!guard.isStateDiff(result)) {
        throw new Error(`Expected StateDiff, got ${result}`)
      }
      return result
    },
    
    async legalMoves(): Promise<t.MoveList[]> {
      const moves = await wasm.wasmObject.legalMoves()
      if (!Array.isArray(moves) || !moves.every(guard.isMoveList)) {
        throw new Error(`Expected array, got ${moves}`)
      }
      return moves
    },
    
    async possiblePromotions(move: MoveInfo): Promise<string[]> {
      const promotions = await wasm.wasmObject.possiblePromotions(move)
      if (!Array.isArray(promotions) || !promotions.every(e => typeof e === 'string')) {
        throw new Error(`Expected array, got ${promotions}`)
      }
      return promotions
    },
    
    async getMaxThreads(): Promise<number> {
      const maxThreads = await wasm.wasmObject.getMaxThreads()
      if (typeof maxThreads !== 'number') {
        throw new Error(`Expected number, got ${maxThreads}`)
      }
      return maxThreads
    },
    
    async setNumThreads(threads: number): Promise<void> {
      const ret = await wasm.wasmObject.setNumThreads(threads)
      if (typeof ret !== 'undefined') {
        throw new Error(`Unexpected return value: ${ret}`)
      }
    },
  }
}


function adaptMoveInfoWithEval(moveInfoEval: t.GetBestMoveResult): t.MoveInfoWithEval {
  // Engine constants
  const MATE_VALUE = 1_000_000
  const MAX_DEPTH = 256 // Actually 127, but this is a safe upper bound
  
  const moveInfo: MoveInfo = moveInfoEval.moveInfo
  const evalNumeric: number = moveInfoEval.evaluation
  // Depth in ply of a possible mate
  const mateDepth = MATE_VALUE - Math.abs(evalNumeric) + 1
  const multiplier = evalNumeric < 0 ? -1 : 1
  // Possible mate in n moves (negative if engine is losing)
  const mate = multiplier * Math.floor(mateDepth / 2)
  // If this is mate (mateDepth < MAX_DEPTH), return a string like "MATE 5"
  const evaluation: number | `#${number}` = mateDepth < MAX_DEPTH ? `#${mate}` : evalNumeric
  
  return { ...moveInfo, evaluation }
}

