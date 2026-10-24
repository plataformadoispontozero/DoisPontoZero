-- Include assigned work of active leaders and members automatically, as well as explicitly linked projects.
-- DISTINCT prevents duplicate credit inside one squad; shared_tasks makes cross-squad overlap visible.
create or replace function private.squad_monthly_operational_report(p_agency uuid,p_month date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not private.can_editorial(p_agency,'squads.view_ranking') then
  raise exception 'Sem permissão para consultar a performance dos squads.' using errcode='42501';
 end if;
 if p_month is null or extract(day from p_month)<>1 or extract(year from p_month) not between 2000 and 2100 then
  raise exception 'Mês inválido.' using errcode='22023';
 end if;
 with active as (
  select s.id,s.name,s.avatar_emoji,s.avatar_color from public.squads s where s.agency_id=p_agency and s.status='active'
 ), shared as (
  select sp.project_id from public.squad_projects sp join active s on s.id=sp.squad_id group by sp.project_id having count(distinct sp.squad_id)>1
 ), active_members as (
  select distinct sm.squad_id,sm.user_id from public.squad_members sm
  join active s on s.id=sm.squad_id
  join public.agency_members am on am.user_id=sm.user_id and am.agency_id=p_agency and am.status='active'
 ), facts as (
  select distinct s.id squad_id,t.id task_id,t.status,t.due_date,t.completed_at
  from active s join public.tasks t on t.agency_id=p_agency
  left join public.projects p on p.id=t.project_id and p.agency_id=p_agency
  where t.archived_at is null and t.status<>'archived' and t.parent_task_id is null
   and (t.project_id is null or p.id is not null and p.archived_at is null)
   and (
    exists(select 1 from public.squad_projects sp where sp.squad_id=s.id and sp.project_id=t.project_id)
    or exists(select 1 from public.task_assignees ta join active_members sm on sm.user_id=ta.user_id and sm.squad_id=s.id
      where ta.task_id=t.id and ta.agency_id=p_agency)
   )
   and (t.due_date>=p_month and t.due_date<(p_month+interval '1 month')::date
    or t.completed_at>=p_month::timestamp at time zone 'UTC' and t.completed_at<(p_month+interval '1 month')::timestamp at time zone 'UTC')
 ), shared_task_ids as (
  select task_id from facts group by task_id having count(distinct squad_id)>1
 ), monthly as (
  select s.id,s.name,s.avatar_emoji,s.avatar_color,
   (select count(*) from public.squad_members sm join public.agency_members am on am.user_id=sm.user_id and am.agency_id=p_agency and am.status='active' where sm.squad_id=s.id) members,
   count(f.task_id)::integer tasks_total,
   count(f.task_id) filter(where f.status='done' and f.completed_at>=p_month::timestamp at time zone 'UTC' and f.completed_at<(p_month+interval '1 month')::timestamp at time zone 'UTC')::integer tasks_completed,
   count(f.task_id) filter(where f.status='done' and f.due_date is not null and f.completed_at>=p_month::timestamp at time zone 'UTC' and f.completed_at<(p_month+interval '1 month')::timestamp at time zone 'UTC')::integer dated_completed,
   count(f.task_id) filter(where f.status='done' and f.due_date is not null and (f.completed_at at time zone 'UTC')::date<=f.due_date and f.completed_at>=p_month::timestamp at time zone 'UTC' and f.completed_at<(p_month+interval '1 month')::timestamp at time zone 'UTC')::integer tasks_on_time,
   (select count(*) from public.squad_projects sp join shared sh on sh.project_id=sp.project_id where sp.squad_id=s.id) shared_projects,
   (select count(*) from facts sf join shared_task_ids st on st.task_id=sf.task_id where sf.squad_id=s.id) shared_tasks
  from active s left join facts f on f.squad_id=s.id group by s.id,s.name,s.avatar_emoji,s.avatar_color
 ), measured as (
  select m.*,case when dated_completed>0 then round(100.0*tasks_on_time/dated_completed,2) else null end on_time_rate from monthly m
 ), evaluated as (
  select m.*,
   coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'title',g.title,'metric',g.metric,'target',g.target,'value',case g.metric when 'tasks_completed' then m.tasks_completed::numeric else m.on_time_rate end,'achieved',coalesce(case g.metric when 'tasks_completed' then m.tasks_completed::numeric else m.on_time_rate end>=g.target,false)) order by g.created_at) from public.shared_squad_monthly_goals g where g.agency_id=p_agency and g.month=p_month),'[]'::jsonb) goals
  from measured m
 ), scored as (
  select e.*,(select count(*) from jsonb_array_elements(e.goals) g where (g->>'achieved')::boolean) goals_achieved,
   (select round(avg(least(100,coalesce((g->>'value')::numeric,0)/(g->>'target')::numeric*100)),2) from jsonb_array_elements(e.goals) g) goal_progress
  from evaluated e
 ), ranked as (
  select s.*,dense_rank() over(order by goals_achieved desc,goal_progress desc nulls last,tasks_completed desc,on_time_rate desc nulls last) rank
  from scored s
 )
 select jsonb_build_object('month',p_month,'generatedAt',now(),'squads',coalesce(jsonb_agg(to_jsonb(r) order by r.rank,r.name),'[]'::jsonb)) into result from ranked r;
 return result;
end;$$;
