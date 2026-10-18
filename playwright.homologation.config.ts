import {defineConfig} from '@playwright/test'
// All selected specs explicitly intercept the controlled Supabase origin.
export default defineConfig({
 testDir:'./e2e',
 testMatch:['agency-access.spec.ts','platform-readiness.spec.ts','aurora-workflow.spec.ts','profile-squads.spec.ts','editorial-profile.spec.ts','demand-drive-files.spec.ts','native-briefing-pilot.spec.ts','presentation-preview.spec.ts','public-site.spec.ts'],
 timeout:60000,expect:{timeout:15000},workers:2,retries:0,fullyParallel:false,
 reporter:[['list'],['json',{outputFile:process.env.PLATFORM_REPORT_PATH||'/private/tmp/doiszero-platform-browser.json'}]],
 outputDir:'/private/tmp/doiszero-platform-browser-results',
 use:{baseURL:'http://127.0.0.1:4194',browserName:'chromium',channel:'chrome',trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:900}}},{name:'tablet',use:{viewport:{width:768,height:1024}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}],
 webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4194 --strictPort',url:'http://127.0.0.1:4194',reuseExistingServer:false,timeout:120000,env:{VITE_SUPABASE_URL:'https://audit-auth.supabase.co',VITE_SUPABASE_ANON_KEY:'sb_publishable_audit_only',VITE_ENABLE_LOCAL_DEMO:'false',VITE_ENABLE_DIGITAL_OFFICE:'false'}}
})
