import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      // Optimize React for production
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: ['@babel/plugin-transform-runtime']
      }
    }),
    crx({ manifest })
  ],
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.tsx'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        onboarding: resolve(__dirname, 'src/onboarding/index.html')
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ethers-vendor': ['ethers'],
        }
      }
    }
  },
  base: './',
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'ethers']
  }
}) 