import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        'lottie': resolve(__dirname, 'lottie.html'),
        'lottie-zip': resolve(__dirname, 'lottie-zip.html')
      },
      output: {
        entryFileNames: 'viewer/[name].js',
        chunkFileNames: 'viewer/chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'viewer/[name][extname]'
          }
          return 'assets/[name][extname]'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  base: './'
})
