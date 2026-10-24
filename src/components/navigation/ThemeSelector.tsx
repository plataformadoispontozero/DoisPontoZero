import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { usePersonalTheme } from '@/app/theme/usePersonalTheme'
import { useAgencyBranding } from '@/features/settings/hooks/useAgencySettings'
import { toast } from '@/components/ui/Toast'

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = usePersonalTheme()
  const { branding } = useAgencyBranding()
  const [systemDark, setSystemDark] = useState(() => typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const mode = preference === 'workspace' ? branding.theme_mode || 'dark' : preference
  const dark = mode === 'system' ? systemDark : mode === 'dark'
  const Icon = dark ? Moon : Sun
  const label = dark ? 'Ativar tema claro' : 'Ativar tema escuro'
  return <button type="button" aria-label={label} title={label} aria-pressed={!dark}
    onClick={() => { if (!setPreference(dark ? 'light' : 'dark')) toast.error('Não foi possível salvar o tema neste navegador.') }}
    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition hover:border-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 ${compact ? '' : 'mx-0.5'}`}>
    <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
  </button>
}
