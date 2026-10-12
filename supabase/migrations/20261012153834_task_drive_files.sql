-- Reuse task attachments. Drive originals and previews never enter Postgres.
alter table public.tasks add column google_drive_folder_id text check(google_drive_folder_id is null or google_drive_folder_id ~ '^[A-Za-z0-9_-]{10,200}$');
alter table public.task_attachments add column storage_provider text not null default 'supabase' check(storage_provider in ('supabase','google_drive')),add column client_id uuid references public.clients(id),add column google_file_id text,add column google_folder_id text,add column google_file_version text,add column preview_google_file_id text,add column preview_google_file_version text,add column google_drive_url text;
alter table public.task_attachments add constraint task_drive_metadata check(storage_provider<>'google_drive' or (client_id is not null and google_file_id is not null and google_folder_id is not null and google_file_id ~ '^[A-Za-z0-9_-]{10,200}$' and google_folder_id ~ '^[A-Za-z0-9_-]{10,200}$' and storage_path='drive:'||google_file_id and mime_type is not null and google_file_version is not null and file_size is not null and file_size between 1 and 524288000));
create unique index task_drive_file_unique on public.task_attachments(task_id,google_file_id) where storage_provider='google_drive';
create table private.task_drive_uploads(id uuid primary key default gen_random_uuid(),agency_id uuid not null references public.agencies(id),task_id uuid not null references public.tasks(id) on delete cascade,client_id uuid not null references public.clients(id),folder_id text not null,file_name text not null,mime_type text not null,file_size bigint not null,uploaded_by uuid not null references public.profiles(id),kind text not null check(kind in ('original','preview')),attachment_id uuid references public.task_attachments(id) on delete cascade,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '1 hour',completed_file_id text,check((kind='original' and attachment_id is null) or (kind='preview' and attachment_id is not null)));
alter table private.task_drive_uploads enable row level security;
revoke all on private.task_drive_uploads from public,anon,authenticated;
grant all on private.task_drive_uploads to service_role;
create function private.can_task_drive(p_task uuid,p_write boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.tasks t join public.projects p on p.id=t.project_id and p.agency_id=t.agency_id join public.clients c on c.id=p.client_id and c.agency_id=t.agency_id join public.agency_members m on m.agency_id=t.agency_id and m.user_id=auth.uid() and m.status='active' join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id join public.agencies a on a.id=m.agency_id and a.status='active' where t.id=p_task and t.archived_at is null and private.can_editorial(t.agency_id,'clients.view') and private.can_editorial(t.agency_id,case when p_write then 'tasks.edit' else 'tasks.view' end) and (r.name in ('OWNER','ADMIN','MANAGER') or exists(select 1 from public.task_assignees ta where ta.task_id=t.id and ta.agency_id=t.agency_id and ta.user_id=auth.uid())));
$$;
revoke all on function private.can_task_drive(uuid,boolean) from public,anon;
grant execute on function private.can_task_drive(uuid,boolean) to authenticated;
create function private.task_drive_context(p_agency uuid,p_task uuid,p_write boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.can_task_drive(p_task,p_write) then raise exception 'Acesso à demanda atribuída necessário' using errcode='42501';end if;
 return (select jsonb_build_object('taskId',t.id,'agencyId',t.agency_id,'clientId',c.id,'clientName',c.name,'clientDriveUrl',c.profile->>'drive_url','savedFolderId',t.google_drive_folder_id,'dueDate',t.due_date,'editorialMonth',(select case when count(distinct ec.month)=1 then min(ec.month) else null end from public.monthly_editorial_campaigns ec where ec.project_id=t.project_id and ec.agency_id=t.agency_id and ec.client_id=c.id),'canManage',private.can_task_drive(t.id,true)) from public.tasks t join public.projects p on p.id=t.project_id and p.agency_id=t.agency_id join public.clients c on c.id=p.client_id and c.agency_id=t.agency_id where t.id=p_task and t.agency_id=p_agency);
end;$$;
create function public.task_drive_context(p_agency uuid,p_task uuid,p_write boolean default false) returns jsonb language sql stable security invoker set search_path='' as $$select private.task_drive_context(p_agency,p_task,p_write)$$;
revoke all on function private.task_drive_context(uuid,uuid,boolean),public.task_drive_context(uuid,uuid,boolean) from public,anon;
grant execute on function private.task_drive_context(uuid,uuid,boolean),public.task_drive_context(uuid,uuid,boolean) to authenticated;
create policy task_drive_attachment_assigned_read on public.task_attachments for select to authenticated using(storage_provider='google_drive' and private.can_task_drive(task_id,false));
create policy task_drive_attachment_read on public.task_attachments as restrictive for select to authenticated using(storage_provider<>'google_drive' or private.can_task_drive(task_id,false));
create policy task_drive_attachment_no_direct_insert on public.task_attachments as restrictive for insert to authenticated with check(storage_provider<>'google_drive');
create policy task_drive_attachment_no_direct_update on public.task_attachments as restrictive for update to authenticated using(storage_provider<>'google_drive') with check(storage_provider<>'google_drive');
create policy task_drive_attachment_no_direct_delete on public.task_attachments as restrictive for delete to authenticated using(storage_provider<>'google_drive');
create function private.validate_task_drive_metadata() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='tasks' then
  if auth.uid() is not null and ((tg_op='INSERT' and new.google_drive_folder_id is not null) or (tg_op='UPDATE' and new.google_drive_folder_id is distinct from old.google_drive_folder_id)) then raise exception 'Selecione destino pelo serviço Drive da demanda' using errcode='42501';end if;
 else
  if auth.uid() is not null and (new.storage_provider='google_drive' or (tg_op='UPDATE' and old.storage_provider='google_drive')) then raise exception 'Metadados Drive somente pelo serviço autorizado' using errcode='42501';end if;
  if new.storage_provider='google_drive' and not exists(select 1 from public.tasks t join public.projects p on p.id=t.project_id and p.agency_id=t.agency_id join public.clients c on c.id=p.client_id and c.agency_id=t.agency_id where t.id=new.task_id and t.agency_id=new.agency_id and c.id=new.client_id) then raise exception 'Arquivo não corresponde ao cliente da demanda' using errcode='23514';end if;
 end if;return new;
end;$$;
revoke all on function private.validate_task_drive_metadata() from public,anon,authenticated;
create trigger validate_task_drive_destination before insert or update on public.tasks for each row execute function private.validate_task_drive_metadata();
create trigger validate_task_drive_attachment before insert or update on public.task_attachments for each row execute function private.validate_task_drive_metadata();
-- Finalization is atomic and retryable; the Edge service must validate the actual Google file first.
create function private.finish_task_drive_upload(p_upload uuid,p_user uuid,p_google_file_id text,p_version text,p_drive_url text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u private.task_drive_uploads%rowtype;a public.task_attachments%rowtype;
begin
 select * into u from private.task_drive_uploads where id=p_upload and uploaded_by=p_user for update;
 if not found or (u.completed_file_id is null and u.expires_at<now()) then raise exception 'Sessão de envio expirada ou inválida' using errcode='42501';end if;
 if p_google_file_id is null or p_drive_url is null or p_google_file_id !~ '^[A-Za-z0-9_-]{10,200}$' or coalesce(p_version,'')='' or p_drive_url<>'https://drive.google.com/file/d/'||p_google_file_id||'/view' then raise exception 'Metadados de arquivo inválidos';end if;
 if u.completed_file_id is not null and u.completed_file_id<>p_google_file_id then raise exception 'Sessão já finalizada com outro arquivo';end if;
 if u.kind='original' then
  if u.completed_file_id is null then insert into public.task_attachments(agency_id,task_id,client_id,file_name,storage_path,mime_type,file_size,uploaded_by,storage_provider,google_file_id,google_folder_id,google_file_version,google_drive_url) values(u.agency_id,u.task_id,u.client_id,u.file_name,'drive:'||p_google_file_id,u.mime_type,u.file_size,u.uploaded_by,'google_drive',p_google_file_id,u.folder_id,p_version,p_drive_url) returning * into a;
  else select * into a from public.task_attachments where task_id=u.task_id and google_file_id=p_google_file_id and storage_provider='google_drive';end if;
 else
  update public.task_attachments set preview_google_file_id=p_google_file_id,preview_google_file_version=p_version where id=u.attachment_id and task_id=u.task_id and agency_id=u.agency_id and client_id=u.client_id and storage_provider='google_drive' returning * into a;
  if not found then raise exception 'Arquivo original não encontrado';end if;
 end if;
 update private.task_drive_uploads set completed_file_id=p_google_file_id where id=u.id;
 return to_jsonb(a);
end;$$;
create function public.finish_task_drive_upload(p_upload uuid,p_user uuid,p_google_file_id text,p_version text,p_drive_url text) returns jsonb language sql security invoker set search_path='' as $$select private.finish_task_drive_upload(p_upload,p_user,p_google_file_id,p_version,p_drive_url)$$;
revoke all on function private.finish_task_drive_upload(uuid,uuid,text,text,text),public.finish_task_drive_upload(uuid,uuid,text,text,text) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.finish_task_drive_upload(uuid,uuid,text,text,text),public.finish_task_drive_upload(uuid,uuid,text,text,text) to service_role;
-- Private schema stays outside the Data API; a service-only RPC is the session boundary.
create function private.task_drive_upload_session(p_action text,p_id uuid,p_user uuid,p_metadata jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare u private.task_drive_uploads%rowtype;
begin
 if p_action='read' then select * into u from private.task_drive_uploads where id=p_id and uploaded_by=p_user;return to_jsonb(u);end if;
 if p_action<>'create' or p_metadata is null then raise exception 'Ação inválida';end if;
 if not exists(select 1 from public.tasks t join public.projects p on p.id=t.project_id and p.agency_id=t.agency_id join public.agency_members m on m.agency_id=t.agency_id and m.user_id=p_user and m.status='active' join public.agencies a on a.id=m.agency_id and a.status='active' where t.id=(p_metadata->>'task_id')::uuid and t.agency_id=(p_metadata->>'agency_id')::uuid and p.client_id=(p_metadata->>'client_id')::uuid) then raise exception 'Sessão não corresponde à demanda e agência' using errcode='42501';end if;
 if p_metadata->>'kind'='preview' and not exists(select 1 from public.task_attachments a where a.id=(p_metadata->>'attachment_id')::uuid and a.agency_id=(p_metadata->>'agency_id')::uuid and a.task_id=(p_metadata->>'task_id')::uuid and a.client_id=(p_metadata->>'client_id')::uuid and a.google_folder_id=p_metadata->>'folder_id' and a.storage_provider='google_drive') then raise exception 'Preview não corresponde ao arquivo da demanda' using errcode='42501';end if;
 insert into private.task_drive_uploads(id,agency_id,task_id,client_id,folder_id,file_name,mime_type,file_size,uploaded_by,kind,attachment_id) values(p_id,(p_metadata->>'agency_id')::uuid,(p_metadata->>'task_id')::uuid,(p_metadata->>'client_id')::uuid,p_metadata->>'folder_id',p_metadata->>'file_name',p_metadata->>'mime_type',(p_metadata->>'file_size')::bigint,p_user,p_metadata->>'kind',nullif(p_metadata->>'attachment_id','')::uuid) returning * into u;
 return to_jsonb(u);
end;$$;
create function public.task_drive_upload_session(p_action text,p_id uuid,p_user uuid,p_metadata jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select private.task_drive_upload_session(p_action,p_id,p_user,p_metadata)$$;
revoke all on function private.task_drive_upload_session(text,uuid,uuid,jsonb),public.task_drive_upload_session(text,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function private.task_drive_upload_session(text,uuid,uuid,jsonb),public.task_drive_upload_session(text,uuid,uuid,jsonb) to service_role;
