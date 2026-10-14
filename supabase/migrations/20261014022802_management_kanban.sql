-- Aggregate management endpoint. Keeps the caller's RLS and all project workspace policies.
create or replace function public.get_management_kanban(p_agency_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists (
  select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id
  where m.agency_id=p_agency_id and m.user_id=auth.uid() and m.status='active' and r.name in ('OWNER','ADMIN','MANAGER')
 ) or not coalesce(public.has_agency_permission(p_agency_id,'tasks.view'),false) then
  raise exception 'Kanban geral restrito à gestão da agência' using errcode='42501';
 end if;
 select jsonb_build_object('tasks',coalesce(jsonb_agg(row_data order by due_date nulls last,id) filter(where n<=500),'[]'::jsonb),'has_more',coalesce(bool_or(n>500),false)) into result
 from (
  select t.id,t.due_date,row_number() over(order by t.due_date nulls last,t.id) n,
   to_jsonb(t)||jsonb_build_object('project',jsonb_build_object('id',p.id,'name',p.name,'client_id',c.id,'client',case when c.id is null then null else jsonb_build_object('id',c.id,'name',c.name) end),'column',to_jsonb(b)) row_data
  from public.tasks t join public.projects p on p.id=t.project_id and p.agency_id=p_agency_id
  left join public.clients c on c.id=p.client_id and c.agency_id=p_agency_id
  left join public.board_columns b on b.id=t.column_id and b.agency_id=p_agency_id
  where t.agency_id=p_agency_id and t.archived_at is null and t.parent_task_id is null and p.archived_at is null
  order by t.due_date nulls last,t.id limit 501
 ) limited;
 return result;
end $$;
revoke all on function public.get_management_kanban(uuid) from public,anon;
grant execute on function public.get_management_kanban(uuid) to authenticated;
