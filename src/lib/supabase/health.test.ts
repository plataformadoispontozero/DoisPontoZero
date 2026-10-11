import { describe, expect, it, vi } from 'vitest'
import { inspectHealth } from './health'

describe('operational Supabase health', () => {
  it('rejects missing schema and authorization errors instead of announcing connected', async () => {
    for (const code of ['PGRST205', '42501', 'PGRST301']) {
      const result = await inspectHealth(Promise.resolve({ error: { code, message: code } }))
      expect(result.connected).toBe(false)
      expect(result.error).toBe(code)
    }
  })
  it('accepts a successful query even when no records are returned', async () => {
    expect((await inspectHealth(Promise.resolve({ error: null }))).connected).toBe(true)
  })
  it('times out an unresponsive backend and cleans up the timer', async () => {
    vi.useFakeTimers()
    try {
      const pending = inspectHealth(new Promise<never>(() => {}), 50)
      await vi.advanceTimersByTimeAsync(50)
      expect((await pending).connected).toBe(false)
      expect(vi.getTimerCount()).toBe(0)
    } finally { vi.useRealTimers() }
  })
})
