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
-- Generic audit/history discovery: do not assume all history is in briefing_historico.
select table_name,string_agg(column_name,', ' order by ordinal_position) fields
from information_schema.columns where table_schema='public'
 and (table_name ilike '%audit%' or table_name ilike '%histor%' or table_name ilike '%version%' or table_name ilike '%versao%') group by table_name;
select lower(trim(entidade)) entity,count(*) from public.audit_log group by lower(trim(entidade));
select count(*) direct_briefing_id from public.audit_log a join public.briefings b on a.entidade_id=b.id;
select campo,count(*) from public.audit_log where lower(trim(campo)) ~ '(brief|respost|answer)' group by campo;
select count(*) embedded_brief_keys from public.calendarios
where conteudo_estruturado::text ~* '"[^" ]*(brief|respost|answer)[^" ]*"[[:space:]]*:';
select count(*) embedded_brief_keys from public.clientes
where entregaveis_contratados::text ~* '"[^" ]*(brief|respost|answer)[^" ]*"[[:space:]]*:';
