
import { threads } from 'wasm-feature-detect'
import * as Comlink from 'comlink'
import * as singleThread from 'protochess-singlethread'
import * as multiThread from 'protochess-multithread'

class WasmModule {
  async init() {
    this.supportsThreads = await threads()
    if (this.supportsThreads) {
      await multiThread.default()
      // Initialize the thread pool with the number of logical cores
      await multiThread.initThreadPool(navigator.hardwareConcurrency)
      this.wasmObject = new multiThread.Protochess()
    } else {
      await singleThread.default()
      this.wasmObject = new singleThread.Protochess()
    }
  }
}

Comlink.expose(WasmModule)
