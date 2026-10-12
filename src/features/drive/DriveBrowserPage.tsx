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
  Plus,
  Link as LinkIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toast'
import { useDriveFiles, useDriveConnection, useAddDriveFileReference } from './hooks/useDrive'

export const DriveBrowserPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [mimeFilter, setMimeFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Add Drive File dialog
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileUrl, setNewFileUrl] = useState('')
  const [newFileMime, setNewFileMime] = useState('application/pdf')

  const { data: connection } = useDriveConnection()
  const { data: files = [], isLoading, isError, refetch } = useDriveFiles(searchTerm, mimeFilter === 'all' ? undefined : mimeFilter)
  const addFileMutation = useAddDriveFileReference()

  const handleCopyLink = (fileId: string, url?: string | null) => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopiedId(fileId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddFile = async () => {
    if (!newFileName.trim()) {
      toast.error('Informe o nome do arquivo.')
      return
    }
    try {
      await addFileMutation.mutateAsync({
        name: newFileName.trim(),
        mime_type: newFileMime,
        web_view_link: newFileUrl.trim() || undefined,
      })
      toast.success('Arquivo do Google Drive vinculado com sucesso!')
      setNewFileName('')
      setNewFileUrl('')
      setIsAddModalOpen(false)
    } catch (err: any) {
      toast.error('Erro ao adicionar arquivo: ' + (err?.message || 'Falha inesperada'))
    }
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
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Vincular Arquivo
            </Button>
            <Link to="/drive/connections">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1.5" />
                Configurar Conexão
              </Button>
            </Link>
          </div>
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
      {isError ? <div role="alert" className="p-6 text-status-error">Não foi possível carregar os arquivos desta agência. <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div> : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 space-y-4">
          <HardDrive className="w-12 h-12 mx-auto text-text-muted opacity-50" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Nenhum arquivo encontrado</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              Nenhum arquivo no Google Drive corresponde à sua busca ou filtro. Vincule novos arquivos autorizados do Drive para disponibilizá-los à agência.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Vincular Primeiro Arquivo
          </Button>
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

      {/* DIALOG: VINCULAR ARQUIVO DO DRIVE */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div className="p-6 space-y-4 max-w-md">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-bold text-text-primary">Vincular Arquivo do Google Drive</h3>
          </div>
          <p className="text-xs text-text-muted">
            Cadastre um arquivo autorizado do Google Drive para que ele fique disponível nas apresentações e projetos da agência.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Nome do Arquivo / Material *
              </label>
              <Input
                placeholder="Ex: Video_Institucional_Final_V2.mp4"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Link de Visualização no Drive
              </label>
              <Input
                placeholder="https://drive.google.com/file/d/.../view"
                value={newFileUrl}
                onChange={e => setNewFileUrl(e.target.value)}
              />
              <p className="text-[10px] text-text-muted mt-1">
                Cole a URL compartilhável do arquivo no Google Drive.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Tipo de Arquivo
              </label>
              <select
                value={newFileMime}
                onChange={e => setNewFileMime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-hover/50 border border-border/60 rounded-lg text-text-primary text-xs focus:outline-none focus:border-brand-primary"
              >
                <option value="application/pdf">Documento PDF / Apresentação</option>
                <option value="video/mp4">Vídeo MP4</option>
                <option value="image/png">Imagem PNG</option>
                <option value="image/jpeg">Imagem JPG</option>
                <option value="application/vnd.google-apps.presentation">Google Slides</option>
                <option value="application/vnd.google-apps.folder">Pasta do Google Drive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border/40">
            <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAddFile}
              disabled={!newFileName.trim()}
              loading={addFileMutation.isPending}
            >
              Vincular Arquivo
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
