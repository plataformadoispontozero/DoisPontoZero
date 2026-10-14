-- Preserve the obsolete implementation but remove its unguarded API entry point.
-- The current two-argument transactional conversion remains untouched.
revoke all on function public.convert_action_item_to_task(uuid,uuid,uuid,timestamptz) from public,anon,authenticated;
alter function public.convert_action_item_to_task(uuid,uuid,uuid,timestamptz) set schema private;
alter function private.convert_action_item_to_task(uuid,uuid,uuid,timestamptz) rename to legacy_convert_action_item_to_task;
alter function private.legacy_convert_action_item_to_task(uuid,uuid,uuid,timestamptz) set search_path='public';
