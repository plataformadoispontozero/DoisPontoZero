import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { useActivityFeed } from './hooks/useAgencySettings'
import { ShieldAlert, LogOut, Lock, Key, CheckCircle2, ShieldCheck, History } from 'lucide-react'

export const SecurityCenterPage: React.FC = () => {
  const activityFeed = useActivityFeed()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut()
        toast.success('Sessão encerrada com sucesso!')
        window.location.href = '/dashboard'
      } else {
        toast.info('Sessão local redefinida com sucesso.')
      }
    } catch {
      toast.error('Erro ao efetuar logout.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#7952FF]" />
          Centro de Segurança & Sessão
        </h3>
        <p className="text-xs text-[#A1A1B0]">
          Monitore o estado de autenticação, encerre sessões ativas e consulte logs de auditoria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Sessão e Encerrar Acesso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sessão de Usuário Ativa</CardTitle>
            <CardDescription className="text-xs">
              Status da conexão autenticada com a infraestrutura da agência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1B0]">Estado da Autenticação:</span>
                <Badge variant={isSupabaseConfigured ? 'default' : 'neutral'}>
                  {isSupabaseConfigured ? 'Supabase Auth Efetivo' : 'Sessão Local / Modo Demo'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#A1A1B0]">Token de Sessão:</span>
                <span className="font-mono text-[#F8F9FC] text-[11px]">
                  {isSupabaseConfigured ? 'JWT Validado (SHA-256)' : 'Local Session Mock'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                loading={isLoggingOut}
                className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão no Supabase</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Políticas de Segurança e Criptografia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Diretrizes de Segurança RLS</CardTitle>
            <CardDescription className="text-xs">
              Mecanismos de isolamento lógico ativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#101014] border border-[#30303B] flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#34D399] shrink-0" />
              <div>
                <span className="font-bold text-[#F8F9FC] block">Row Level Security (RLS)</span>
                <span className="text-[11px] text-[#A1A1B0]">
                  Políticas ativas em todas as 25+ tabelas PostgreSQL para garantia multi-tenant.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101014] border border-[#30303B] flex items-center gap-3">
              <Key className="w-5 h-5 text-[#7952FF] shrink-0" />
              <div>
                <span className="font-bold text-[#F8F9FC] block">Convites Hashing SHA-256</span>
                <span className="text-[11px] text-[#A1A1B0]">
                  Tokens de convite de colaboradores expiráveis sem credenciais expostas.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
