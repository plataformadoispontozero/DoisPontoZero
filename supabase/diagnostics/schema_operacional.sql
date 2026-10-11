-- Somente metadados. Não lê dados de usuários nem altera schema/policies.
SELECT jsonb_pretty(jsonb_build_object(
  'columns', (SELECT jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',data_type,'nullable',is_nullable,'default',column_default) ORDER BY table_name,ordinal_position) FROM information_schema.columns WHERE table_schema='public'),
  'policies', (SELECT jsonb_agg(jsonb_build_object('table',tablename,'policy',policyname,'roles',roles,'command',cmd,'using',qual,'check',with_check) ORDER BY tablename,policyname) FROM pg_policies WHERE schemaname='public'),
  'functions', (SELECT jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'returns',pg_get_function_result(p.oid),'security_definer',p.prosecdef,'search_path',(SELECT c FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%' LIMIT 1),'privileges',p.proacl::text) ORDER BY p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'),
  'constraints', (SELECT jsonb_agg(jsonb_build_object('table',r.relname,'name',c.conname,'definition',pg_get_constraintdef(c.oid)) ORDER BY r.relname,c.conname) FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname='public'),
  'storage_policies', (SELECT jsonb_agg(jsonb_build_object('table',tablename,'policy',policyname,'roles',roles,'command',cmd,'using',qual,'check',with_check)) FROM pg_policies WHERE schemaname='storage')
)) AS schema_diagnostic;
