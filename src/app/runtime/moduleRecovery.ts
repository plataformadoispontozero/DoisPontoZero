const RECOVERY_KEY = 'doiszero:module-recovery-at'
export const RECOVERY_WINDOW_MS = 90_000
export function isModuleLoadError(error: unknown): boolean {
  const message = typeof error === 'string' ? error : error && typeof error === 'object' && 'message' in error ? String(error.message) : ''
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .+ failed|Unable to preload CSS/i.test(message)
}
interface RecoveryEnvironment {
  storage: Pick<Storage, 'getItem' | 'setItem'>
  reload: () => void
  online: boolean
  now: () => number
}
/** One recovery attempt per tab/time window; never clear session or application data. */
export function recoverModuleLoad(error: unknown, environment?: RecoveryEnvironment): boolean {
  if (!isModuleLoadError(error)) return false
  try {
    const env = environment ?? {storage: window.sessionStorage, reload: () => window.location.reload(), online: navigator.onLine, now: Date.now}
    if (!env.online) return false
    const now = env.now(), previous = Number(env.storage.getItem(RECOVERY_KEY))
    if (previous > 0 && now - previous < RECOVERY_WINDOW_MS) return false
    env.storage.setItem(RECOVERY_KEY, String(now))
    env.reload()
    return true
  } catch { return false }
}
export function registerModuleRecovery() {
  const listener = (event: Event) => {recoverModuleLoad((event as Event & {payload?: unknown}).payload)}
  window.addEventListener('vite:preloadError', listener)
  return () => window.removeEventListener('vite:preloadError', listener)
}
