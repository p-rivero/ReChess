import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { initializeProtochess } from './protochess/protochess'

import './assets/main.css'

const init_promise = initializeProtochess()

const app = createApp(App)

app.use(createPinia())
app.use(router)

async function mount() {
  // Wait for the wasm module to be initialized
  await init_promise
  app.mount('#app')
}
mount()
