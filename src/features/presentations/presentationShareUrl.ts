/** Compact encoding preserves all 192 random bits of the existing sharing token. */
export function presentationSharePath(clientName: string | null | undefined, token: string) {
  const slug = (clientName || 'cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90).replace(/-$/, '') || 'cliente'
  if (!/^[a-f0-9]{48}$/i.test(token)) return `/showcase/${encodeURIComponent(token)}`
  const bytes = token.match(/../g)!.map(byte => String.fromCharCode(parseInt(byte, 16))).join('')
  const compact = btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `/apresentacao/${slug}/${compact}`
}

export function presentationTokenFromKey(key?: string): string | undefined {
  if (!key || !/^[A-Za-z0-9_-]{32}$/.test(key)) return undefined
  try {
    const decoded = atob(key.replace(/-/g, '+').replace(/_/g, '/'))
    if (decoded.length !== 24) return undefined
    return Array.from(decoded, byte => byte.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  } catch { return undefined }
}
