import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/router'
import { initializeProtochess } from '@/protochess/protochess'

import '@/assets/main.scss'

// Don't await initializeProtochess(), since it needs to fetch a large wasm file
// and we don't want to block the app from mounting.
// Instead, getProtochess() will wait for the wasm module to be initialized.
initializeProtochess()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
