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
  // Fix: @react-pdf/renderer v4 requires explicit optimizeDeps config in Vite
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
    exclude: [],
  },
  server: {
    host: true, // Aceita conexões na rede local
    port: 5173,
    strictPort: false,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        // Keep shared React/runtime modules separate. Let Rolldown place the PDF dependency
        // graph together: splitting only @react-pdf packages creates cycles with
        // pdfkit/fontkit dependencies hoisted into application PDF components.
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            { name: 'vendor-react', test: /node_modules\/(react|react-dom|scheduler)\//, priority: 80 },
            { name: 'vendor-supabase', test: /node_modules\/@supabase\//, priority: 60 },
            { name: 'vendor-tanstack', test: /node_modules\/@tanstack\//, priority: 60 },
            { name: 'vendor-dnd', test: /node_modules\/@dnd-kit\//, priority: 60 },
            { name: 'vendor-icons', test: /node_modules\/lucide-react\//, priority: 60 },
          ],
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
