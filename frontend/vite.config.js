import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    host: true,
    open: true,
  },
  build: {
    outDir: path.resolve(__dirname, '../backend/dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    },
    cssCodeSplit: false,
    assetsInlineLimit: 100000000
  }
})
