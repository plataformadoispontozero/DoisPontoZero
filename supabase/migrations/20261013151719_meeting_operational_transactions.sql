-- Reuse existing meeting schema; no data import, external event or notification.
create function private.meeting_project_access(a uuid,p uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p is null or exists(select 1 from public.projects x where x.id=p and x.agency_id=a and public.can_access_project(x.id));
$$;
create function private.meeting_read(a uuid,m uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.can_editorial(a,'meetings.view') and exists(select 1 from public.meetings x where x.id=m and x.agency_id=a and private.meeting_project_access(a,x.project_id));
$$;
create function private.meeting_edit(a uuid,m uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.meeting_read(a,m) and private.can_editorial(a,'meetings.edit') and exists(select 1 from public.meetings x where x.id=m and x.agency_id=a and
 (x.organizer_id=auth.uid() or x.created_by=auth.uid() or exists(select 1 from public.meeting_participants mp where mp.meeting_id=m and mp.agency_id=a and mp.user_id=auth.uid() and mp.participant_type='internal') or exists(select 1 from public.agency_members am join public.roles r on r.id=am.role_id and r.agency_id=am.agency_id where am.agency_id=a and am.user_id=auth.uid() and am.status='active' and r.name in ('OWNER','ADMIN','GESTOR'))));
$$;
create function private.meeting_create(a uuid,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.meetings; x jsonb; u uuid; c uuid; pr uuid;
begin
 if auth.uid() is null or not private.can_editorial(a,'meetings.create') or not private.can_editorial(a,'meetings.view') then raise exception 'Sem permissão' using errcode='42501';end if;
 if jsonb_typeof(p)<>'object' or octet_length(p::text)>100000 or length(btrim(coalesce(p->>'title',''))) not between 1 and 300 then raise exception 'Reunião inválida';end if;
 c:=nullif(p->>'client_id','')::uuid;pr:=nullif(p->>'project_id','')::uuid;
 if c is not null and not exists(select 1 from public.clients where id=c and agency_id=a) then raise exception 'Cliente fora da agência';end if;
 if not private.meeting_project_access(a,pr) or (pr is not null and c is not null and not exists(select 1 from public.projects where id=pr and agency_id=a and client_id=c)) then raise exception 'Projeto fora do cliente ou sem acesso';end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=coalesce(p->>'timezone','America/Sao_Paulo')) then raise exception 'Fuso horário inválido';end if;
 if nullif(p->>'meeting_url','') is not null and p->>'meeting_url' !~ '^https://' then raise exception 'Link da reunião deve usar HTTPS';end if;
 if (p->>'starts_at')::timestamptz is null or (p->>'ends_at')::timestamptz is null or (p->>'ends_at')::timestamptz<=(p->>'starts_at')::timestamptz then raise exception 'Período inválido';end if;
 if p?'participants' and (jsonb_typeof(p->'participants')<>'array' or jsonb_array_length(p->'participants')>100) then raise exception 'Participantes inválidos';end if;
 insert into public.meetings(agency_id,client_id,project_id,title,description,meeting_type,starts_at,ends_at,timezone,location_type,location_text,meeting_url,organizer_id,created_by)
 values(a,c,pr,btrim(p->>'title'),p->>'description',coalesce(p->>'meeting_type','internal'),(p->>'starts_at')::timestamptz,(p->>'ends_at')::timestamptz,coalesce(p->>'timezone','America/Sao_Paulo'),coalesce(p->>'location_type','online'),p->>'location_text',nullif(p->>'meeting_url',''),auth.uid(),auth.uid()) returning * into m;
 for x in select value from jsonb_array_elements(coalesce(p->'participants','[]')) loop
  u:=nullif(x->>'user_id','')::uuid;
  if x->>'participant_type'='internal' then
   if not exists(select 1 from public.agency_members where agency_id=a and user_id=u and status='active') then raise exception 'Participante não ativo nesta agência';end if;
   if not exists(select 1 from public.meeting_participants where meeting_id=m.id and user_id=u) then insert into public.meeting_participants(agency_id,meeting_id,user_id,participant_type) values(a,m.id,u,'internal');end if;
  elsif x->>'participant_type'='external' then
   if u is not null or length(btrim(coalesce(x->>'external_name',''))) not between 1 and 200 or coalesce(x->>'external_email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Contato externo inválido';end if;
   insert into public.meeting_participants(agency_id,meeting_id,external_name,external_email,participant_type) values(a,m.id,x->>'external_name',x->>'external_email','external');
  else raise exception 'Tipo de participante inválido';end if;
 end loop;
 if not exists(select 1 from public.meeting_participants where meeting_id=m.id and user_id=auth.uid()) then insert into public.meeting_participants(agency_id,meeting_id,user_id,participant_type,response_status) values(a,m.id,auth.uid(),'internal','accepted');end if;
 insert into public.meeting_activity(agency_id,meeting_id,actor_user_id,action) values(a,m.id,auth.uid(),'meeting.created');
 return to_jsonb(m);
end;$$;
create function private.meeting_save(a uuid,m uuid,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare current public.meetings; x jsonb; xid uuid; u uuid; d uuid; n public.meeting_minutes; k text;
begin
 if auth.uid() is null or not private.meeting_edit(a,m) then raise exception 'Sem permissão para editar reunião' using errcode='42501';end if;
 select * into current from public.meetings where id=m and agency_id=a for update;
 if jsonb_typeof(p)<>'object' or octet_length(p::text)>1000000 then raise exception 'Conteúdo inválido';end if;
 if nullif(p->>'expected_updated_at','') is null or (p->>'expected_updated_at')::timestamptz is distinct from current.updated_at then raise exception 'A reunião mudou. Atualize a página antes de salvar.' using errcode='40001';end if;
 for k in select jsonb_object_keys(p) loop
  if k not in ('expected_updated_at','title','description','status','starts_at','ends_at','location_text','meeting_url','agenda','minutes','decisions','actions') then raise exception 'Campo não editável: %',k;end if;
 end loop;
 if p?'title' and length(btrim(coalesce(p->>'title',''))) not between 1 and 300 then raise exception 'Título inválido';end if;
 if p?'meeting_url' and nullif(p->>'meeting_url','') is not null and p->>'meeting_url' !~ '^https://' then raise exception 'Link da reunião deve usar HTTPS';end if;
 foreach k in array array['agenda','decisions','actions'] loop
  if p?k and (jsonb_typeof(p->k)<>'array' or jsonb_array_length(p->k)>200) then raise exception 'Lista inválida: %',k;end if;
 end loop;
 if p?'agenda' then
  for x in select value from jsonb_array_elements(p->'agenda') loop
   xid:=(x->>'id')::uuid;
   if xid is null or length(btrim(coalesce(x->>'title',''))) not between 1 and 300 or coalesce((x->>'estimated_minutes')::int,15) not between 0 and 1440 then raise exception 'Pauta inválida';end if;
   if exists(select 1 from public.meeting_agenda_items where id=xid and (meeting_id<>m or agency_id<>a)) then raise exception 'Pauta fora da reunião';end if;
   insert into public.meeting_agenda_items(id,agency_id,meeting_id,title,description,position,estimated_minutes,created_by) values(xid,a,m,x->>'title',x->>'description',coalesce((x->>'position')::int,0),coalesce((x->>'estimated_minutes')::int,15),auth.uid()) on conflict(id) do update set title=excluded.title,description=excluded.description,position=excluded.position,estimated_minutes=excluded.estimated_minutes,updated_at=now();
  end loop;
  delete from public.meeting_agenda_items where agency_id=a and meeting_id=m and id not in(select (value->>'id')::uuid from jsonb_array_elements(p->'agenda'));
 end if;
 if p?'minutes' then
  x:=p->'minutes';select * into n from public.meeting_minutes where agency_id=a and meeting_id=m order by version desc,created_at desc limit 1 for update;
  if n.status='finalized' then raise exception 'Ata finalizada não pode ser alterada';end if;
  if jsonb_typeof(x)<>'object' or length(coalesce(x->>'content',''))>100000 or coalesce(x->>'status','draft') not in ('draft','finalized') or (x->>'status'='finalized' and btrim(coalesce(x->>'content',''))='') then raise exception 'Ata inválida';end if;
  if n.id is null then insert into public.meeting_minutes(agency_id,meeting_id,content,status,created_by,updated_by,finalized_at) values(a,m,coalesce(x->>'content',''),coalesce(x->>'status','draft'),auth.uid(),auth.uid(),case when x->>'status'='finalized' then now() end);
  else update public.meeting_minutes set content=coalesce(x->>'content',''),status=coalesce(x->>'status','draft'),version=version+1,updated_by=auth.uid(),updated_at=now(),finalized_at=case when x->>'status'='finalized' then now() end where id=n.id;end if;
 end if;
 if p?'decisions' then
  -- Decisions are retained; omitting an existing decision cannot erase history.
  for x in select value from jsonb_array_elements(p->'decisions') loop
   xid:=(x->>'id')::uuid;
   if xid is null or length(btrim(coalesce(x->>'title',''))) not between 1 and 300 then raise exception 'Decisão inválida';end if;
   if exists(select 1 from public.meeting_decisions where id=xid and (meeting_id<>m or agency_id<>a)) then raise exception 'Decisão fora da reunião';end if;
   insert into public.meeting_decisions(id,agency_id,meeting_id,title,description,decision_status,created_by) values(xid,a,m,x->>'title',x->>'description',coalesce(x->>'decision_status','active'),auth.uid()) on conflict(id) do update set title=excluded.title,description=excluded.description,decision_status=excluded.decision_status;
  end loop;
 end if;
 if p?'actions' then
  for x in select value from jsonb_array_elements(p->'actions') loop
   xid:=(x->>'id')::uuid;u:=nullif(x->>'assigned_to','')::uuid;d:=nullif(x->>'decision_id','')::uuid;
   if xid is null or length(btrim(coalesce(x->>'title',''))) not between 1 and 300 then raise exception 'Ação inválida';end if;
   if exists(select 1 from public.meeting_action_items where id=xid and (meeting_id<>m or agency_id<>a)) then raise exception 'Ação fora da reunião';end if;
   if exists(select 1 from public.meeting_action_items where id=xid and task_id is not null) then
    if exists(select 1 from public.meeting_action_items where id=xid and (title is distinct from x->>'title' or description is distinct from x->>'description' or assigned_to is distinct from u or decision_id is distinct from d or due_at is distinct from nullif(x->>'due_at','')::timestamptz or status is distinct from x->>'status' or task_id is distinct from nullif(x->>'task_id','')::uuid)) then raise exception 'Ação convertida protegida. Edite a tarefa vinculada.';end if;
    continue;
   end if;
   if u is not null and not exists(select 1 from public.agency_members where agency_id=a and user_id=u and status='active') then raise exception 'Responsável não ativo nesta agência';end if;
   if d is not null and not exists(select 1 from public.meeting_decisions where id=d and agency_id=a and meeting_id=m) then raise exception 'Decisão fora da reunião';end if;
   if nullif(x->>'task_id','') is not null or coalesce(x->>'status','pending') not in ('pending','completed','cancelled') then raise exception 'Conversão exige operação de tarefa';end if;
   insert into public.meeting_action_items(id,agency_id,meeting_id,decision_id,title,description,assigned_to,due_at,status,created_by) values(xid,a,m,d,x->>'title',x->>'description',u,nullif(x->>'due_at','')::timestamptz,coalesce(x->>'status','pending'),auth.uid()) on conflict(id) do update set decision_id=excluded.decision_id,title=excluded.title,description=excluded.description,assigned_to=excluded.assigned_to,due_at=excluded.due_at,status=excluded.status,updated_at=now();
  end loop;
 end if;
 update public.meetings set title=case when p?'title' then btrim(p->>'title') else title end,description=case when p?'description' then p->>'description' else description end,status=coalesce(p->>'status',status),starts_at=case when p?'starts_at' then (p->>'starts_at')::timestamptz else starts_at end,ends_at=case when p?'ends_at' then (p->>'ends_at')::timestamptz else ends_at end,location_text=case when p?'location_text' then p->>'location_text' else location_text end,meeting_url=case when p?'meeting_url' then nullif(p->>'meeting_url','') else meeting_url end,updated_at=clock_timestamp(),cancelled_at=case when p->>'status'='cancelled' then now() else cancelled_at end where id=m;
 insert into public.meeting_activity(agency_id,meeting_id,actor_user_id,action,metadata) values(a,m,auth.uid(),'meeting.updated',jsonb_build_object('fields',(select jsonb_agg(key) from jsonb_object_keys(p) key)));
 return (select to_jsonb(saved_row) from public.meetings saved_row where id=m);
end;$$;
create function private.meeting_convert(i uuid,p uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare x public.meeting_action_items; mt public.meetings; b uuid; c uuid; t uuid;
begin
 select * into x from public.meeting_action_items where id=i;
 if not found or auth.uid() is null or not private.meeting_edit(x.agency_id,x.meeting_id) or not private.can_editorial(x.agency_id,'tasks.create') then raise exception 'Sem permissão para converter ação' using errcode='42501';end if;
 select * into mt from public.meetings where id=x.meeting_id and agency_id=x.agency_id for update;
 select * into x from public.meeting_action_items where id=i for update;
 if not private.meeting_project_access(x.agency_id,p) or p is null or not exists(select 1 from public.projects where id=p and agency_id=x.agency_id and archived_at is null and status not in ('archived','completed') and (mt.client_id is null or client_id=mt.client_id)) then raise exception 'Projeto fora do cliente ou sem acesso';end if;
 if x.task_id is not null then
  if exists(select 1 from public.tasks where id=x.task_id and project_id=p and agency_id=x.agency_id) then return x.task_id;end if;
  raise exception 'Ação já convertida em outro projeto';
 end if;
 if x.status<>'pending' then raise exception 'Somente ações pendentes podem virar tarefas';end if;
 if x.assigned_to is not null and not exists(select 1 from public.agency_members am join public.project_members pm on pm.agency_id=am.agency_id and pm.user_id=am.user_id where am.agency_id=x.agency_id and am.user_id=x.assigned_to and am.status='active' and pm.project_id=p) then raise exception 'Responsável deve participar do projeto';end if;
 select pb.id,bc.id into b,c from public.project_boards pb join public.board_columns bc on bc.board_id=pb.id and bc.agency_id=pb.agency_id where pb.project_id=p and pb.agency_id=x.agency_id and bc.category='backlog' order by pb.is_default desc,pb.created_at,bc.position,bc.id limit 1;
 if b is null then raise exception 'Crie um quadro com coluna de backlog no projeto';end if;
 insert into public.tasks(agency_id,project_id,board_id,column_id,title,description,due_date,created_by) values(x.agency_id,p,b,c,x.title,x.description,x.due_at::date,auth.uid()) returning id into t;
 if x.assigned_to is not null then insert into public.task_assignees(agency_id,task_id,user_id) values(x.agency_id,t,x.assigned_to);end if;
 update public.meeting_action_items set task_id=t,status='converted',updated_at=now() where id=i;
 update public.meetings set updated_at=clock_timestamp() where id=x.meeting_id;
 insert into public.meeting_activity(agency_id,meeting_id,actor_user_id,action,metadata) values(x.agency_id,x.meeting_id,auth.uid(),'action.converted',jsonb_build_object('action_id',i,'task_id',t));
 return t;
end;$$;
create function public.create_agency_meeting(p_agency_id uuid,p_meeting jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.meeting_create(p_agency_id,p_meeting)$$;
create function public.save_meeting_content(p_agency_id uuid,p_meeting_id uuid,p_changes jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.meeting_save(p_agency_id,p_meeting_id,p_changes)$$;
create or replace function public.convert_action_item_to_task(p_action_item_id uuid,p_project_id uuid) returns uuid language sql security invoker set search_path='' as $$select private.meeting_convert(p_action_item_id,p_project_id)$$;
revoke all on function private.meeting_project_access(uuid,uuid),private.meeting_read(uuid,uuid),private.meeting_edit(uuid,uuid),private.meeting_create(uuid,jsonb),private.meeting_save(uuid,uuid,jsonb),private.meeting_convert(uuid,uuid),public.create_agency_meeting(uuid,jsonb),public.save_meeting_content(uuid,uuid,jsonb),public.convert_action_item_to_task(uuid,uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.meeting_project_access(uuid,uuid),private.meeting_read(uuid,uuid),private.meeting_edit(uuid,uuid),private.meeting_create(uuid,jsonb),private.meeting_save(uuid,uuid,jsonb),private.meeting_convert(uuid,uuid),public.create_agency_meeting(uuid,jsonb),public.save_meeting_content(uuid,uuid,jsonb),public.convert_action_item_to_task(uuid,uuid) to authenticated;
-- Replace unsafe historical policies. All writes go through authenticated RPCs.
do $$declare t text;r record;begin
 foreach t in array array['meetings','meeting_participants','meeting_agenda_items','meeting_minutes','meeting_decisions','meeting_action_items','meeting_activity','meeting_calendar_events'] loop
  for r in select policyname from pg_catalog.pg_policies where schemaname='public' and tablename=t loop execute format('drop policy %I on public.%I',r.policyname,t);end loop;
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke insert,update,delete,truncate on public.%I from anon,authenticated',t);
  execute format('revoke select on public.%I from anon',t);
  execute format('grant select on public.%I to authenticated',t);
  if t='meetings' then execute 'create policy meetings_read on public.meetings for select to authenticated using(private.meeting_read(agency_id,id))';
  else execute format('create policy meetings_read on public.%I for select to authenticated using(private.meeting_read(agency_id,meeting_id))',t);end if;
 end loop;
end$$;
