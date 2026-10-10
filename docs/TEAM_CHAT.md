# DOIS.ZERO | Team Chat

## 1. Overview
Team Chat provides real-time agency communication across public agency channels, squad channels, project channels, custom group channels, and direct messages (DMs).

## 2. Routes & Navigation
- `/chat`: Main Team Chat interface with conversation sidebar, active chat header, scrollable message stream, attachments preview, emoji reactions, and message composer.
- `/chat/channels/:channelId`: Direct link to specific channel discussion.
- `/chat/direct/:conversationId`: Direct link to specific direct message thread.
- `/chat/settings`: Channel creation, archive management, member management, and notification preferences.

## 3. Data Model
- `chat_channels`: Agency channels supporting `general`, `squad`, `project`, and `custom` types.
- `chat_channel_members`: Memberships with `owner`, `moderator`, and `member` roles.
- `chat_conversations`: Direct message threads (`direct` or `group`).
- `chat_conversation_members`: DM participants.
- `chat_messages`: Text, file, or system messages bound to a channel OR conversation.
- `chat_attachments`: Private file attachments uploaded to Supabase Storage.
- `chat_mentions`: User `@` mentions triggering notifications.
- `chat_reactions`: Emoji reactions per message.

## 4. Security & RLS
Private channels and DM threads check membership tables before allowing SELECT or INSERT queries. `agency_id` must match the user's active agency profile.
