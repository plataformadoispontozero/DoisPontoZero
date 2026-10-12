import { useAuth } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: GOOGLE DRIVE INTEGRATION HOOKS
// TanStack Query hooks & local demo fallback for Drive Management
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  GoogleConnection,
  ClientDriveFolder,
  DriveFileReference,
  ProjectDriveFile,
} from '@/types/drive'

// Mock Initial Connection & File References for Demo Mode
const DEMO_GOOGLE_CONNECTION: GoogleConnection = {
  id: 'gconn-demo-001',
  agency_id: 'demo-agency',
  google_account_id: 'google-user-12345',
  google_email: 'criativo@matrizcriativa.com.br',
  status: 'connected',
  scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
  expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  last_verified_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_DRIVE_FILES: DriveFileReference[] = [
  {
    id: 'dref-001',
    agency_id: 'demo-agency',
    connection_id: 'gconn-demo-001',
    google_file_id: '1A2B3C4D5E6F_reels_01',
    name: 'Reels_Lancamento_Acme_V1.mp4',
    mime_type: 'video/mp4',
    web_view_link: 'https://drive.google.com/file/d/1A2B3C4D5E6F_reels_01/view',
    thumbnail_reference: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
    size_bytes: 45200000,
    modified_time: new Date(Date.now() - 86400000).toISOString(),
    last_synced_at: new Date().toISOString(),
    availability_status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dref-002',
    agency_id: 'demo-agency',
    connection_id: 'gconn-demo-001',
    google_file_id: '2B3C4D5E6F7G_carrossel',
    name: 'Carrossel_Identidade_Starlight.pdf',
    mime_type: 'application/pdf',
    web_view_link: 'https://drive.google.com/file/d/2B3C4D5E6F7G_carrossel/view',
    thumbnail_reference: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=400',
    size_bytes: 12800000,
    modified_time: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_synced_at: new Date().toISOString(),
    availability_status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dref-003',
    agency_id: 'demo-agency',
    connection_id: 'gconn-demo-001',
    google_file_id: '3C4D5E6F7G8H_brandbook',
    name: 'Brandbook_Manual_Marca_Nexus.pdf',
    mime_type: 'application/pdf',
    web_view_link: 'https://drive.google.com/file/d/3C4D5E6F7G8H_brandbook/view',
    thumbnail_reference: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    size_bytes: 34500000,
    modified_time: new Date(Date.now() - 4 * 86400000).toISOString(),
    last_synced_at: new Date().toISOString(),
    availability_status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

let demoConnectionStore: GoogleConnection | null = DEMO_GOOGLE_CONNECTION
let demoFilesStore: DriveFileReference[] = [...DEMO_DRIVE_FILES]
let demoClientFoldersStore: ClientDriveFolder[] = [
  {
    id: 'cfolder-001',
    agency_id: 'demo-agency',
    client_id: 'cli-001',
    google_folder_id: 'folder_acme_main_2026',
    folder_name: 'Acme Corp — Entregas & Artes 2026',
    folder_url: 'https://drive.google.com/drive/folders/folder_acme_main_2026',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// 1. Hook: Google Connection Status
export function useDriveConnection() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['drive_connection'],
    queryFn: async (): Promise<GoogleConnection | null> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data , error: backendError1 } = await supabase
            .from('google_connections')
            .select('*')
            .eq('agency_id', agencyId)
            .maybeSingle()
          if (backendError1) throw backendError1

          return data
        } catch (err) {
          throw err
        }
      }
      return demoConnectionStore
    },
  })
}

// 2. Hook: Drive Files Browser
export function useDriveFiles(search?: string, mimeType?: string) {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['drive_files', agencyId, search, mimeType],
    enabled: !isSupabaseConfigured || Boolean(agencyId),
    queryFn: async (): Promise<DriveFileReference[]> => {
      if (isSupabaseConfigured && supabase) {
        if (!agencyId) throw new Error('Sessão e agência são obrigatórias.')
        let query = supabase.from('drive_file_references').select('*').eq('agency_id', agencyId)
        if (search) query = query.ilike('name', `%${search}%`)
        if (mimeType) query = query.eq('mime_type', mimeType)
        const { data, error } = await query
        if (error) throw error
        return data || []
      }
      return demoFilesStore.filter((f) =>
        (!search || f.name.toLowerCase().includes(search.toLowerCase())) &&
        (!mimeType || f.mime_type === mimeType))
    },
  })
}

// 2b. Hook: Add Drive File Reference
export function useAddDriveFileReference() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      mime_type: string
      web_view_link?: string
      google_file_id?: string
      thumbnail_reference?: string
      size_bytes?: number
    }): Promise<DriveFileReference> => {
      const generatedId = isSupabaseConfigured ? crypto.randomUUID() : `dref-${Date.now()}`
      const extractedGoogleId = payload.google_file_id || 
        (payload.web_view_link ? (payload.web_view_link.match(/[-\w]{20,}/)?.[0] || `gfile-${Date.now()}`) : `gfile-${Date.now()}`)

      const newRef: DriveFileReference = {
        id: generatedId,
        agency_id: agencyId || 'demo-agency',
        google_file_id: extractedGoogleId,
        name: payload.name.trim(),
        mime_type: payload.mime_type,
        web_view_link: payload.web_view_link || `https://drive.google.com/file/d/${extractedGoogleId}/view`,
        thumbnail_reference: payload.thumbnail_reference || null,
        size_bytes: payload.size_bytes || null,
        availability_status: 'available',
        last_synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (isSupabaseConfigured && supabase) {
        if (!agencyId) throw new Error('Sessão e agência são obrigatórias.')
        const driveUrl = new URL(payload.web_view_link || '')
        if (driveUrl.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(driveUrl.hostname)) {
          throw new Error('Informe um link HTTPS válido do Google Drive.')
        }
        const driveId = payload.google_file_id || driveUrl.searchParams.get('id') || driveUrl.pathname.match(/\/(?:d|folders)\/([\w-]+)/)?.[1]
        if (!driveId || !/^[\w-]{10,}$/.test(driveId)) throw new Error('O link não identifica um arquivo ou pasta do Google Drive.')
        newRef.google_file_id = driveId
        {
          const { data, error } = await supabase
            .from('drive_file_references')
            .insert({
              id: newRef.id,
              agency_id: agencyId,
              google_file_id: newRef.google_file_id,
              name: newRef.name,
              mime_type: newRef.mime_type,
              web_view_link: newRef.web_view_link,
              thumbnail_reference: newRef.thumbnail_reference,
              size_bytes: newRef.size_bytes,
              availability_status: 'available',
            })
            .select('*')
            .single()

          if (error) throw error
          if (!data) throw new Error('O arquivo não foi salvo.')
          queryClient.invalidateQueries({ queryKey: ['drive_files', agencyId] })
          return data
        }
      }
      demoFilesStore = [newRef, ...demoFilesStore]

      queryClient.invalidateQueries({ queryKey: ['drive_files'] })
      return newRef
    },
  })
}

// 3. Hook: Client Drive Folders
export function useClientDriveFolders(clientId?: string) {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['client_drive_folders', clientId],
    enabled: Boolean(clientId),
    queryFn: async (): Promise<ClientDriveFolder[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data , error: backendError3 } = await supabase
            .from('client_drive_folders')
            .select('*')
            .eq('client_id', clientId)
          if (backendError3) throw backendError3

          return data
        } catch (err) {
          throw err
        }
      }
      return demoClientFoldersStore.filter((f) => f.client_id === clientId)
    },
  })
}

// 4. Hook: Link Folder to Client
export function useLinkClientDriveFolder() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { clientId: string; folderName: string; googleFolderId: string }) => {
      const newFolder: ClientDriveFolder = {
        id: `cfolder-${Date.now()}`,
        agency_id: agencyId,
        client_id: payload.clientId,
        google_folder_id: payload.googleFolderId,
        folder_name: payload.folderName,
        folder_url: `https://drive.google.com/drive/folders/${payload.googleFolderId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      demoClientFoldersStore = [newFolder, ...demoClientFoldersStore]

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('client_drive_folders').insert(newFolder)
        } catch (err) {
          throw err
        }
      }

      queryClient.invalidateQueries({ queryKey: ['client_drive_folders', payload.clientId] })
      return newFolder
    },
  })
}

// 5. Hook: Toggle Connect/Disconnect Google Drive
export function useToggleDriveConnection() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connect: boolean) => {
      if (isSupabaseConfigured) throw new Error('Integração OAuth ainda não configurada no backend. Nenhuma conexão foi criada ou revogada.')
      if (connect) {
        demoConnectionStore = DEMO_GOOGLE_CONNECTION
      } else {
        demoConnectionStore = null
      }

      if (isSupabaseConfigured && supabase) {
        try {
          if (connect) {
            await supabase.from('google_connections').upsert(DEMO_GOOGLE_CONNECTION)
          } else {
            await supabase.from('google_connections').delete().eq('agency_id', agencyId)
          }
        } catch (err) {
          throw err
        }
      }

      queryClient.invalidateQueries({ queryKey: ['drive_connection'] })
      return demoConnectionStore
    },
  })
}

// 6. Hook: Composite Drive Hook
export function useDrive() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const connectionQuery = useDriveConnection()
  const driveFilesQuery = useDriveFiles()
  const addDriveFileMutation = useAddDriveFileReference()

  return {
    connection: connectionQuery.data || null,
    driveFiles: driveFilesQuery.data || [],
    isLoadingConnection: connectionQuery.isLoading,
    isLoadingFiles: driveFilesQuery.isLoading,
    isFilesError: driveFilesQuery.isError,
    refetchFiles: driveFilesQuery.refetch,
    addDriveFile: addDriveFileMutation.mutateAsync,
    isAddingFile: addDriveFileMutation.isPending,
  }
}
