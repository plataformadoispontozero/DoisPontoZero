export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      agencies: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          symbol_url: string | null
          status: 'active' | 'suspended' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          symbol_url?: string | null
          status?: 'active' | 'suspended' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          symbol_url?: string | null
          status?: 'active' | 'suspended' | 'archived'
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          agency_id: string
          name: string
          description: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          name: string
          description?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          name?: string
          description?: string | null
          is_system?: boolean
        }
      }
      agency_members: {
        Row: {
          id: string
          agency_id: string
          user_id: string
          role_id: string
          status: 'active' | 'invited' | 'suspended'
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          user_id: string
          role_id: string
          status?: 'active' | 'invited' | 'suspended'
          joined_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          user_id?: string
          role_id?: string
          status?: 'active' | 'invited' | 'suspended'
        }
      }
      permissions: {
        Row: {
          id: string
          permission_key: string
          module: string
          description: string
        }
        Insert: {
          id?: string
          permission_key: string
          module: string
          description: string
        }
        Update: {
          id?: string
          permission_key?: string
          module?: string
          description?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          allowed: boolean
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          allowed?: boolean
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          allowed?: boolean
        }
      }
      agency_invitations: {
        Row: {
          id: string
          agency_id: string
          email: string
          role_id: string
          invited_by: string
          token_hash: string
          expires_at: string
          accepted_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          email: string
          role_id: string
          invited_by: string
          token_hash: string
          expires_at: string
          accepted_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role_id?: string
          expires_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
        }
      }
      agency_settings: {
        Row: {
          id: string
          agency_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          settings?: Json
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          agency_id: string
          actor_user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          actor_user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          agency_id: string
          name: string
          slug: string
          logo_url: string | null
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          name: string
          slug: string
          logo_url?: string | null
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          status?: 'active' | 'archived'
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          agency_id: string
          client_id: string | null
          name: string
          slug: string
          description: string | null
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          start_date: string | null
          due_date: string | null
          completed_at: string | null
          archived_at: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          client_id?: string | null
          name: string
          slug: string
          description?: string | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          archived_at?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          client_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          archived_at?: string | null
          owner_id?: string | null
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'lead' | 'member' | 'reviewer' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'lead' | 'member' | 'reviewer' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'lead' | 'member' | 'reviewer' | 'viewer'
        }
      }
      project_boards: {
        Row: {
          id: string
          agency_id: string
          project_id: string
          name: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          project_id: string
          name?: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          project_id?: string
          name?: string
          is_default?: boolean
        }
      }
      board_columns: {
        Row: {
          id: string
          agency_id: string
          board_id: string
          name: string
          color: string
          position: number
          category: 'backlog' | 'in_progress' | 'review' | 'done'
          wip_limit: number | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          board_id: string
          name: string
          color?: string
          position: number
          category?: 'backlog' | 'in_progress' | 'review' | 'done'
          wip_limit?: number | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          board_id?: string
          name?: string
          color?: string
          position?: number
          category?: 'backlog' | 'in_progress' | 'review' | 'done'
          wip_limit?: number | null
          is_system?: boolean
        }
      }
      tasks: {
        Row: {
          id: string
          agency_id: string
          project_id: string
          board_id: string
          column_id: string
          parent_task_id: string | null
          title: string
          description: string | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
          status: 'open' | 'in_progress' | 'review' | 'done' | 'archived'
          position: number
          start_date: string | null
          due_date: string | null
          completed_at: string | null
          archived_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          project_id: string
          board_id: string
          column_id: string
          parent_task_id?: string | null
          title: string
          description?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'review' | 'done' | 'archived'
          position: number
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          archived_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          project_id?: string
          board_id?: string
          column_id?: string
          parent_task_id?: string | null
          title?: string
          description?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'review' | 'done' | 'archived'
          position?: number
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          archived_at?: string | null
          created_by?: string | null
          updated_at?: string
        }
      }
      task_assignees: {
        Row: {
          id: string
          agency_id: string
          task_id: string
          user_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          task_id: string
          user_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          task_id?: string
          user_id?: string
        }
      }
      task_checklists: {
        Row: {
          id: string
          agency_id: string
          task_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          task_id: string
          title: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          task_id?: string
          title?: string
          position?: number
        }
      }
      task_checklist_items: {
        Row: {
          id: string
          agency_id: string
          checklist_id: string
          title: string
          is_completed: boolean
          completed_by: string | null
          completed_at: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          checklist_id: string
          title: string
          is_completed?: boolean
          completed_by?: string | null
          completed_at?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          checklist_id?: string
          title?: string
          is_completed?: boolean
          completed_by?: string | null
          completed_at?: string | null
          position?: number
        }
      }
      task_comments: {
        Row: {
          id: string
          agency_id: string
          task_id: string
          author_id: string
          content: string
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          task_id: string
          author_id: string
          content: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          task_id?: string
          author_id?: string
          content?: string
          deleted_at?: string | null
          updated_at?: string
        }
      }
      task_attachments: {
        Row: {
          id: string
          agency_id: string
          task_id: string
          storage_path: string
          name: string
          size_bytes: number
          mime_type: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          task_id: string
          storage_path: string
          name: string
          size_bytes: number
          mime_type: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          task_id?: string
          storage_path?: string
          name?: string
          size_bytes?: number
          mime_type?: string
          uploaded_by?: string
        }
      }
      task_links: {
        Row: {
          id: string
          agency_id: string
          task_id: string
          url: string
          title: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          task_id: string
          url: string
          title: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          task_id?: string
          url?: string
          title?: string
          created_by?: string
        }
      }
      task_activity: {
        Row: {
          id: string
          agency_id: string
          task_id: string
          actor_user_id: string | null
          action: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          task_id: string
          actor_user_id?: string | null
          action: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          task_id?: string
          actor_user_id?: string | null
          action?: string
          metadata?: Json
        }
      }
      task_reviews: {
        Row: {
          id: string
          agency_id: string
          task_id: string
          status: 'pending' | 'approved' | 'changes_requested'
          feedback: string | null
          reviewer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          task_id: string
          status?: 'pending' | 'approved' | 'changes_requested'
          feedback?: string | null
          reviewer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          task_id?: string
          status?: 'pending' | 'approved' | 'changes_requested'
          feedback?: string | null
          reviewer_id?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      create_project_with_board: {
        Args: {
          p_agency_id: string
          p_name: string
          p_description?: string | null
          p_priority?: string
          p_status?: string
          p_start_date?: string | null
          p_due_date?: string | null
          p_client_id?: string | null
        }
        Returns: string
      }
      move_task: {
        Args: {
          p_task_id: string
          p_column_id: string
          p_position: number
        }
        Returns: void
      }
      get_project_progress: {
        Args: {
          p_project_id: string
        }
        Returns: {
          total_tasks: number
          completed_tasks: number
          in_progress_tasks: number
          review_tasks: number
          progress_percent: number
        }[]
      }
    }
  }
}

