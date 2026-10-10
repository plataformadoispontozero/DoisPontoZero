// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: GOOGLE DRIVE INTEGRATION
// Domain Types & Interfaces
// ============================================================

export type DriveConnectionStatus = 'connected' | 'expired' | 'revoked' | 'error'

export type FileAvailabilityStatus = 'available' | 'access_denied' | 'deleted'

export interface GoogleConnection {
  id: string
  agency_id: string
  connected_by?: string | null
  google_account_id?: string | null
  google_email?: string | null
  status: DriveConnectionStatus
  scopes: string[]
  token_reference?: string | null
  expires_at?: string | null
  last_verified_at: string
  created_at: string
  updated_at: string
}

export interface ClientDriveFolder {
  id: string
  agency_id: string
  client_id: string
  connection_id?: string | null
  google_folder_id: string
  folder_name: string
  folder_url?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface DriveFileReference {
  id: string
  agency_id: string
  connection_id?: string | null
  google_file_id: string
  name: string
  mime_type: string
  web_view_link?: string | null
  thumbnail_reference?: string | null
  parent_folder_id?: string | null
  modified_time?: string | null
  size_bytes?: number | null
  last_synced_at: string
  availability_status: FileAvailabilityStatus
  created_at: string
  updated_at: string
}

export interface ProjectDriveFile {
  id: string
  agency_id: string
  project_id: string
  file_reference_id: string
  file_reference?: DriveFileReference
  created_by?: string | null
  created_at: string
}
