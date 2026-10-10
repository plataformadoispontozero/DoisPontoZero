# DOIS.ZERO — Documentação do Banco de Dados PostgreSQL (Supabase)

## Migrations Versionadas

1. `20261010000001_phase02_schema_and_rls.sql`
   - Estrutura base multi-agência, autenticação e Permission Studio.
   - Tabelas: `profiles`, `agencies`, `agency_members`, `roles`, `permissions`, `role_permissions`, `agency_invitations`, `agency_settings`, `audit_logs`.
   - Funções de segurança: `is_agency_member()`, `has_agency_permission()`, `is_agency_owner()`, `bootstrap_agency()`.

2. `20261010000002_phase04_projects_tasks.sql`
   - Estrutura de clientes, projetos, quadro Kanban, gestão de tarefas e entregáveis criativos.
   - Tabelas: `clients`, `projects`, `project_members`, `project_boards`, `board_columns`, `tasks`, `task_assignees`, `task_checklists`, `task_checklist_items`, `task_comments`, `task_attachments`, `task_links`, `task_activity`, `task_reviews`.
   - Funções e RPCs: `can_access_project()`, `can_access_task()`, `create_project_with_board()`, `move_task()`, `get_project_progress()`.

3. `20261010000003_phase05_squads.sql`
   - Estrutura de squads criativos, metas de produção, gamificação e rankings.
   - Tabelas: `squads`, `squad_members`, `squad_goals`, `squad_performance_snapshots`, `squad_projects`.
   - Funções e RPCs: `compute_squad_ranking()`, `upsert_performance_snapshot()`.

4. `20261010000004_phase06_briefings.sql`
   - Estrutura completa de briefings criativos, Form Builder e PDF Studio.
   - Tabelas: `briefing_templates`, `briefing_sections`, `briefing_questions`, `briefings`, `briefing_answers`, `briefing_public_links`, `briefing_attachments`, `briefing_versions`, `briefing_exports`, `briefing_activity`.
   - Funções e RPCs: `get_public_briefing()`, `submit_public_briefing()`.

5. `20261010000005_phase07_strategy.sql`
   - Estrutura do Strategy Studio, Pilares Editoriais, Banco de Ideias e Calendário de Pautas.
   - Tabelas: `content_strategies`, `editorial_pillars`, `content_ideas`, `editorial_items`, `strategy_versions`, `strategy_activity`.
   - Funções e RPCs: `get_strategy_overview()`, `generate_editorial_suggestions()`.

6. `20261010000008_phase10_meetings_chat.sql`
   - Estrutura completa de reuniões, atas versionadas, decisões, action items, canais de chat, conversas DMs, realtime, anexos, menções, reações e notificações.
   - Tabelas: `meetings`, `meeting_participants`, `meeting_agenda_items`, `meeting_minutes`, `meeting_decisions`, `meeting_action_items`, `meeting_activity`, `calendar_connections`, `meeting_calendar_events`, `chat_channels`, `chat_channel_members`, `chat_conversations`, `chat_conversation_members`, `chat_messages`, `chat_attachments`, `chat_mentions`, `chat_reactions`, `notifications`.
   - Funções e RPCs: `convert_action_item_to_task()`.

---

## Tabelas da Fase 06 (Briefings & Form Builder)

### `briefing_templates`
- `id`: UUID (Primary Key)
- `agency_id`: UUID (Foreign Key -> agencies.id ON DELETE CASCADE)
- `name`: TEXT NOT NULL
- `description`: TEXT
- `category`: TEXT ('branding', 'social_media', 'motion', 'audiovisual', 'paid_media', 'campaign', 'general', 'custom')
- `status`: TEXT ('draft', 'published', 'archived')
- `version`: INT DEFAULT 1
- `created_by`: UUID (Foreign Key -> auth.users.id)
- `created_at` / `updated_at` / `archived_at`: TIMESTAMPTZ

### `briefing_sections`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `template_id`: UUID (Foreign Key -> briefing_templates.id ON DELETE CASCADE)
- `title`: TEXT NOT NULL
- `description`: TEXT
- `position`: INT DEFAULT 0

### `briefing_questions`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `template_id`: UUID (Foreign Key -> briefing_templates.id ON DELETE CASCADE)
- `section_id`: UUID (Foreign Key -> briefing_sections.id ON DELETE CASCADE)
- `question_key`: TEXT NOT NULL (Identificador semântico para Strategy/Proposal Studio)
- `label`: TEXT NOT NULL
- `description`: TEXT
- `question_type`: TEXT ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'date', 'number', 'url', 'email', 'file_upload')
- `is_required`: BOOLEAN DEFAULT false
- `position`: INT DEFAULT 0
- `options`: JSONB DEFAULT '[]'::jsonb
- `validation_rules`: JSONB DEFAULT '{}'::jsonb

### `briefings`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `client_id`: UUID (Foreign Key -> clients.id ON DELETE SET NULL)
- `template_id`: UUID (Foreign Key -> briefing_templates.id)
- `template_version`: INT DEFAULT 1
- `title`: TEXT NOT NULL
- `description`: TEXT
- `status`: TEXT ('draft', 'sent', 'in_progress', 'submitted', 'under_review', 'approved', 'changes_requested', 'archived')
- `submitted_at` / `approved_at` / `archived_at`: TIMESTAMPTZ

### `briefing_answers`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `briefing_id`: UUID (Foreign Key -> briefings.id ON DELETE CASCADE)
- `question_id`: UUID (Foreign Key -> briefing_questions.id ON DELETE CASCADE)
- `answer_value`: JSONB (Valores primitivos, arrays ou arquivos)
- CONSTRAINT: `unique_briefing_question_answer UNIQUE (briefing_id, question_id)`

### `briefing_public_links`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `briefing_id`: UUID (Foreign Key -> briefings.id ON DELETE CASCADE)
- `token_hash`: TEXT NOT NULL UNIQUE (Hash SHA-256 criptográfico)
- `expires_at`: TIMESTAMPTZ
- `revoked_at`: TIMESTAMPTZ
- `max_submissions`: INT DEFAULT 1
- `submission_count`: INT DEFAULT 0

### `briefing_versions`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `briefing_id`: UUID (Foreign Key -> briefings.id ON DELETE CASCADE)
- `version_number`: INT NOT NULL
- `snapshot`: JSONB NOT NULL (Cópia imutável dos dados e respostas submetidos)

### `briefing_exports`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `briefing_id`: UUID (Foreign Key -> briefings.id ON DELETE CASCADE)
- `version_id`: UUID (Foreign Key -> briefing_versions.id)
- `file_path`: TEXT NOT NULL
- `export_format`: TEXT DEFAULT 'pdf'
- `branding_snapshot`: JSONB (Registro do branding no momento da exportação)

---

## Tabelas da Fase 07 (Strategy Studio & Editorial Generator)

### `content_strategies`
- `id`: UUID (Primary Key)
- `agency_id`: UUID (Foreign Key -> agencies.id ON DELETE CASCADE)
- `client_id`: UUID (Foreign Key -> clients.id ON DELETE SET NULL)
- `briefing_id`: UUID (Foreign Key -> briefings.id ON DELETE SET NULL)
- `name`: TEXT NOT NULL
- `description`: TEXT
- `slug`: TEXT
- `objective`: TEXT
- `target_audience`: TEXT
- `tone_of_voice`: TEXT
- `brand_positioning`: TEXT
- `channels`: TEXT[] DEFAULT '{}'
- `competitors`: TEXT[] DEFAULT '{}'
- `key_messages`: TEXT[] DEFAULT '{}'
- `restrictions`: TEXT[] DEFAULT '{}'
- `visual_references`: JSONB DEFAULT '[]'::jsonb
- `status`: TEXT ('draft', 'active', 'paused', 'completed', 'archived')
- `period_start` / `period_end`: DATE
- `created_by`: UUID (Foreign Key -> auth.users.id)
- `created_at` / `updated_at` / `archived_at`: TIMESTAMPTZ

### `editorial_pillars`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `strategy_id`: UUID (Foreign Key -> content_strategies.id ON DELETE CASCADE)
- `name`: TEXT NOT NULL
- `description`: TEXT
- `color`: TEXT DEFAULT '#7952FF'
- `icon`: TEXT DEFAULT 'Layers'
- `percentage`: NUMERIC(5,2) DEFAULT 0
- `position`: INT DEFAULT 0
- `content_formats`: TEXT[] DEFAULT '{}'
- `posting_frequency`: TEXT
- `example_topics`: TEXT[] DEFAULT '{}'
- `created_at` / `updated_at`: TIMESTAMPTZ

### `content_ideas`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `strategy_id`: UUID (Foreign Key -> content_strategies.id ON DELETE CASCADE)
- `pillar_id`: UUID (Foreign Key -> editorial_pillars.id ON DELETE SET NULL)
- `title`: TEXT NOT NULL
- `description`: TEXT
- `content_format`: TEXT
- `channel`: TEXT
- `hook`: TEXT
- `cta`: TEXT
- `hashtags`: TEXT[] DEFAULT '{}'
- `references`: JSONB DEFAULT '[]'::jsonb
- `status`: TEXT ('idea', 'approved', 'in_production', 'scheduled', 'published', 'discarded')
- `priority`: TEXT ('low', 'normal', 'high', 'urgent')
- `task_id`: UUID (Foreign Key -> tasks.id ON DELETE SET NULL)
- `editorial_item_id`: UUID (Foreign Key -> editorial_items.id ON DELETE SET NULL)
- `suggested_by`: TEXT ('manual', 'briefing_intelligence', 'editorial_engine')
- `created_by`: UUID
- `created_at` / `updated_at`: TIMESTAMPTZ

### `editorial_items`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `strategy_id`: UUID (Foreign Key -> content_strategies.id ON DELETE CASCADE)
- `pillar_id`: UUID (Foreign Key -> editorial_pillars.id ON DELETE SET NULL)
- `idea_id`: UUID (Foreign Key -> content_ideas.id ON DELETE SET NULL)
- `title`: TEXT NOT NULL
- `description`: TEXT
- `content_format`: TEXT
- `channel`: TEXT
- `copy_text`: TEXT
- `hook`: TEXT
- `cta`: TEXT
- `hashtags`: TEXT[] DEFAULT '{}'
- `visual_notes`: TEXT
- `scheduled_date`: DATE
- `scheduled_time`: TIME
- `publish_date`: TIMESTAMPTZ
- `status`: TEXT ('draft', 'in_review', 'approved', 'scheduled', 'published', 'paused')
- `task_id`: UUID (Foreign Key -> tasks.id ON DELETE SET NULL)
- `created_by`: UUID
- `created_at` / `updated_at`: TIMESTAMPTZ

### `strategy_versions`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `strategy_id`: UUID (Foreign Key -> content_strategies.id ON DELETE CASCADE)
- `version_number`: INT NOT NULL
- `snapshot`: JSONB NOT NULL
- `notes`: TEXT
- `created_by`: UUID
- `created_at`: TIMESTAMPTZ

### `strategy_activity`
- `id`: UUID (Primary Key)
- `agency_id`: UUID
- `strategy_id`: UUID (Foreign Key -> content_strategies.id ON DELETE CASCADE)
- `actor_user_id`: UUID
- `action`: TEXT NOT NULL
- `metadata`: JSONB DEFAULT '{}'::jsonb
- `created_at`: TIMESTAMPTZ

---

## Políticas Row Level Security (RLS)

Todas as tabelas contam com políticas estritas de isolamento:
- `SELECT`: Apenas usuários pertencentes à mesma agência (`is_agency_member(agency_id)`).
- `INSERT`: Restrito a membros com permissões apropriadas (`briefings.create`, `briefings.manage_templates`).
- `UPDATE`: Restrito a membros com permissão de edição (`briefings.edit`, `briefings.manage_templates`).
- `DELETE`: Restrito a membros com permissão de exclusão (`briefings.delete`).
- `RPCs Públicas`: Validação via tokens hash criptografados sem expor tabelas privadas para leitura irrestrita.
