import { Monitor, Moon, Sun } from 'lucide-react'
import { usePersonalTheme, type PersonalTheme } from '@/app/theme/usePersonalTheme'
import { toast } from '@/components/ui/Toast'

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = usePersonalTheme()
  const Icon = preference === 'light' ? Sun : preference === 'dark' ? Moon : Monitor
  return (
    <label className={`relative flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[var(--color-text-primary)] focus-within:ring-2 focus-within:ring-orange-400 ${compact ? 'w-11 shrink-0' : ''}`} title="Seu tema neste navegador. Não altera o tema dos outros membros.">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="sr-only">Tema da minha interface</span>
      <select
        aria-label="Tema da minha interface"
        value={preference}
        onChange={event => {
          if (!setPreference(event.target.value as PersonalTheme)) toast.error('Não foi possível salvar o tema neste navegador.')
        }}
        className={compact ? 'absolute inset-0 h-full w-full cursor-pointer opacity-0' : 'min-h-11 max-w-24 cursor-pointer bg-transparent text-xs outline-none sm:max-w-32'}
      >
        <option value="workspace">Da agência</option>
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
        <option value="system">Do sistema</option>
      </select>
    </label>
  )
}
