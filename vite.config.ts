import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Aceita conexões na rede local
    port: 5173,
    strictPort: false,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@react-pdf/renderer')) {
            return 'vendor-pdf'
          }
          if (id.includes('@supabase/')) {
            return 'vendor-supabase'
          }
          if (id.includes('@tanstack/')) {
            return 'vendor-tanstack'
          }
          if (id.includes('@dnd-kit/')) {
            return 'vendor-dnd'
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }
        },
      },
    },
  },
  // @ts-expect-error vitest config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
