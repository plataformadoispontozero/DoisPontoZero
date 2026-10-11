import { defineConfig } from '@playwright/test'
import base from './playwright.config'
export default defineConfig({
  ...base, testMatch: 'agency-access.spec.ts', workers: 2,
  reporter: [['list'], ['json', { outputFile: 'test-results/agency-results.json' }]],
  outputDir: 'test-results/agency',
  use: { baseURL: 'http://127.0.0.1:4176', screenshot: 'only-on-failure' },
  webServer: {
    command: 'VITE_SUPABASE_URL=https://audit-auth.supabase.co VITE_SUPABASE_ANON_KEY=sb_publishable_audit_only VITE_ENABLE_LOCAL_DEMO=false npm run build -- --outDir dist-auth-test && npm run preview -- --outDir dist-auth-test --host 127.0.0.1 --port 4176 --strictPort',
    url: 'http://127.0.0.1:4176', reuseExistingServer: false, timeout: 120000,
  },
})
