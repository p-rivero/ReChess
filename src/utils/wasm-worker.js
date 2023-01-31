
import { threads } from 'wasm-feature-detect'
import * as Comlink from 'comlink'

const PATH = '../../protochess-engine/protochess-engine-wasm/'

async function initWasm() {
  console.log('Initializing wasm')
  let wasmObject
  let supportsThreads = await threads()
  if (supportsThreads) {
    const multiThread = await import(PATH + 'pkg-parallel/protochess_engine_wasm.js')
    await multiThread.default()
    // Initialize the thread pool with the number of logical cores
    await multiThread.initThreadPool(navigator.hardwareConcurrency)
    wasmObject = await new multiThread.Protochess()
  } else {
    const singleThread = await import(PATH + 'pkg/protochess_engine_wasm.js')
    await singleThread.default()
    wasmObject = await new singleThread.Protochess()
  }

  return Comlink.proxy({
    wasmObject,
    supportsThreads
  })
}

Comlink.expose({
  wasm: initWasm()
})
