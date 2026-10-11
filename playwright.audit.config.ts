import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// Dedicated production preview: never reuse a server from another checkout.
export default defineConfig({
  ...base,
  testIgnore: 'agency-access.spec.ts',
  workers: 2,
  reporter: [['list'], ['json', { outputFile: 'test-results/audit-results.json' }]],
  outputDir: 'test-results/audit',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4175', screenshot: 'only-on-failure' },
  webServer: {
    command: 'VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= VITE_SUPABASE_PUBLISHABLE_KEY= VITE_ENABLE_LOCAL_DEMO=true npm run build -- --outDir dist-demo-test && npm run preview -- --outDir dist-demo-test --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
})
