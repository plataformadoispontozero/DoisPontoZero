-- Only a selected attachment reference is stored. Drive bytes remain private.
create table public.task_card_covers (
 task_id uuid primary key references public.tasks(id) on delete cascade,
 agency_id uuid not null references public.agencies(id) on delete cascade,
 attachment_id uuid not null references public.task_attachments(id) on delete cascade,
 updated_at timestamptz not null default now()
);
create index task_card_covers_attachment_idx on public.task_card_covers(attachment_id);
create index task_card_covers_agency_idx on public.task_card_covers(agency_id);
alter table public.task_card_covers enable row level security;
revoke all on public.task_card_covers from public,anon,authenticated;
grant select on public.task_card_covers to authenticated;
create policy task_cover_read on public.task_card_covers for select to authenticated using(private.can_task_drive(task_id,false));
create function private.set_task_card_cover(p_task uuid,p_attachment uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_agency uuid;
begin
 if not private.can_task_drive(p_task,true) then raise exception 'Sem permissão para editar esta demanda' using errcode='42501'; end if;
 select agency_id into v_agency from public.tasks where id=p_task for update;
 if p_attachment is null then delete from public.task_card_covers where task_id=p_task;return;end if;
 if not exists(select 1 from public.task_attachments a where a.id=p_attachment and a.task_id=p_task and a.agency_id=v_agency and a.storage_provider='google_drive' and (a.mime_type in ('image/png','image/jpeg','image/webp','image/gif','image/avif') or a.preview_google_file_id is not null)) then raise exception 'Selecione uma imagem desta demanda' using errcode='23514';end if;
 insert into public.task_card_covers(task_id,agency_id,attachment_id) values(p_task,v_agency,p_attachment) on conflict(task_id) do update set attachment_id=excluded.attachment_id,updated_at=now();
end $$;
revoke all on function private.set_task_card_cover(uuid,uuid) from public,anon;
grant execute on function private.set_task_card_cover(uuid,uuid) to authenticated;
create function private.get_task_card_covers(p_tasks uuid[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sessão necessária' using errcode='42501';end if;
 if coalesce(cardinality(p_tasks),0)>500 then raise exception 'Selecione até 500 demandas';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('task_id',t.id,'attachment_id',a.id,'file_name',a.file_name,'selected',c.attachment_id is not null))
 from public.tasks t left join public.task_card_covers c on c.task_id=t.id and c.agency_id=t.agency_id
 cross join lateral(select f.id,f.file_name from public.task_attachments f where f.task_id=t.id and f.agency_id=t.agency_id and f.storage_provider='google_drive' and (f.mime_type in ('image/png','image/jpeg','image/webp','image/gif','image/avif') or f.preview_google_file_id is not null) order by (f.id=c.attachment_id) desc nulls last,f.created_at,f.id limit 1) a
 where t.id=any(p_tasks) and private.can_task_drive(t.id,false)),'[]'::jsonb);
end $$;
revoke all on function private.get_task_card_covers(uuid[]) from public,anon;
grant execute on function private.get_task_card_covers(uuid[]) to authenticated;

create function public.set_task_card_cover(p_task uuid,p_attachment uuid) returns void language sql security invoker set search_path='' as $$select private.set_task_card_cover(p_task,p_attachment)$$;
create function public.get_task_card_covers(p_tasks uuid[]) returns jsonb language sql stable security invoker set search_path='' as $$select private.get_task_card_covers(p_tasks)$$;
revoke all on function public.set_task_card_cover(uuid,uuid),public.get_task_card_covers(uuid[]) from public,anon;
grant execute on function public.set_task_card_cover(uuid,uuid),public.get_task_card_covers(uuid[]) to authenticated;
