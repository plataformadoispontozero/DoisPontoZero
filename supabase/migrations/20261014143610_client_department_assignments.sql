-- Per-client production ownership; changes affect newly created demands only.
create table private.client_department_assignments(
 agency_id uuid not null references public.agencies(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete cascade,
 department text not null check(department in ('social_media','design','videomaker','traffic')),
 user_id uuid not null references public.profiles(id) on delete cascade,
 assigned_at timestamptz not null default now(),
 assigned_by uuid references public.profiles(id),
 primary key(agency_id,client_id,department,user_id)
);
alter table private.client_department_assignments enable row level security;
revoke all on private.client_department_assignments from public,anon,authenticated;
create function private.client_assignment_workspace(p_agency uuid,p_client uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.can_editorial(p_agency,'clients.view') or not exists(select 1 from public.clients where id=p_client and agency_id=p_agency) then raise exception 'Forbidden' using errcode='42501';end if;
 return jsonb_build_object('assignments',coalesce((select jsonb_agg(jsonb_build_object('department',department,'user_id',user_id,'assigned_at',assigned_at)) from private.client_department_assignments where agency_id=p_agency and client_id=p_client),'[]'::jsonb),'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'name',coalesce(p.full_name,'Membro da equipe'),'role',r.name,'active',m.status='active') order by p.full_name) from public.agency_members m join public.profiles p on p.id=m.user_id join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id where m.agency_id=p_agency and (m.status='active' or exists(select 1 from private.client_department_assignments a where a.agency_id=p_agency and a.client_id=p_client and a.user_id=m.user_id))),'[]'::jsonb));
end;$$;
create function private.save_client_assignments(p_agency uuid,p_client uuid,p_assignments jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.can_editorial(p_agency,'clients.edit') then raise exception 'Forbidden' using errcode='42501';end if;
 perform 1 from public.clients where id=p_client and agency_id=p_agency for update;
 if not found then raise exception 'Client unavailable';end if;
 if jsonb_typeof(p_assignments) is distinct from 'array' or jsonb_array_length(p_assignments)>200 then raise exception 'Invalid assignments';end if;
 if exists(select 1 from jsonb_array_elements(p_assignments) a where coalesce(a->>'department','') not in ('social_media','design','videomaker','traffic') or not exists(select 1 from public.agency_members m where m.agency_id=p_agency and m.user_id::text=a->>'user_id' and m.status='active')) then raise exception 'Selecione apenas membros ativos desta agência.';end if;
 delete from private.client_department_assignments where agency_id=p_agency and client_id=p_client;
 insert into private.client_department_assignments(agency_id,client_id,department,user_id,assigned_by) select distinct p_agency,p_client,a->>'department',(a->>'user_id')::uuid,auth.uid() from jsonb_array_elements(p_assignments) a;
end;$$;
create function public.get_client_assignments(p_agency uuid,p_client uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.client_assignment_workspace(p_agency,p_client)$$;
create function public.save_client_assignments(p_agency uuid,p_client uuid,p_assignments jsonb) returns void language sql security invoker set search_path='' as $$select private.save_client_assignments(p_agency,p_client,p_assignments)$$;
revoke all on function private.client_assignment_workspace(uuid,uuid),private.save_client_assignments(uuid,uuid,jsonb),public.get_client_assignments(uuid,uuid),public.save_client_assignments(uuid,uuid,jsonb) from public,anon;
grant execute on function private.client_assignment_workspace(uuid,uuid),private.save_client_assignments(uuid,uuid,jsonb),public.get_client_assignments(uuid,uuid),public.save_client_assignments(uuid,uuid,jsonb) to authenticated;
create function private.assign_new_client_demand() returns trigger language plpgsql security definer set search_path='' as $$
declare client uuid; sector text;
begin
 sector:=case when new.title like '[Design]%' then 'design' when new.title like '[Videomaker]%' then 'videomaker' when new.title like '[Tráfego Pago]%' then 'traffic' when new.title like '[Social Media]%' then 'social_media' else null end;
 if sector is null then return new;end if;
 select client_id into client from public.projects where id=new.project_id and agency_id=new.agency_id;
 insert into public.project_members(agency_id,project_id,user_id) select distinct new.agency_id,new.project_id,a.user_id from private.client_department_assignments a join public.agency_members m on m.agency_id=a.agency_id and m.user_id=a.user_id and m.status='active' where a.agency_id=new.agency_id and a.client_id=client and a.department=sector on conflict(project_id,user_id) do nothing;
 insert into public.task_assignees(agency_id,task_id,user_id) select new.agency_id,new.id,a.user_id from private.client_department_assignments a join public.agency_members m on m.agency_id=a.agency_id and m.user_id=a.user_id and m.status='active' where a.agency_id=new.agency_id and a.client_id=client and a.department=sector on conflict(task_id,user_id) do nothing;
 return new;
end;$$;
revoke all on function private.assign_new_client_demand() from public,anon,authenticated;
create trigger assign_client_demand after insert on public.tasks for each row execute function private.assign_new_client_demand();
