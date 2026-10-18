// Generated from the live Supabase schema after office phase 03; scoped to reused office data.
export type Json = string | number | boolean | null | { [key:string]: Json | undefined } | Json[]
export type OfficeDatabase = { public: { Tables: {
      chat_channels: {
        Row: {
          agency_id: string
          archived_at: string | null
          channel_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          office_enabled: boolean
          project_id: string | null
          squad_id: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          agency_id: string
          archived_at?: string | null
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          office_enabled?: boolean
          project_id?: string | null
          squad_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          agency_id?: string
          archived_at?: string | null
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          office_enabled?: boolean
          project_id?: string | null
          squad_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_preferences: {
        Row: {
          agency_id: string
          direct_notifications: boolean
          mention_notifications: boolean
          office_auto_join: boolean
          office_camera_id: string | null
          office_do_not_disturb: boolean
          office_microphone_id: string | null
          office_preferred_room: string | null
          office_speaker_id: string | null
          user_id: string
        }
        Insert: {
          agency_id: string
          direct_notifications?: boolean
          mention_notifications?: boolean
          office_auto_join?: boolean
          office_camera_id?: string | null
          office_do_not_disturb?: boolean
          office_microphone_id?: string | null
          office_preferred_room?: string | null
          office_speaker_id?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string
          direct_notifications?: boolean
          mention_notifications?: boolean
          office_auto_join?: boolean
          office_camera_id?: string | null
          office_do_not_disturb?: boolean
          office_microphone_id?: string | null
          office_preferred_room?: string | null
          office_speaker_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_preferences_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_preferences_office_preferred_room_fkey"
            columns: ["office_preferred_room"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      office_voice_invitations: {
        Row: { accepted_at:string|null;agency_id:string;caller_id:string;created_at:string;expires_at:string;id:string;recipient_id:string;resolved_at:string|null;status:'pending'|'accepted'|'declined'|'cancelled'|'expired'|'ended' }
        Insert: { accepted_at?:string|null;agency_id:string;caller_id:string;created_at?:string;expires_at?:string;id?:string;recipient_id:string;resolved_at?:string|null;status?:'pending'|'accepted'|'declined'|'cancelled'|'expired'|'ended' }
        Update: { accepted_at?:string|null;agency_id?:string;caller_id?:string;created_at?:string;expires_at?:string;id?:string;recipient_id?:string;resolved_at?:string|null;status?:'pending'|'accepted'|'declined'|'cancelled'|'expired'|'ended' }
        Relationships: []
      }
}; Functions: {
      office_configure_room: {
        Args: { p_agency: string; p_enabled: boolean; p_room: string }
        Returns: undefined
      }
      office_directory: { Args: { p_agency: string }; Returns: Json }
      office_presence_directory: { Args: { p_agency: string }; Returns: Json }
      office_voice_invite_send: { Args: { p_agency:string;p_recipient:string }; Returns: Json }
      office_voice_invite_directory: { Args: { p_agency:string }; Returns: Json }
      office_voice_invite_respond: { Args: { p_invitation:string;p_response:string }; Returns: Json }
      office_voice_set_do_not_disturb: { Args: { p_agency:string;p_enabled:boolean }; Returns: undefined }
      office_voice_context: { Args: { p_room:string;p_consume?:boolean }; Returns: Json }
} } }
