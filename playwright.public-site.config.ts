import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: "public-site.spec.ts",
  workers: 2,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/public-site-results.json" }],
  ],
  outputDir: "test-results/public-site",
  use: { baseURL: "http://127.0.0.1:4177", screenshot: "only-on-failure" },
  webServer: {
    command:
      "VITE_PUBLIC_SITE_PREVIEW=true VITE_SUPABASE_URL=https://audit-auth.supabase.co VITE_SUPABASE_ANON_KEY=sb_publishable_audit_only VITE_ENABLE_LOCAL_DEMO=false npm run build -- --outDir dist-public-test && npm run preview -- --outDir dist-public-test --host 127.0.0.1 --port 4177 --strictPort",
    url: "http://127.0.0.1:4177",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
