# DOIS.ZERO | Google Calendar Integration

## 1. Overview
The optional Google Calendar integration allows agency members to link their Google Calendar accounts to automatically sync scheduled meetings, receive calendar invitations, and open Google Meet links directly from the Meeting Hub.

## 2. Routes & Interface
- `/settings/integrations/calendar`: Dedicated Google Calendar integration settings page.

## 3. Data Model
- `calendar_connections`: Stores Google OAuth connection state (`connected`, `expired`, `revoked`, `error`) per user and agency. Sensitive refresh tokens are stored securely server-side.
- `meeting_calendar_events`: Tracks external event IDs (`external_event_id`), calendar IDs, sync status (`synced`, `pending`, `error`), and last synced timestamp.

## 4. Fallback Behavior
The Meeting Hub is fully functional without Google Calendar connected. When OAuth credentials are not configured, UI indicates integration status as disconnected/unconfigured without breaking meeting management workflows.
