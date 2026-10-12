import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { settingsTabs } from './components/SettingsLayout'
import { ArrowRight, Sparkles } from 'lucide-react'

export const SettingsOverviewPage: React.FC = () => {
  // Exclude overview tab itself from grid
  const tabs = settingsTabs.filter((t) => t.id !== 'overview')

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner de Boas-Vindas */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#C74410]/20 via-[#1C1C24] to-[#101014] border border-[#C74410]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-[#FF8759] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Configurações da Dois.Zero</span>
          </div>
          <h2 className="text-xl font-bold text-[#F8F9FC]">
            Painel Central de Administração da Agência
          </h2>
          <p className="text-xs text-[#B8B8C0] leading-relaxed">
            Gerencie os acessos da equipe, atualize os dados da agência e configure o conteúdo do site público.
          </p>
        </div>

        <Link
          to="/settings/team"
          className="px-4 py-2.5 rounded-xl bg-[#C74410] hover:bg-[#C74410]/90 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#C74410]/25 shrink-0 transition-all"
        >
          <span>Gerenciar equipe</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="text-xs text-[#98989F]">Versão da plataforma: 0.2.0</p>
      {/* Grid com os 12 Módulos de Configuração */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link key={tab.id} to={tab.path} className="group focus:outline-none">
              <Card className="h-full transition-all duration-200 group-hover:border-[#C74410]/60 group-hover:bg-[#1C1C24]/90 group-hover:shadow-lg group-hover:shadow-[#C74410]/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-[#C74410]/10 text-[#C74410] group-hover:bg-[#C74410] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    {tab.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#FF8759]/20 text-[#FF8759]">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold text-[#F8F9FC] group-hover:text-[#C74410] transition-colors flex items-center gap-1.5 mt-3">
                    {tab.label}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C74410]" />
                  </CardTitle>
                  <CardDescription className="text-xs text-[#B8B8C0] line-clamp-2">
                    Acesse e gerencie parâmetros de {tab.label.toLowerCase()} do workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-[11px] text-[#98989F] flex items-center justify-between">
                  <span>Clique para abrir</span>
                  <span className="font-mono text-[10px]">{tab.path}</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
