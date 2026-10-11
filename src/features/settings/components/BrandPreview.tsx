import React from 'react'
import {
  Building2,
  FolderKanban,
  CheckSquare,
  Users2,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import type { AgencyBrandingData } from '@/types/whitelabel'

interface BrandPreviewProps {
  branding: AgencyBrandingData
  isDraft?: boolean
}

export const BrandPreview: React.FC<BrandPreviewProps> = ({ branding, isDraft = false }) => {
  return (
    <div
      className="rounded-2xl border border-[#30303B] overflow-hidden shadow-2xl transition-all duration-300"
      style={{
        backgroundColor: branding.background_color,
        fontFamily: branding.body_font || 'Inter, sans-serif',
      }}
    >
      {/* Header do Mockup de Previsualização */}
      <div className="bg-[#1C1C24] border-b border-[#30303B] px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-2 font-mono text-[11px] text-[#B8B8C0]">
            https://app.agencia.com.br
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-semibold text-[10px]">
              Pré-visualização (não salva)
            </span>
          )}
          <span className="text-[10px] text-[#98989F] font-mono">
            {branding.display_name} Studio
          </span>
        </div>
      </div>

      {/* Grid Simulando o AppShell */}
      <div className="flex h-[520px] text-xs">
        {/* Sidebar Simulado */}
        <div
          className="w-48 border-r border-[#30303B] flex flex-col p-3 shrink-0"
          style={{ backgroundColor: branding.surface_color }}
        >
          {/* Brand Logo Simulado */}
          <div className="flex items-center gap-2 mb-6 px-1">
            {branding.symbol_path ? (
              <img src={branding.symbol_path} alt="Logo" className="w-7 h-7 object-contain" />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: branding.primary_color }}
              >
                {branding.display_name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h4
                className="font-bold text-sm truncate"
                style={{
                  color: branding.text_color,
                  fontFamily: branding.heading_font || 'Space Grotesk',
                }}
              >
                {branding.display_name}
              </h4>
              <span className="text-[9px] text-[#B8B8C0] block truncate">
                {branding.tagline}
              </span>
            </div>
          </div>

          {/* Items de Navegação */}
          <div className="space-y-1">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium text-white shadow-sm"
              style={{ backgroundColor: branding.primary_color }}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#B8B8C0]">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Projetos</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#B8B8C0]">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tarefas</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#B8B8C0]">
              <Users2 className="w-3.5 h-3.5" />
              <span>Squads</span>
            </div>
          </div>
        </div>

        {/* Conteúdo do Painel Principal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* TopBar Simulado */}
          <div
            className="h-12 border-b border-[#30303B] px-4 flex items-center justify-between"
            style={{ backgroundColor: branding.surface_color }}
          >
            <div className="flex items-center gap-2 text-[#B8B8C0]">
              <Search className="w-3.5 h-3.5" />
              <span className="text-[11px]">Buscar demandas, marcas ou tarefas...</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-[#B8B8C0]" />
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                style={{ backgroundColor: branding.primary_color }}
              >
                AG
              </div>
            </div>
          </div>

          {/* Area de Conteúdo Interno */}
          <div className="p-4 space-y-4">
            {/* Header da Página */}
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="text-base font-bold"
                  style={{
                    color: branding.text_color,
                    fontFamily: branding.heading_font,
                  }}
                >
                  Visão Geral Operacional
                </h3>
                <p className="text-[11px] text-[#B8B8C0]">
                  Bem-vindo ao workspace da {branding.display_name}.
                </p>
              </div>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-black shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: branding.accent_color }}
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Demanda
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3 rounded-xl border border-[#30303B] space-y-1"
                style={{ backgroundColor: branding.surface_color }}
              >
                <span className="text-[10px] text-[#B8B8C0]">Projetos em Produção</span>
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: branding.text_color,
                      fontFamily: branding.heading_font,
                    }}
                  >
                    14 Ativos
                  </span>
                  <span
                    className="text-[10px] font-semibold flex items-center gap-0.5"
                    style={{ color: branding.accent_color }}
                  >
                    <TrendingUp className="w-3 h-3" /> +12%
                  </span>
                </div>
              </div>

              <div
                className="p-3 rounded-xl border border-[#30303B] space-y-1"
                style={{ backgroundColor: branding.surface_color }}
              >
                <span className="text-[10px] text-[#B8B8C0]">Entregas da Semana</span>
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: branding.text_color,
                      fontFamily: branding.heading_font,
                    }}
                  >
                    28 Concluídas
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                    style={{
                      backgroundColor: `${branding.primary_color}33`,
                      color: branding.primary_color,
                    }}
                  >
                    Meta 95%
                  </span>
                </div>
              </div>
            </div>

            {/* Tabela de Amostra */}
            <div
              className="rounded-xl border border-[#30303B] overflow-hidden"
              style={{ backgroundColor: branding.surface_color }}
            >
              <div className="px-3 py-2 border-b border-[#30303B] flex items-center justify-between">
                <span className="font-semibold text-xs text-[#F8F9FC]">
                  Fila Prioritária
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#B8B8C0]" />
              </div>
              <div className="divide-y divide-[#30303B]/60 text-[11px]">
                <div className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#F8F9FC] block">
                      Rebranding Vanguarda Tech
                    </span>
                    <span className="text-[10px] text-[#B8B8C0]">
                      Squad Brand Strategy
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: `${branding.primary_color}22`,
                      color: branding.primary_color,
                    }}
                  >
                    Em Produção
                  </span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#F8F9FC] block">
                      Motion Reel Outubro
                    </span>
                    <span className="text-[10px] text-[#B8B8C0]">
                      Squad Audiovisual
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: `${branding.accent_color}22`,
                      color: branding.accent_color,
                    }}
                  >
                    Aprovação
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
