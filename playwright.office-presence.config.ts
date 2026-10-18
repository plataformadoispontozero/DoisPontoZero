import {defineConfig} from '@playwright/test'
import baseline from './playwright.homologation.config'
export default defineConfig({...baseline,testMatch:['office-presence.spec.ts'],workers:1,projects:[{name:'desktop',use:{viewport:{width:1440,height:900}}}]})
