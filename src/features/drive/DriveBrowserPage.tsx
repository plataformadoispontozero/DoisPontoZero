// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: GOOGLE DRIVE FILE BROWSER
// Route: /drive
// ============================================================

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HardDrive,
  Search,
  ExternalLink,
  FileText,
  Video,
  Image as ImageIcon,
  Folder,
  Settings,
  Copy,
  Check,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDriveFiles, useDriveConnection } from './hooks/useDrive'

export const DriveBrowserPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [mimeFilter, setMimeFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: connection } = useDriveConnection()
  const { data: files = [], isLoading } = useDriveFiles(searchTerm, mimeFilter === 'all' ? undefined : mimeFilter)

  const handleCopyLink = (fileId: string, url?: string | null) => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopiedId(fileId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getFileIcon = (mime: string) => {
    if (mime.includes('video')) return <Video className="w-5 h-5 text-purple-400" />
    if (mime.includes('image')) return <ImageIcon className="w-5 h-5 text-emerald-400" />
    return <FileText className="w-5 h-5 text-blue-400" />
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Google Drive Browser"
        subtitle="Navegue e consulte arquivos autorizados do Google Drive vinculados aos projetos da agência."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Google Drive' },
        ]}
        actions={
          <Link to="/drive/connections">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1.5" />
              Configurar Conexão
            </Button>
          </Link>
        }
      />

      {/* Toolbar Filter */}
      <Card className="p-4 border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Buscar arquivos autorizados por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={mimeFilter}
          onChange={(e) => setMimeFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos os Formatos' },
            { value: 'video/mp4', label: 'Vídeos MP4' },
            { value: 'application/pdf', label: 'Documentos PDF' },
          ]}
          className="w-48"
        />
      </Card>

      {/* Files Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80">
          <HardDrive className="w-12 h-12 mx-auto text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">Nenhum arquivo encontrado</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mb-4">
            Nenhum arquivo no Google Drive corresponde à sua busca ou filtro.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="p-4 space-y-4 border-border/60 hover:border-primary/40 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-surface-hover/80 border border-border/40 shrink-0">
                  {getFileIcon(file.mime_type)}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-text-primary text-sm truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    Modificado em: {file.modified_time ? new Date(file.modified_time).toLocaleDateString('pt-BR') : 'Recente'}
                  </p>
                </div>
              </div>

              {file.thumbnail_reference && (
                <div className="h-32 rounded-lg overflow-hidden border border-border/40 bg-surface-hover/30">
                  <img src={file.thumbnail_reference} alt={file.name} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                {file.web_view_link && (
                  <a
                    href={file.web_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Abrir no Drive
                    </Button>
                  </a>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={() => handleCopyLink(file.id, file.web_view_link)}
                  title="Copiar Link do Arquivo"
                >
                  {copiedId === file.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
