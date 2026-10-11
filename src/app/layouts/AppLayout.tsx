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
  const queryClient = useQueryClient()
  const hasQueryError = useSyncExternalStore(
    callback => queryClient.getQueryCache().subscribe(callback),
    () => queryClient.getQueryCache().getAll().some(query => query.state.status === 'error'),
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
    <div className="min-h-screen bg-[#101014] text-[#F8F9FC] flex flex-col md:flex-row antialiased overflow-x-hidden">
      {/* Sidebar Desktop Fixa */}
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      {/* Navegação Mobile com Sheet */}
      <MobileNav />

      {/* Área Central de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <TopBar />
        {hasQueryError && <div role="alert" className="px-4 py-3 text-xs text-[#FB7185] border-b border-[#30303B]">Não foi possível carregar parte dos dados da agência. Verifique a conexão e as permissões. Nenhum dado de demonstração substitui essa falha.</div>}
        {auth.isDemo && <div role="status" className="px-4 py-2 text-xs text-[#FBBF24] border-b border-[#30303B]">Demonstração local — dados não persistidos no Supabase.</div>}
        {!auth.isDemo && auth.memberships.length > 1 && <div className="px-4 py-2 flex items-center gap-3"><label htmlFor="agency-switch">Agência</label><select id="agency-switch" value={auth.activeAgency?.agencyId ?? ''} onChange={e => auth.selectAgency(e.target.value)} className="bg-[#1C1C24] border border-[#30303B] rounded p-2">{auth.memberships.map(m => <option key={m.agencyId} value={m.agencyId}>{m.agencyName}</option>)}</select></div>}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
