import { afterEach, describe, expect, it, vi } from 'vitest'
import { googleCallbackUrl, startGoogleOAuth } from './googleOAuth'
const oauth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase/client', () => ({ supabase: { auth: { signInWithOAuth: oauth } } }))
afterEach(() => { vi.unstubAllGlobals(); oauth.mockReset() })
describe('Google OAuth login', () => {
  it('returns only to same-origin login with a safe next route', () => {
    const url = new URL(googleCallbackUrl('https://example.com', '/projects/123'))
    expect(url.origin).toBe('https://example.com')
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('next')).toBe('/projects/123')
    expect(new URL(googleCallbackUrl('https://example.com', '//evil.example')).searchParams.get('next')).toBe('/dashboard')
  })
  it('does not redirect when the provider is disabled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ external: { google: false } }) }))
    await expect(startGoogleOAuth('https://example.com', '/dashboard')).rejects.toThrow('ainda não foi ativado')
    expect(oauth).not.toHaveBeenCalled()
  })
  it('starts the official provider with the validated callback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ external: { google: true } }) }))
    oauth.mockResolvedValue({ error: null })
    await startGoogleOAuth('https://example.com', '/projects')
    expect(oauth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'https://example.com/login?next=%2Fprojects', queryParams: { prompt: 'select_account' } } })
  })
  it('does not continue if provider availability cannot be checked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(startGoogleOAuth('https://example.com', '/dashboard')).rejects.toThrow('verificar')
    expect(oauth).not.toHaveBeenCalled()
  })
})
