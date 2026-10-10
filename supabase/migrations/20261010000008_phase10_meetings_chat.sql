-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- FASE 10: MEETING HUB + TEAM CHAT MIGRATION
-- Multi-tenant schema with RLS, Realtime & Transactional RPCs
-- ============================================================

-- ------------------------------------------------------------
-- 1. MEETING HUB TABLES
-- ------------------------------------------------------------

-- A. Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'internal' CHECK (meeting_type IN ('internal', 'client', 'project', 'planning', 'review', 'other')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  location_type TEXT NOT NULL DEFAULT 'online' CHECK (location_type IN ('online', 'in_person', 'hybrid')),
  location_text TEXT,
  meeting_url TEXT,
  organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  CONSTRAINT chk_meeting_dates CHECK (ends_at > starts_at)
);

-- B. Meeting Participants
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  external_name TEXT,
  external_email TEXT,
  participant_type TEXT NOT NULL DEFAULT 'internal' CHECK (participant_type IN ('internal', 'external')),
  response_status TEXT NOT NULL DEFAULT 'pending' CHECK (response_status IN ('pending', 'accepted', 'declined', 'tentative')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C. Meeting Agenda Items
CREATE TABLE IF NOT EXISTS meeting_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 15,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D. Meeting Minutes (Atas)
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ
);

-- E. Meeting Decisions
CREATE TABLE IF NOT EXISTS meeting_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  decision_status TEXT NOT NULL DEFAULT 'active' CHECK (decision_status IN ('active', 'superseded', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- F. Meeting Action Items
CREATE TABLE IF NOT EXISTS meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES meeting_decisions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'completed', 'cancelled')),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- G. Meeting Activity Log
CREATE TABLE IF NOT EXISTS meeting_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. GOOGLE CALENDAR INTEGRATION TABLES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  google_account_id TEXT NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'revoked', 'error')),
  scopes TEXT[] DEFAULT ARRAY['https://www.googleapis.com/auth/calendar.events'],
  token_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_calendar UNIQUE (agency_id, user_id, google_account_id)
);

CREATE TABLE IF NOT EXISTS meeting_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  external_calendar_id TEXT NOT NULL DEFAULT 'primary',
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'error', 'disconnected')),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_meeting_calendar_event UNIQUE (meeting_id, external_event_id)
);

-- ------------------------------------------------------------
-- 3. TEAM CHAT TABLES
-- ------------------------------------------------------------

-- A. Chat Channels
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'general' CHECK (channel_type IN ('general', 'squad', 'project', 'custom')),
  visibility TEXT NOT NULL DEFAULT 'agency' CHECK (visibility IN ('agency', 'private')),
  squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- B. Chat Channel Members
CREATE TABLE IF NOT EXISTS chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'member' CHECK (member_role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ,
  CONSTRAINT uq_channel_member UNIQUE (channel_id, user_id)
);

-- C. Direct & Group Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D. Conversation Members
CREATE TABLE IF NOT EXISTS chat_conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ,
  CONSTRAINT uq_conversation_member UNIQUE (conversation_id, user_id)
);

-- E. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  client_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_message_target CHECK (
    (channel_id IS NOT NULL AND conversation_id IS NULL) OR
    (channel_id IS NULL AND conversation_id IS NOT NULL)
  )
);

-- F. Attachments
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- G. Mentions
CREATE TABLE IF NOT EXISTS chat_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_message_mention UNIQUE (message_id, mentioned_user_id)
);

-- H. Reactions
CREATE TABLE IF NOT EXISTS chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_message_reaction UNIQUE (message_id, user_id, emoji)
);

-- ------------------------------------------------------------
-- 4. NOTIFICATIONS TABLE
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('meeting_invitation', 'meeting_updated', 'meeting_cancelled', 'meeting_action_assigned', 'chat_mention', 'chat_direct_message', 'chat_channel_message')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read_at, created_at DESC);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Meetings Policies
CREATE POLICY "Meetings isolation policy" ON meetings
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Meeting participants isolation policy" ON meeting_participants
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Meeting agenda items isolation policy" ON meeting_agenda_items
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Meeting minutes isolation policy" ON meeting_minutes
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Meeting decisions isolation policy" ON meeting_decisions
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Meeting action items isolation policy" ON meeting_action_items
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Meeting activity isolation policy" ON meeting_activity
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Calendar connections isolation policy" ON calendar_connections
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Meeting calendar events isolation policy" ON meeting_calendar_events
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

-- Chat & Notifications Policies
CREATE POLICY "Chat channels isolation policy" ON chat_channels
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Chat channel members isolation policy" ON chat_channel_members
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Chat conversations isolation policy" ON chat_conversations
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Chat conversation members isolation policy" ON chat_conversation_members
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Chat messages isolation policy" ON chat_messages
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Chat attachments isolation policy" ON chat_attachments
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Chat mentions isolation policy" ON chat_mentions
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Chat reactions isolation policy" ON chat_reactions
  FOR ALL USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Notifications recipient policy" ON notifications
  FOR ALL USING (recipient_id = auth.uid());

-- ------------------------------------------------------------
-- 6. TRANSACTIONAL RPC FUNCTION
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION convert_action_item_to_task(
  p_action_item_id UUID,
  p_project_id UUID,
  p_assigned_to UUID DEFAULT NULL,
  p_due_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_item record;
  v_new_task_id UUID;
  v_board_id UUID;
  v_column_id UUID;
BEGIN
  SELECT * INTO v_action_item FROM meeting_action_items WHERE id = p_action_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Action Item not found';
  END IF;

  IF v_action_item.task_id IS NOT NULL THEN
    RETURN v_action_item.task_id;
  END IF;

  -- Find board and column for project
  SELECT id INTO v_board_id FROM project_boards WHERE project_id = p_project_id LIMIT 1;
  IF v_board_id IS NOT NULL THEN
    SELECT id INTO v_column_id FROM board_columns WHERE board_id = v_board_id ORDER BY position ASC LIMIT 1;
  END IF;

  -- Create task
  INSERT INTO tasks (
    agency_id,
    project_id,
    board_id,
    column_id,
    title,
    description,
    assignee_id,
    due_date,
    status
  ) VALUES (
    v_action_item.agency_id,
    p_project_id,
    v_board_id,
    v_column_id,
    v_action_item.title,
    COALESCE(v_action_item.description, 'Derivado de decisão de reunião'),
    COALESCE(p_assigned_to, v_action_item.assigned_to),
    COALESCE(p_due_at, v_action_item.due_at),
    'todo'
  ) RETURNING id INTO v_new_task_id;

  -- Update action item
  UPDATE meeting_action_items
  SET task_id = v_new_task_id, status = 'converted', updated_at = NOW()
  WHERE id = p_action_item_id;

  -- Log activity
  INSERT INTO meeting_activity (
    agency_id,
    meeting_id,
    actor_user_id,
    action,
    metadata
  ) VALUES (
    v_action_item.agency_id,
    v_action_item.meeting_id,
    auth.uid(),
    'task_created',
    jsonb_build_object('action_item_id', p_action_item_id, 'task_id', v_new_task_id)
  );

  RETURN v_new_task_id;
END;
$$;
