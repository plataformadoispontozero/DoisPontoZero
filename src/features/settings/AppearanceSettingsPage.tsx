import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { useAgencyBranding } from './hooks/useAgencySettings'
import { SunMoon, Moon, Sun, Monitor, Save, CheckCircle2 } from 'lucide-react'
import type { ThemeMode } from '@/types/whitelabel'

export const AppearanceSettingsPage: React.FC = () => {
  const { branding, updateBranding } = useAgencyBranding()
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
            <SunMoon className="w-5 h-5 text-[#7952FF]" />
            Aparência & Temas Visuais
          </h3>
          <p className="text-xs text-[#A1A1B0]">
            Defina o tema padrão da agência e gerencie os modos de contraste da interface.
          </p>
        </div>
        <Button type="submit" variant="accent" size="sm" loading={isSaving}>
          <Save className="w-4 h-4" />
          <span>Salvar Preferência</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Modo de Tema Padrão do Workspace</CardTitle>
          <CardDescription className="text-xs">
            Esta configuração define o estilo visual padrão para todos os membros da equipe e portais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opção Tema Escuro */}
            <div
              onClick={() => setSelectedTheme('dark')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTheme === 'dark'
                  ? 'border-[#7952FF] bg-[#1C1C24] shadow-lg shadow-[#7952FF]/10'
                  : 'border-[#30303B] bg-[#101014]/60 hover:border-[#7952FF]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-[#7952FF]/10 text-[#7952FF]">
                  <Moon className="w-5 h-5" />
                </div>
                {selectedTheme === 'dark' && (
                  <CheckCircle2 className="w-4 h-4 text-[#7952FF]" />
                )}
              </div>
              <h4 className="text-sm font-bold text-[#F8F9FC]">Tema Escuro (Dark Mode)</h4>
              <p className="text-xs text-[#A1A1B0] mt-1">
                Fundo escuro otimizado (#101014) com elementos contrastantes em neon e roxo. Padrão recomendado.
              </p>
            </div>

            {/* Opção Tema Claro */}
            <div
              onClick={() => setSelectedTheme('light')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTheme === 'light'
                  ? 'border-[#7952FF] bg-[#1C1C24] shadow-lg shadow-[#7952FF]/10'
                  : 'border-[#30303B] bg-[#101014]/60 hover:border-[#7952FF]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                {selectedTheme === 'light' && (
                  <CheckCircle2 className="w-4 h-4 text-[#7952FF]" />
                )}
              </div>
              <h4 className="text-sm font-bold text-[#F8F9FC]">Tema Claro (Light Mode)</h4>
              <p className="text-xs text-[#A1A1B0] mt-1">
                Interface com fundos limpos em alta luminosidade para ambientes muito iluminados.
              </p>
            </div>

            {/* Opção Sistema */}
            <div
              onClick={() => setSelectedTheme('system')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTheme === 'system'
                  ? 'border-[#7952FF] bg-[#1C1C24] shadow-lg shadow-[#7952FF]/10'
                  : 'border-[#30303B] bg-[#101014]/60 hover:border-[#7952FF]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Monitor className="w-5 h-5" />
                </div>
                {selectedTheme === 'system' && (
                  <CheckCircle2 className="w-4 h-4 text-[#7952FF]" />
                )}
              </div>
              <h4 className="text-sm font-bold text-[#F8F9FC]">Sincronizado com Sistema</h4>
              <p className="text-xs text-[#A1A1B0] mt-1">
                Acompanha automaticamente as preferências do sistema operacional do usuário (macOS/Windows).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] text-xs text-[#A1A1B0] space-y-1">
            <span className="font-semibold text-[#F8F9FC] block">
              Regra de Hierarquia de Aparência
            </span>
            <p className="text-[11px]">
              O branding e as cores da agência permanecem ativos independentemente do tema selecionado. A preferência pessoal do usuário na sessão local pode alternar entre escuro/claro sem afetar a identidade global da marca.
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
