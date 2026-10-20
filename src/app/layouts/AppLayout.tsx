import {useOfficeVoice} from '@/features/office/OfficeVoiceContext'
import {officeControlsEnabled} from '@/features/office/officeFeature'
import {OfficeMiniBar} from '@/features/office/OfficeMiniBar'
import { BrandedNotificationController } from "@/features/app-install/BrandedNotificationController";
import { NotificationSoundController } from '@/features/notifications/NotificationSoundController'
import { useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { MobileNav } from '@/components/navigation/MobileNav'
import { TopBar } from '@/components/navigation/TopBar'

export const AppLayout: React.FC = () => {
  const auth = useAuth()
  const voice=useOfficeVoice()
  const hasOfficeBar=officeControlsEnabled&&Boolean(voice.roomId||voice.error)
  const queryClient = useQueryClient()
  const queryLabels: Record<string,string> = {notifications:'notificações',dashboard:'indicadores do dashboard','agency-agenda':'agenda',agencyBranding:'identidade visual',agencyPreferences:'preferências',agencyDocumentSettings:'configuração de documentos',agencyPortalSettings:'portal',meetings:'reuniões',meeting:'reunião',clients:'clientes',projects:'projetos',tasks:'tarefas',squads:'squads',briefings:'briefings',strategies:'estratégias',presentations:'apresentações','permission-matrix':'permissões'}
  const failedAreas = useSyncExternalStore(
    callback => queryClient.getQueryCache().subscribe(callback),
    () => [...new Set(queryClient.getQueryCache().getAll().filter(query => query.isActive() && query.state.status === 'error').map(query => queryLabels[String(query.queryKey[0])] || 'dados da página'))].sort().join(', '),
  )
  // Persistência da sidebar recolhida no localStorage
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('doiszero_sidebar_collapsed')
      return saved !== null ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('doiszero_sidebar_collapsed', JSON.stringify(collapsed))
    } catch {
      // Ignora erro de quota no localStorage
    }
  }, [collapsed])

  const toggleCollapse = () => {
    setCollapsed((prev: boolean) => !prev)
  }

  return (
    <div style={{'--office-sidebar-width':collapsed?'72px':'248px'} as React.CSSProperties} className="min-h-screen bg-[#101014] text-[#F8F9FC] flex flex-col md:flex-row antialiased overflow-x-hidden">
      <BrandedNotificationController /><NotificationSoundController />
      {/* Sidebar Desktop Fixa */}
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      {/* Navegação Mobile com Sheet */}
      <MobileNav />

      {/* Área Central de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden md:ml-[var(--office-sidebar-width)] transition-[margin] motion-reduce:transition-none">
        <TopBar />
        {failedAreas && <div role="alert" className="px-4 py-3 text-xs text-[#FB7185] border-b border-[#30303B]">Não foi possível carregar: {failedAreas}. Verifique a conexão e as permissões. Nenhum dado de demonstração substitui essa falha. <button type="button" className="underline ml-2" onClick={()=>void queryClient.invalidateQueries({predicate:query=>query.state.status==='error',refetchType:'active'})}>Tentar novamente</button></div>}
        {auth.isDemo && <div role="status" className="px-4 py-2 text-xs text-[#FBBF24] border-b border-[#30303B]">Demonstração local — dados não persistidos no Supabase.</div>}
        <main className={`flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto ${hasOfficeBar?'pb-64 md:pb-48':'pb-24 md:pb-12'}`}>
          <Outlet />
        </main>
        <OfficeMiniBar />
      </div>
    </div>
  )
}
