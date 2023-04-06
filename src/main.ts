import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { plugin as VueInputAutowidth } from 'vue-input-autowidth'
import App from '@/App.vue'
import { router } from '@/router'
import { getProtochess, initializeProtochess, protochessSupportsThreads } from '@/protochess'


import '@/assets/style/background.scss'

// Don't await initializeProtochess(), since it needs to fetch a large wasm file
// and we don't want to block the app from mounting.
// Instead, getProtochess() will wait for the wasm module to be initialized.
initializeProtochess()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueInputAutowidth)

app.mount('#app')

// Temporary code until threads work as expected
protochessSupportsThreads().then(async supportsThreads => {
  if (supportsThreads) {
    const protochess = await getProtochess()
    await protochess.setNumThreads(4)
  }
})
