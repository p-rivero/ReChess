import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          // These headers are required for SharedArrayBuffer to work (which is required for WASM threads)
          // This only enables the headers for the vite dev server, make sure to add them to your production server as well
          // res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          // res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url))
    }
  },
  build: {
    // Needed for top-level await
    target: ['chrome89', 'firefox89', 'safari15', 'edge89', 'opera75'],
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
        }
      }
    },
  }
})
