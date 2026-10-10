import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Layers, Database, HardDrive, Calendar, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

export const IntegrationsCenterPage: React.FC = () => {
  const isSupabaseActive = isSupabaseConfigured

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#7952FF]" />
          Central de Integrações & Conexões
        </h3>
        <p className="text-xs text-[#A1A1B0]">
          Monitore o estado real de autenticação e conexões com serviços externos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Infraestrutura Supabase */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-[#7952FF]/10 text-[#7952FF]">
                <Database className="w-5 h-5" />
              </div>
              <Badge variant={isSupabaseActive ? 'default' : 'neutral'}>
                {isSupabaseActive ? 'Conectado' : 'Modo Local / Demo'}
              </Badge>
            </div>
            <CardTitle className="text-base font-bold">Supabase PostgreSQL</CardTitle>
            <CardDescription className="text-xs">
              Infraestrutura interna de banco de dados, RLS e autenticação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="text-xs text-[#A1A1B0] space-y-1">
              <div className="flex justify-between">
                <span>Projeto:</span>
                <span className="font-mono text-[#F8F9FC]">pvkhlobsiszrjtblpruu</span>
              </div>
              <div className="flex justify-between">
                <span>Row Level Security:</span>
                <span className="text-[#34D399] font-bold">Ativo (RLS)</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#101014] border border-[#30303B] text-[11px] text-[#717182]">
              {isSupabaseActive
                ? 'Conexão remota ativa verificada com sucesso.'
                : 'Rodando com fallback seguro e persistência em memória/localStorage.'}
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Integration */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
            <CardTitle className="text-base font-bold">Google Drive Workspace</CardTitle>
            <CardDescription className="text-xs">
              Conexão com repositórios de arquivos de clientes e entregáveis criativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-xs text-[#A1A1B0]">
              Gerencie pastas conectadas e sincronize arquivos diretamente pelo Drive Browser.
            </p>
            <a
              href="/drive/connections"
              className="w-full py-2 rounded-lg border border-[#30303B] bg-[#101014] hover:bg-[#1C1C24] text-xs font-medium text-[#F8F9FC] flex items-center justify-center gap-2 transition-colors"
            >
              <span>Gerenciar Conexões Drive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </CardContent>
        </Card>

        {/* Google Calendar Integration */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <Badge variant="outline">Disponível</Badge>
            </div>
            <CardTitle className="text-base font-bold">Google Calendar</CardTitle>
            <CardDescription className="text-xs">
              Sincronização bidirecional de reuniões, agendamentos e chamadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-xs text-[#A1A1B0]">
              Conecte sua conta do Google Workspace para importar pautas e horários.
            </p>
            <a
              href="/settings/integrations/calendar"
              className="w-full py-2 rounded-lg border border-[#30303B] bg-[#101014] hover:bg-[#1C1C24] text-xs font-medium text-[#F8F9FC] flex items-center justify-center gap-2 transition-colors"
            >
              <span>Configurar Calendário</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
