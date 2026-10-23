import { useCallback, useSyncExternalStore } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import type { ThemeMode } from '@/types/whitelabel'

export type PersonalTheme = ThemeMode | 'workspace'
const changed = 'doiszero:personal-theme'
const isMode = (value: string | null): value is ThemeMode => value === 'dark' || value === 'light' || value === 'system'

/** A device preference scoped to the signed-in member, never an agency-wide write. */
export function usePersonalTheme() {
  const { user } = useAuth()
  const key = user?.id ? `doiszero_theme_${user.id}` : 'doiszero_theme_demo'
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) notify() }
    window.addEventListener('storage', onStorage)
    window.addEventListener(changed, notify)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(changed, notify) }
  }, [key])
  const snapshot = useCallback((): PersonalTheme => {
    try { const value = localStorage.getItem(key); return isMode(value) ? value : 'workspace' }
    catch { return 'workspace' }
  }, [key])
  const preference = useSyncExternalStore(subscribe, snapshot, () => 'workspace' as PersonalTheme)
  const setPreference = useCallback((mode: PersonalTheme) => {
    try {
      if (mode === 'workspace') localStorage.removeItem(key)
      else localStorage.setItem(key, mode)
      window.dispatchEvent(new Event(changed))
      return true
    } catch { return false }
  }, [key])
  return { preference, setPreference }
}
