import { plugin as VueInputAutowidth } from 'vue-input-autowidth'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { getProtochess, initializeProtochess, protochessSupportsThreads } from '@/protochess'
import { router } from '@/router'
import App from '@/App.vue'


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
    await getProtochess('ui').then(p => p.setNumThreads(1))
    await getProtochess('search').then(p => p.setNumThreads(4))
  }
})


// Preload heart-fill.svg to avoid broken animation on first click
import('@/assets/icons/heart-fill.svg').then(url => new Image().src = url.default)
