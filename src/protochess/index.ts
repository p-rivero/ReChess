
import { clone } from '@/utils/ts-utils'
import * as Comlink from 'comlink'
import type * as t from './types'
import * as guard from './types.guard'
import type { MoveInfo } from './types'

// Call this at the start of the app to initialize the wasm module
let protochess: t.Protochess | null = null
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



async function init(): Promise<t.Protochess> {
  // Create a separate thread from wasm-worker.js and get a proxy to its handler
  const WasmModule = Comlink.wrap(new Worker(new URL('./wasm-worker.js', import.meta.url), { type: 'module' })) as unknown as t.IWasmModuleConstructor
  // WasmModule is a proxy to a class, so it's constructable even though tsc disagrees
  const wasm: t.IWasmModule = await new WasmModule()
  // wasm is an object that lives in the worker thread, but appears to be local
  await wasm.init()
  
  const supportsThreads = await wasm.supportsThreads
  if (supportsThreads) {
    console.info('WebAssembly supports threads, using multi-threaded version')
  } else {
    console.warn('WebAssembly does not support threads, using single-threaded version')
  }
  
  const protochessMemory = new Uint8Array(await wasm.memoryBuffer)
  const stopFlagPtr = await wasm.wasmObject.getStopFlagPtr()
  const mvFromPtr = await wasm.wasmObject.getMvFromPtr()
  const mvToPtr = await wasm.wasmObject.getMvToPtr()
  const mvPromoPtr = await wasm.wasmObject.getMvPromoPtr()
  const scorePtr = await wasm.wasmObject.getScorePtr()
  const depthPtr = await wasm.wasmObject.getDepthPtr()
  
  if (typeof stopFlagPtr !== 'number') throw new Error(`Incorrect stopFlagPtr: ${stopFlagPtr}`)
  if (typeof mvFromPtr !== 'number') throw new Error(`Incorrect mvFromPtr: ${mvFromPtr}`)
  if (typeof mvToPtr !== 'number') throw new Error(`Incorrect mvToPtr: ${mvToPtr}`)
  if (typeof mvPromoPtr !== 'number') throw new Error(`Incorrect mvPromoPtr: ${mvPromoPtr}`)
  if (typeof scorePtr !== 'number') throw new Error(`Incorrect scorePtr: ${scorePtr}`)
  if (typeof depthPtr !== 'number') throw new Error(`Incorrect depthPtr: ${depthPtr}`)
  
  const getCurrentResult = () => {
    const from = readU8Pair(mvFromPtr)
    const to = readU8Pair(mvToPtr)
    const promotion = readOptionalChar(mvPromoPtr)
    const evaluation = readI32(scorePtr)
    const depth = readU8(depthPtr)
    return { from, to, promotion, evaluation, depth }
  }
  const stopSearch = () => {
    console.log('Stopping search')
    protochessMemory[stopFlagPtr] = 1
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
    
    async getBestMove(depth: number, callback?: t.SearchCallback, callbackPeriodMs = 100): Promise<t.SearchResult> {
      // Call the callback periodically while the search is running
      const interval = setInterval(() => callback?.(getCurrentResult()), callbackPeriodMs)
      const result = await wasm.wasmObject.getBestMove(depth)
      clearInterval(interval)
      if (!guard.isMoveInfoWithEvalDepth2(result)) {
        throw new Error(`Expected GetBestMoveResult, got ${result}`)
      }
      return flattenSearchResult(result)
    },
    
    async getBestMoveTimeout(timeout?: number, callback?: t.SearchCallback, callbackPeriodMs = 100): Promise<t.SearchResult> {
      // Call the callback periodically while the search is running
      const interval = setInterval(() => callback?.(getCurrentResult()), callbackPeriodMs)
      // Stop searching after the timeout, if specified
      if (timeout) setTimeout(stopSearch, timeout)
      // Start the search
      const result = await wasm.wasmObject.getBestMoveTimeout()
      clearInterval(interval)
      if (!guard.isMoveInfoWithEvalDepth2(result)) {
        throw new Error(`Expected PlayBestMoveTimeoutResult, got ${result}`)
      }
      return flattenSearchResult(result)
    },
    
    async setState(state: t.GameState): Promise<t.MakeMoveResult> {
      const stateCopy = clone(state)
      const result = await wasm.wasmObject.setState(stateCopy)
      if (!guard.isMakeMoveResult(result)) {
        throw new Error(`Expected MakeMoveResult, got ${result}`)
      }
      return result
    },
    
    async loadFen(fen: string): Promise<void> {
      const ret = await wasm.wasmObject.loadFen(fen)
      if (typeof ret !== 'undefined') {
        throw new Error(`Unexpected return value: ${ret}`)
      }
    },
    
    async getState(): Promise<t.GameState> {
      const result = await wasm.wasmObject.getState()
      if (!guard.isGameState(result)) {
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
    
    async possiblePromotions(from: [number, number], to: [number, number]): Promise<string[]> {
      const promotions = await wasm.wasmObject.possiblePromotions(from[0], from[1], to[0], to[1])
      if (!Array.isArray(promotions) || !promotions.every(e => typeof e === 'string')) {
        throw new Error(`Expected array, got ${promotions}`)
      }
      return promotions
    },
    
    
    isMultiThreaded(): boolean {
      return supportsThreads
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
    
    stopSearch,
    
    getCurrentResult,
  }


  // HELPER FUNCTIONS

  function flattenSearchResult(moveInfoEval: t.MoveInfoWithEvalDepth2): t.SearchResult {
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
    
    return { ...moveInfo, evaluation, depth: moveInfoEval.depth }
  }

  // Little-endian 32-bit integer
  function readI32(ptr: number): number {
    return protochessMemory[ptr] +
      (protochessMemory[ptr + 1] << 8) +
      (protochessMemory[ptr + 2] << 16) +
      (protochessMemory[ptr + 3] << 24)
  }

  // 8-bit unsigned integer
  function readU8(ptr: number): number {
    return protochessMemory[ptr]
  }
  
  // Pair of 8-bit unsigned integers
  function readU8Pair(ptr: number): [number, number] {
    return [protochessMemory[ptr], protochessMemory[ptr + 1]]
  }
  
  // Option<char> in Rust
  function readOptionalChar(ptr: number): string | undefined {
    // Rust allocates 32 bits for chars, but unicode codepoints only go up to 0x10FFFF
    // Option<char> is also 4 bytes, and uses 0x110000 for None (MAX_UNICODE + 1)
    const MAX_UNICODE = 0x10FFFF
    const charCode = readI32(ptr)
    const isSome = charCode <= MAX_UNICODE
    // Important: use String.fromCodePoint instead of String.fromCharCode,
    // because rust chars are 32-bit, not 16-bit
    return isSome ? String.fromCodePoint(charCode) : undefined
  }
}
