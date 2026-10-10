// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: GOOGLE DRIVE CONNECTION MANAGER
// Route: /drive/connections
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Key,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  FolderPlus,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useDriveConnection, useToggleDriveConnection } from './hooks/useDrive'

export const DriveConnectionsPage: React.FC = () => {
  const { data: connection, isLoading } = useDriveConnection()
  const toggleMutation = useToggleDriveConnection()

  const isConnected = connection?.status === 'connected'

  const handleToggle = async () => {
    await toggleMutation.mutateAsync(!isConnected)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Google Drive Connection Manager"
        subtitle="Gerencie a integração OAuth 2.0 com o Google Drive para vincular arquivos e pastas da agência."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Google Drive', href: '/drive' },
          { label: 'Conexões' },
        ]}
        actions={
          <Link to="/drive">
            <Button variant="outline" size="sm">
              <HardDrive className="w-4 h-4 mr-1.5" />
              Navegador de Arquivos
            </Button>
          </Link>
        }
      />

      <Card className="p-6 space-y-6 border-border/60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-lg">Google Drive API Integration</h3>
              <p className="text-xs text-text-muted">OAuth 2.0 com Authorization Code Flow & escopos PKCE restritos.</p>
            </div>
          </div>

          {isConnected ? (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Conectado & Ativo
            </Badge>
          ) : (
            <Badge variant="neutral">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </div>

        {isConnected ? (
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-surface-hover/50 border border-border/40">
                <span className="text-text-muted block">Conta Google Autorizada:</span>
                <span className="font-semibold text-text-primary text-sm">{connection.google_email}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-hover/50 border border-border/40">
                <span className="text-text-muted block">Última Verificação do Token:</span>
                <span className="font-medium text-text-primary">{new Date(connection.last_verified_at).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-hover/30 border border-border/40 space-y-2">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Escopos OAuth 2.0 Autorizados (Princípio do Acesso Mínimo):
              </span>
              <ul className="text-xs text-text-muted space-y-1 list-disc pl-5">
                {connection.scopes.map((s, i) => (
                  <li key={i} className="font-mono text-[11px]">{s}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-text-muted">
                A revogação desconecta a sincronização sem apagar arquivos existentes no seu Google Drive.
              </p>
              <Button
                variant="outline"
                size="sm"
                loading={toggleMutation.isPending}
                onClick={handleToggle}
              >
                Desconectar Conta Google
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4 border border-dashed border-border/60 rounded-xl">
            <Key className="w-10 h-10 text-text-muted mx-auto opacity-50" />
            <div>
              <h4 className="font-semibold text-text-primary text-base">Conecte seu Google Drive</h4>
              <p className="text-xs text-text-muted max-w-md mx-auto mt-1">
                Organize os materiais criativos dos clientes e associe arquivos a projetos sem sair do Dois.Zero.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              loading={toggleMutation.isPending}
              onClick={handleToggle}
            >
              Conectar Google Drive
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
