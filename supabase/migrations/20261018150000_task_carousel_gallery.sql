-- Expose every authorized image from a demand so carousel cards can navigate them.
create or replace function private.get_task_card_covers(p_tasks uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sessão necessária' using errcode='42501';end if;
 if coalesce(cardinality(p_tasks),0)>500 then raise exception 'Selecione até 500 demandas';end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
  'task_id',t.id,
  'attachment_id',a.id,
  'file_name',a.file_name,
  'selected',c.attachment_id is not null,
  'gallery',(select coalesce(jsonb_agg(jsonb_build_object('attachment_id',f.id,'file_name',f.file_name) order by (f.id=c.attachment_id) desc,f.created_at,f.id),'[]'::jsonb)
   from public.task_attachments f
   where f.task_id=t.id and f.agency_id=t.agency_id and f.storage_provider='google_drive'
    and (f.mime_type in ('image/png','image/jpeg','image/webp','image/gif','image/avif') or f.preview_google_file_id is not null))
 )) from public.tasks t
 left join public.task_card_covers c on c.task_id=t.id and c.agency_id=t.agency_id
 cross join lateral(select f.id,f.file_name from public.task_attachments f where f.task_id=t.id and f.agency_id=t.agency_id and f.storage_provider='google_drive' and (f.mime_type in ('image/png','image/jpeg','image/webp','image/gif','image/avif') or f.preview_google_file_id is not null) order by (f.id=c.attachment_id) desc nulls last,f.created_at,f.id limit 1) a
 where t.id=any(p_tasks) and private.can_task_drive(t.id,false)),'[]'::jsonb);
end $$;
revoke all on function private.get_task_card_covers(uuid[]) from public,anon;
grant execute on function private.get_task_card_covers(uuid[]) to authenticated;
