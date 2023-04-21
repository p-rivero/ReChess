import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { plugin as VueInputAutowidth } from 'vue-input-autowidth'
import App from '@/App.vue'
import { router } from '@/router'
import { getProtochess, initializeProtochess } from '@/protochess'


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
getProtochess().then(async protochess => {
  if (protochess.isMultiThreaded()) {
    await protochess.setNumThreads(4)
  }
})
