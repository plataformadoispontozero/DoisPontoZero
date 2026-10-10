# DOIS.ZERO | Meeting Hub

## 1. Overview
The Meeting Hub is the central module for organizing creative agency meetings, structured agenda items, official minutes with imutability versioning, decisions, and action items.

Action items can be converted into operational Kanban tasks with a single click in a transactional manner (`convert_action_item_to_task` RPC).

## 2. Routes
- `/meetings`: Main Meeting Hub Dashboard with KPIs, filters, agenda/list/calendar toggle views, and search.
- `/meetings/new`: Meeting Scheduling Form with time, timezone, client, project, location, URL, and internal/external participants validation.
- `/meetings/:meetingId`: Meeting Workspace with 5 dedicated tabs:
  - **Visão Geral**: Header info, organizer, location, client, project, participants list.
  - **Pauta**: Agenda items editor with reordering and duration tracking.
  - **Ata**: Structured minutes editor supporting Draft and Finalized states with version history.
  - **Decisões**: Record decisions made during meetings with active/superseded/cancelled statuses.
  - **Ações**: Action items with 1-click Kanban task conversion.

## 3. Data Model
- `meetings`: Core meeting record linked to `agency_id`, `client_id`, and `project_id`.
- `meeting_participants`: Internal agency members or external guest participants with response statuses.
- `meeting_agenda_items`: Ordered agenda items with estimated durations.
- `meeting_minutes`: Versioned meeting minutes supporting draft and finalized states.
- `meeting_decisions`: Formally recorded decisions.
- `meeting_action_items`: Action items with links to created Kanban `task_id`s.
- `meeting_activity`: Audit log for all meeting-related events.

## 4. Multi-Tenant RLS & Security
All meeting tables feature strict Row-Level Security policies enforcing `agency_id` validation via authenticated user profile checks.
