# DOIS.ZERO | Realtime Architecture

## 1. Overview
The Realtime architecture powers instant message delivery, reaction updates, unread notification badges, and online presence indicators using Supabase Realtime (WebSockets) backed by PostgreSQL.

## 2. Subscription Flow
```
User sends message / reaction
       ↓
PostgreSQL validates RLS & inserts record
       ↓
Supabase Realtime engine broadcasts payload
       ↓
TanStack Query client receives payload & invalidates target key
       ↓
UI updates smoothly without full page refresh
```

## 3. Subscription Scoping & Cleanup
- Subscriptions are strictly scoped to the active `channel_id` or `conversation_id`.
- `useEffect` cleanup handlers invoke `supabase.removeChannel(channel)` when switching conversations or unmounting components to avoid memory leaks.
- Realtime events act as signaling; PostgreSQL remains the immutable source of truth.
