-- The three legacy implementations match their original migrations (whitespace-normalized body hashes).
-- Move without DROP/CASCADE, preserve signatures/results and close direct authenticated bypass.
alter function public.compute_squad_ranking(uuid,integer,integer) set schema private;
alter function private.compute_squad_ranking(uuid,integer,integer) rename to legacy_compute_squad_ranking;
alter function private.legacy_compute_squad_ranking(uuid,integer,integer) set search_path='';
alter function public.upsert_performance_snapshot(uuid,integer,integer,integer,integer,integer,numeric,numeric,text) set schema private;
alter function private.upsert_performance_snapshot(uuid,integer,integer,integer,integer,integer,numeric,numeric,text) rename to legacy_upsert_performance_snapshot;
alter function private.legacy_upsert_performance_snapshot(uuid,integer,integer,integer,integer,integer,numeric,numeric,text) set search_path='';
alter function public.get_project_progress(uuid) set schema private;
alter function private.get_project_progress(uuid) rename to legacy_get_project_progress;
alter function private.legacy_get_project_progress(uuid) set search_path='';
revoke all on function private.legacy_compute_squad_ranking(uuid,integer,integer),private.legacy_upsert_performance_snapshot(uuid,integer,integer,integer,integer,integer,numeric,numeric,text),private.legacy_get_project_progress(uuid) from public,anon,authenticated;
create function private.guarded_squad_ranking(p_agency_id uuid,p_year integer,p_month integer) returns table(squad_id uuid,squad_name text,squad_emoji text,squad_color text,specialty text,member_count bigint,tasks_completed integer,tasks_total integer,on_time_rate numeric,quality_score numeric,collaboration_score numeric,overall_score numeric,rank bigint) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.can_editorial(p_agency_id,'squads.view_ranking') then raise exception 'Sem permissão para ranking' using errcode='42501';end if;
 if p_year is null or p_year not between 2000 and 2200 or p_month is null or p_month not between 1 and 12 then raise exception 'Período inválido';end if;
 return query select * from private.legacy_compute_squad_ranking(p_agency_id,p_year,p_month);
end;$$;
create function private.guarded_performance_snapshot(p_squad_id uuid,p_year integer,p_month integer,p_tasks_completed integer default null,p_tasks_total integer default null,p_tasks_on_time integer default null,p_quality_score numeric default null,p_collaboration_score numeric default null,p_notes text default null) returns public.squad_performance_snapshots language plpgsql security definer set search_path='' as $$
declare a uuid;
begin
 select agency_id into a from public.squads where id=p_squad_id;
 if auth.uid() is null or a is null or not private.can_editorial(a,'squads.manage_perf') then raise exception 'Sem permissão para performance' using errcode='42501';end if;
 if p_year is null or p_year not between 2000 and 2200 or p_month is null or p_month not between 1 and 12 or coalesce(p_tasks_completed,0)<0 or coalesce(p_tasks_total,0)<0 or coalesce(p_tasks_on_time,0)<0 or (p_quality_score is not null and (p_quality_score<0 or p_quality_score>100 or p_quality_score::text='NaN')) or (p_collaboration_score is not null and (p_collaboration_score<0 or p_collaboration_score>100 or p_collaboration_score::text='NaN')) or length(coalesce(p_notes,''))>20000 then raise exception 'Métricas ou período inválidos';end if;
 return private.legacy_upsert_performance_snapshot(p_squad_id,p_year,p_month,p_tasks_completed,p_tasks_total,p_tasks_on_time,p_quality_score,p_collaboration_score,p_notes);
end;$$;
create function private.guarded_project_progress(p_project_id uuid) returns table(total_tasks integer,done_tasks integer,progress_pct numeric) language plpgsql stable security definer set search_path='' as $$
declare a uuid;
begin
 select agency_id into a from public.projects where id=p_project_id;
 if auth.uid() is null or a is null or not private.can_editorial(a,'projects.view') or not public.can_access_project(p_project_id) then raise exception 'Sem acesso ao projeto' using errcode='42501';end if;
 return query select * from private.legacy_get_project_progress(p_project_id);
end;$$;
create function public.compute_squad_ranking(p_agency_id uuid,p_year integer,p_month integer) returns table(squad_id uuid,squad_name text,squad_emoji text,squad_color text,specialty text,member_count bigint,tasks_completed integer,tasks_total integer,on_time_rate numeric,quality_score numeric,collaboration_score numeric,overall_score numeric,rank bigint) language sql stable security invoker set search_path='' as $$select * from private.guarded_squad_ranking(p_agency_id,p_year,p_month)$$;
create function public.upsert_performance_snapshot(p_squad_id uuid,p_year integer,p_month integer,p_tasks_completed integer default null,p_tasks_total integer default null,p_tasks_on_time integer default null,p_quality_score numeric default null,p_collaboration_score numeric default null,p_notes text default null) returns public.squad_performance_snapshots language sql security invoker set search_path='' as $$select private.guarded_performance_snapshot(p_squad_id,p_year,p_month,p_tasks_completed,p_tasks_total,p_tasks_on_time,p_quality_score,p_collaboration_score,p_notes)$$;
create function public.get_project_progress(p_project_id uuid) returns table(total_tasks integer,done_tasks integer,progress_pct numeric) language sql stable security invoker set search_path='' as $$select * from private.guarded_project_progress(p_project_id)$$;
revoke all on function private.guarded_squad_ranking(uuid,integer,integer),private.guarded_performance_snapshot(uuid,integer,integer,integer,integer,integer,numeric,numeric,text),private.guarded_project_progress(uuid),public.compute_squad_ranking(uuid,integer,integer),public.upsert_performance_snapshot(uuid,integer,integer,integer,integer,integer,numeric,numeric,text),public.get_project_progress(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.guarded_squad_ranking(uuid,integer,integer),private.guarded_performance_snapshot(uuid,integer,integer,integer,integer,integer,numeric,numeric,text),private.guarded_project_progress(uuid),public.compute_squad_ranking(uuid,integer,integer),public.upsert_performance_snapshot(uuid,integer,integer,integer,integer,integer,numeric,numeric,text),public.get_project_progress(uuid) to authenticated;
