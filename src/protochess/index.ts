
import { clone } from '@/utils/ts-utils'
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
  Player,
  GetBestMoveResult,
} from './types'
import {
  isMakeMoveResult,
  isMoveInfo,
  isMoveList,
  isPlayBestMoveTimeoutResult,
  isGetBestMoveResult,
  isGetBestMoveTimeoutResult,
  isGetStateResult,
} from './types.guard'

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
    
    async playerToMove(): Promise<Player> {
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
    
    async playBestMove(depth: number): Promise<MakeMoveResult> {
      const result = await wasm.wasmObject.playBestMove(depth)
      if (!isMakeMoveResult(result)) {
        throw new Error(`Expected MakeMoveResult, got ${result}`)
      }
      return result
    },
    
    async playBestMoveTimeout(time: number): Promise<MakeMoveResultWithDepth> {
      const result = await wasm.wasmObject.playBestMoveTimeout(time)
      if (!isPlayBestMoveTimeoutResult(result)) {
        throw new Error(`Expected MakeMoveResultWithDepth, got ${result}`)
      }
      return { ...result.makeMoveResult, depth: result.depth }
    },
    
    async makeMove(move: MoveInfo): Promise<MakeMoveResult> {
      const result = await wasm.wasmObject.makeMove(move)
      if (!isMakeMoveResult(result)) {
        throw new Error(`Expected MakeMoveResult, got ${result}`)
      }
      return result
    },
    
    async makeMoveStr(moveStr: string): Promise<MakeMoveResult> {
      const result = await wasm.wasmObject.makeMoveStr(moveStr)
      if (!isMakeMoveResult(result)) {
        throw new Error(`Expected MakeMoveResult, got ${result}`)
      }
      return result
    },
    
    async getBestMove(depth: number): Promise<MoveInfoWithEval> {
      const result = await wasm.wasmObject.getBestMove(depth)
      if (!isGetBestMoveResult(result)) {
        throw new Error(`Expected GetBestMoveResult, got ${result}`)
      }
      return adaptMoveInfoWithEval(result)
    },
    
    async getBestMoveTimeout(time: number): Promise<MoveInfoWithEvalDepth> {
      const result = await wasm.wasmObject.getBestMoveTimeout(time)
      if (!isGetBestMoveTimeoutResult(result)) {
        throw new Error(`Expected PlayBestMoveTimeoutResult, got ${result}`)
      }
      const moveEval = adaptMoveInfoWithEval(result)
      return { ...moveEval, depth: result.depth }
    },
    
    async isInCheck(): Promise<boolean> {
      const ret = await wasm.wasmObject.toMoveInCheck()
      if (typeof ret !== 'boolean') {
        throw new Error(`Expected boolean, got ${ret}`)
      }
      return ret
    },
    
    async setState(state: GameState): Promise<void> {
      // Clone the state object manually to avoid errors when passing it to wasm
      const stateClone = clone(state)
      const ret = await wasm.wasmObject.setState(stateClone)
      if (typeof ret !== 'undefined') {
        throw new Error(`Unexpected return value: ${ret}`)
      }
    },
    
    async getState(): Promise<GameStateGui> {
      const result = await wasm.wasmObject.getState()
      if (!isGetStateResult(result)) {
        throw new Error(`Expected GetStateResult, got ${result}`)
      }
      return { ...result.state, fen: result.fen, inCheck: result.inCheck }
    },
    
    async loadFen(fen: string): Promise<void> {
      const ret = await wasm.wasmObject.loadFen(fen)
      if (typeof ret !== 'undefined') {
        throw new Error(`Unexpected return value: ${ret}`)
      }
    },
    
    async movesFrom(x: number, y: number): Promise<MoveInfo[]> {
      const moves = await wasm.wasmObject.movesFrom(x, y)
      if (!Array.isArray(moves) || !moves.every(isMoveInfo)) {
        throw new Error(`Expected array, got ${moves}`)
      }
      return moves
    },
    
    async legalMoves(): Promise<MoveList[]> {
      const moves = await wasm.wasmObject.legalMoves()
      if (!Array.isArray(moves) || !moves.every(isMoveList)) {
        throw new Error(`Expected array, got ${moves}`)
      }
      return moves
    },
    
    async possiblePromotions(fromX: number, fromY: number, toX: number, toY: number): Promise<string[]> {
      const promotions = await wasm.wasmObject.possiblePromotions(fromX, fromY, toX, toY)
      if (!isStringArray(promotions)) {
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


function adaptMoveInfoWithEval(moveInfoEval: GetBestMoveResult): MoveInfoWithEval {
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

function isStringArray(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.every(e => typeof e === 'string')
}
