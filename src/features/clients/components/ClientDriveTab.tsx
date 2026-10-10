// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: CLIENT DRIVE TAB INTEGRATION
// Manage authorized Google Drive folders linked to a client in CRM
// ============================================================

import React, { useState } from 'react'
import { FolderPlus, ExternalLink, HardDrive, Trash2, Folder } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { useClientDriveFolders, useLinkClientDriveFolder } from '@/features/drive/hooks/useDrive'

interface Props {
  clientId: string
  clientName: string
}

export const ClientDriveTab: React.FC<Props> = ({ clientId, clientName }) => {
  const { data: folders = [], isLoading } = useClientDriveFolders(clientId)
  const linkFolderMutation = useLinkClientDriveFolder()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [googleFolderId, setGoogleFolderId] = useState('')

  const handleLink = async () => {
    if (!folderName || !googleFolderId) return
    await linkFolderMutation.mutateAsync({
      clientId,
      folderName,
      googleFolderId,
    })
    setFolderName('')
    setGoogleFolderId('')
    setIsModalOpen(false)
  }

  if (isLoading) {
    return <div className="p-4 text-xs text-text-muted">Carregando pastas vinculadas do Google Drive...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-text-primary text-sm">Pastas Autorizadas do Google Drive</h4>
          <p className="text-xs text-text-muted">Vincule pastas de produção do Google Drive a este cliente.</p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <FolderPlus className="w-3.5 h-3.5 mr-1" />
          Vincular Pasta
        </Button>
      </div>

      {folders.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-border/60 rounded-xl space-y-2">
          <HardDrive className="w-8 h-8 text-text-muted mx-auto opacity-50" />
          <p className="text-xs text-text-muted">Nenhuma pasta do Google Drive vinculada a este cliente ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="p-3 rounded-lg border border-border/40 bg-surface-hover/30 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-semibold text-text-primary block">{folder.folder_name}</span>
                  <span className="text-[10px] text-text-muted font-mono">ID: {folder.google_folder_id}</span>
                </div>
              </div>

              {folder.folder_url && (
                <a href={folder.folder_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Abrir Pasta no Drive
                  </Button>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link Folder Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)}>
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-text-primary text-sm">Vincular Pasta do Google Drive</h3>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nome de Identificação da Pasta</label>
            <Input
              placeholder="Ex: Acme Corp — Entregas & Artes 2026"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Google Folder ID</label>
            <Input
              placeholder="Ex: 1A2B3C4D5E6F_folder_id"
              value={googleFolderId}
              onChange={(e) => setGoogleFolderId(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={linkFolderMutation.isPending} onClick={handleLink}>
              Vincular Pasta
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
