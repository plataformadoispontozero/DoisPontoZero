import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { MobileNav } from '@/components/navigation/MobileNav'
import { TopBar } from '@/components/navigation/TopBar'

export const AppLayout: React.FC = () => {
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
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
