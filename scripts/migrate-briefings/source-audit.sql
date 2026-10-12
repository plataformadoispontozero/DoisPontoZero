-- READ ONLY: run against Lovable source, not the destination.
select table_name,column_name,data_type,is_nullable,ordinal_position
from information_schema.columns
where table_schema='public' and (table_name ilike '%brief%' or table_name ilike '%form%'
 or table_name ilike '%answer%' or table_name ilike '%respost%'
 or table_name in ('clientes','demands','calendarios'))
order by table_name,ordinal_position;
select 'briefings' source,count(*) n from public.briefings
union all select 'briefing_historico',count(*) from public.briefing_historico
union all select 'task_briefings',count(*) from public.task_briefings
union all select 'demands.briefing',count(*) from public.demands where nullif(trim(briefing),'') is not null
union all select 'calendarios.analise_pre_geracao',count(*) from public.calendarios where analise_pre_geracao is not null;
select status,count(*) from public.briefings group by status;
select count(*) history,count(*) filter(where b.id is null) orphan_history
from public.briefing_historico h left join public.briefings b on b.id=h.briefing_id;
select tc.table_name,tc.constraint_type,tc.constraint_name,kcu.column_name,
 ccu.table_name referenced_table,ccu.column_name referenced_column
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu on tc.constraint_name=kcu.constraint_name and tc.table_schema=kcu.table_schema
left join information_schema.constraint_column_usage ccu on tc.constraint_name=ccu.constraint_name and tc.table_schema=ccu.table_schema
where tc.table_schema='public' and tc.table_name in ('briefings','briefing_historico','task_briefings','clientes','demands','calendarios')
 and tc.constraint_type in ('PRIMARY KEY','FOREIGN KEY');
