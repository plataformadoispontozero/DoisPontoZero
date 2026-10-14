// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: TEAM CHAT TYPES
// ============================================================

export type ChannelType = 'general' | 'squad' | 'project' | 'custom'

export type ChannelVisibility = 'agency' | 'private'

export type MemberRole = 'owner' | 'moderator' | 'member'

export type MessageType = 'text' | 'file' | 'system'

export interface ChatChannel {
  id: string
  agency_id: string
  name: string
  description?: string | null
  channel_type: ChannelType
  visibility: ChannelVisibility
  squad_id?: string | null
  squad_name?: string
  project_id?: string | null
  project_name?: string
  created_by?: string | null
  created_at: string
  updated_at: string
  archived_at?: string | null
  unread_count?: number
  member_count?: number
}

export interface ChatChannelMember {
  id: string
  agency_id: string
  channel_id: string
  user_id: string
  user_name?: string
  user_avatar?: string
  member_role: MemberRole
  joined_at: string
  last_read_message_id?: string | null
  last_read_at?: string | null
}

export interface ChatConversation {
  id: string
  agency_id: string
  conversation_type: 'direct' | 'group'
  created_at: string
  updated_at: string
  members?: ChatConversationMember[]
  other_user?: {
    id: string
    name: string
    avatar_url?: string
    role?: string
  }
  unread_count?: number
}

export interface ChatConversationMember {
  id: string
  agency_id: string
  conversation_id: string
  user_id: string
  user_name?: string
  user_avatar?: string
  joined_at: string
  last_read_message_id?: string | null
  last_read_at?: string | null
}

export interface ChatAttachment {
  client_id?: string | null
  google_file_id?: string | null
  drive_folder_id?: string | null
  id: string
  agency_id: string
  message_id: string
  storage_path: string
  file_name: string
  mime_type: string
  file_size: number
  uploaded_by?: string | null
  created_at: string
  url?: string
}

export interface ChatReaction {
  id: string
  agency_id: string
  message_id: string
  user_id: string
  user_name?: string
  emoji: string
  created_at: string
}

export interface ChatMention {
  id: string
  agency_id: string
  message_id: string
  mentioned_user_id: string
  mentioned_user_name?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  agency_id: string
  channel_id?: string | null
  conversation_id?: string | null
  sender_id: string
  sender_name?: string
  sender_avatar?: string
  parent_message_id?: string | null
  parent_message?: ChatMessage
  body: string
  message_type: MessageType
  client_message_id?: string | null
  created_at: string
  updated_at: string
  edited_at?: string | null
  deleted_at?: string | null
  attachments?: ChatAttachment[]
  reactions?: ChatReaction[]
  mentions?: ChatMention[]
}
