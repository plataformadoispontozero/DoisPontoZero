import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

vi.stubEnv('VITE_ENABLE_LOCAL_DEMO', 'true')
vi.stubEnv('VITE_SUPABASE_URL', '')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')

afterEach(() => {
  cleanup()
})
