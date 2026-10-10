export type ThemeMode = 'dark' | 'light' | 'system'
export type HeaderStyle = 'centered_logo' | 'left_logo' | 'minimal'
export type PageFormat = 'A4' | 'Letter'
export type DefaultProjectView = 'kanban' | 'list' | 'grid'
export type DefaultTaskView = 'board' | 'list' | 'calendar'
export type IntegrationStatus = 'not_configured' | 'disconnected' | 'connected' | 'expired' | 'error'

export interface AgencyBrandingData {
  id: string
  agency_id: string
  display_name: string
  legal_name: string
  tagline: string
  logo_light_path?: string
  logo_dark_path?: string
  symbol_path?: string
  favicon_path?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  surface_color: string
  text_color: string
  heading_font: string
  body_font: string
  theme_mode: ThemeMode
  created_at: string
  updated_at: string
}

export interface AgencyPreferencesData {
  id: string
  agency_id: string
  language: string
  timezone: string
  date_format: string
  time_format: string
  currency: string
  week_starts_on: number
  default_project_view: DefaultProjectView
  default_task_view: DefaultTaskView
  created_at: string
  updated_at: string
}

export interface AgencyDocumentSettingsData {
  id: string
  agency_id: string
  header_style: HeaderStyle
  footer_text: string
  show_logo: boolean
  show_watermark: boolean
  watermark_opacity: number
  page_format: PageFormat
  document_font: string
  created_at: string
  updated_at: string
}

export interface AgencyPortalSettingsData {
  id: string
  agency_id: string
  portal_title: string
  welcome_message: string
  show_agency_logo: boolean
  show_client_logo: boolean
  footer_text: string
  contact_email: string
  website_url: string
  created_at: string
  updated_at: string
}

export interface AgencySettingsHistoryData {
  id: string
  agency_id: string
  setting_group: string
  changed_by: string
  previous_value: Record<string, unknown>
  new_value: Record<string, unknown>
  created_at: string
}

export interface AgencyMemberUser {
  id: string
  agency_id: string
  user_id: string
  role_id: string
  role_name: string
  status: 'active' | 'invited' | 'suspended'
  full_name: string
  email: string
  avatar_url?: string
  joined_at: string
}

export interface AgencyInvitation {
  id: string
  agency_id: string
  email: string
  role_id: string
  role_name: string
  invited_by: string
  invited_by_name: string
  expires_at: string
  accepted_at?: string
  revoked_at?: string
  created_at: string
}

export interface PermissionDefinition {
  id: string
  permission_key: string
  module: string
  description: string
}

export interface RoleDefinition {
  id: string
  agency_id: string
  name: string
  description: string
  is_system: boolean
}

export interface RolePermissionMatrixItem {
  role_id: string
  permission_id: string
  permission_key: string
  allowed: boolean
}

export interface ActivityEvent {
  id: string
  agency_id: string
  actor_user_id?: string
  actor_name: string
  actor_avatar?: string
  event_type: string
  resource_type: string
  resource_id?: string
  summary: string
  details?: Record<string, unknown>
  created_at: string
}

export interface PhaseStatusItem {
  id: string
  name: string
  status: 'completed' | 'in_progress' | 'partial' | 'blocked' | 'not_started'
  completed_requirements: string[]
  pending_requirements: string[]
  last_verified_at: string
  evidence: string
}
