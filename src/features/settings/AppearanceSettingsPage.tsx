import React, { useState } from 'react'
import { usePersonalTheme } from '@/app/theme/usePersonalTheme'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { useAgencyBranding } from './hooks/useAgencySettings'
import { SunMoon, Moon, Sun, Monitor, Save, CheckCircle2 } from 'lucide-react'
import type { ThemeMode } from '@/types/whitelabel'

const AppearanceSettingsPageForm: React.FC = () => {
  const { branding, updateBranding } = useAgencyBranding()
  const {preference,setPreference}=usePersonalTheme()
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(branding.theme_mode || 'dark')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateBranding({ theme_mode: selectedTheme })
      toast.success(`Modo de aparência '${selectedTheme}' salvo com sucesso!`)
    } catch {
      toast.error('Erro ao atualizar modo de aparência.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
            <SunMoon className="w-5 h-5 text-[#C74410]" />
            Aparência & Temas Visuais
          </h3>
          <p className="text-xs text-[#B8B8C0]">
            Escolha o tema da equipe ou acompanhe a aparência do sistema.
          </p>
        </div>
        <Button type="submit" variant="accent" size="sm" loading={isSaving} disabled={isSaving}>
          <Save className="w-4 h-4" />
          <span>Salvar Preferência</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Modo de Tema Padrão do Workspace</CardTitle>
          <CardDescription className="text-xs">
            Escuro, claro ou automático. Este é o padrão da agência. Cada membro pode escolher seu próprio tema ao lado da busca.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opção Tema Escuro */}
            <button
              type="button"
              aria-pressed={selectedTheme === 'dark'}
              onClick={() => setSelectedTheme('dark')}
              className={`p-4 rounded-xl border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101014] disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedTheme === 'dark'
                  ? 'border-[#C74410] bg-[#1C1C24] shadow-lg shadow-[#C74410]/10'
                  : 'border-[#30303B] bg-[#101014]/60 hover:border-[#C74410]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-[#C74410]/10 text-[#C74410]">
                  <Moon className="w-5 h-5" />
                </div>
                {selectedTheme === 'dark' && (
                  <CheckCircle2 className="w-4 h-4 text-[#C74410]" />
                )}
              </div>
              <span className="block text-sm font-bold text-[#F8F9FC]">Tema Escuro (Dark Mode)</span>
              <p className="text-xs text-[#B8B8C0] mt-1">
                Fundo escuro com textos claros e destaques nas cores da agência.
              </p>
            </button>

            {/* Opção Tema Claro */}
            <button
              type="button"
              onClick={() => setSelectedTheme('light')}
              aria-pressed={selectedTheme === 'light'}
              className={`p-4 rounded-xl border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101014] disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedTheme === 'light'
                  ? 'border-[#C74410] bg-[#1C1C24] shadow-lg shadow-[#C74410]/10'
                  : 'border-[#30303B] bg-[#101014]/60 hover:border-[#C74410]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                {selectedTheme === 'light' && (
                  <CheckCircle2 className="w-4 h-4 text-[#C74410]" />
                )}
              </div>
              <span className="block text-sm font-bold text-[#F8F9FC]">Tema Claro (Light Mode)</span>
              <p className="text-xs text-[#B8B8C0] mt-1">
                Superfícies claras, textos escuros e contraste para trabalhar durante o dia.
              </p>
            </button>

            {/* Opção Sistema */}
            <button
              type="button"
              onClick={() => setSelectedTheme('system')}
              aria-pressed={selectedTheme === 'system'}
              className={`p-4 rounded-xl border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101014] disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedTheme === 'system'
                  ? 'border-[#C74410] bg-[#1C1C24] shadow-lg shadow-[#C74410]/10'
                  : 'border-[#30303B] bg-[#101014]/60 hover:border-[#C74410]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Monitor className="w-5 h-5" />
                </div>
                {selectedTheme === 'system' && (
                  <CheckCircle2 className="w-4 h-4 text-[#C74410]" />
                )}
              </div>
              <span className="block text-sm font-bold text-[#F8F9FC]">Sincronizado com Sistema</span>
              <p className="text-xs text-[#B8B8C0] mt-1">
                Acompanha automaticamente as mudanças de aparência do dispositivo.
              </p>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] text-xs text-[#B8B8C0] space-y-1">
            <span className="font-semibold text-[#F8F9FC] block">
              Regra de Hierarquia de Aparência
            </span>
            <p className="text-[11px]">
              As cores e os logotipos da agência são configurados em Identidade visual. O botão de lua/sol no cabeçalho alterna o tema pessoal neste navegador. Para acompanhar o padrão da agência, inclusive o modo automático, use a opção abaixo. As artes e os materiais dos clientes não são alterados.
            </p>
            {preference!=='workspace'&&<Button type="button" variant="outline" size="sm" onClick={()=>{if(!setPreference('workspace'))toast.error('Não foi possível atualizar sua preferência neste navegador.')}}>Usar o tema padrão da agência neste navegador</Button>}
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export const AppearanceSettingsPage: React.FC = () => {
  const source = useAgencyBranding()
  if (source.isError) return <div role="alert">Não foi possível carregar a aparência da agência. <Button onClick={() => { void source.refetch() }}>Tentar novamente</Button></div>
  if (source.isLoading) return <p role="status">Carregando aparência da agência…</p>
  return <AppearanceSettingsPageForm key={source.branding.agency_id} />
}
