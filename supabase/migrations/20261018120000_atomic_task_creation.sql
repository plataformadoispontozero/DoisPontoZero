create table private.task_create_requests (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agency_id, user_id, request_id)
);
alter table private.task_create_requests enable row level security;
revoke all on private.task_create_requests from public, anon, authenticated;

create function private.create_task_with_assignees(
  p_agency_id uuid,
  p_project_id uuid,
  p_board_id uuid,
  p_column_id uuid,
  p_parent_task_id uuid,
  p_title text,
  p_description text,
  p_priority text,
  p_status text,
  p_start_date date,
  p_due_date date,
  p_assignee_ids uuid[],
  p_request_id uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  existing_task uuid;
  created_task uuid;
  next_position double precision;
  assignees uuid[] := coalesce(p_assignee_ids, array[]::uuid[]);
begin
  if actor is null or not private.can_editorial(p_agency_id, 'tasks.create') then
    raise exception 'Sem permissão para criar tarefa' using errcode = '42501';
  end if;
  if p_request_id is null then raise exception 'Identificador da solicitação inválido'; end if;
  if p_title is null or length(btrim(p_title)) not between 1 and 500 then raise exception 'Título inválido'; end if;
  if p_priority not in ('urgent', 'high', 'normal', 'low') then raise exception 'Prioridade inválida'; end if;
  if p_status not in ('open', 'in_progress', 'review', 'done') then raise exception 'Etapa inválida'; end if;
  if cardinality(assignees) > 200 then raise exception 'Limite de responsáveis excedido'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_agency_id::text || ':' || actor::text || ':' || p_request_id::text, 0
  ));
  select r.task_id into existing_task
  from private.task_create_requests r
  where r.agency_id = p_agency_id and r.user_id = actor and r.request_id = p_request_id;
  if existing_task is not null then return existing_task; end if;

  if not exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.agency_id = p_agency_id
      and public.can_access_project(p.id)
  ) then raise exception 'Projeto indisponível'; end if;
  if not exists (
    select 1 from public.project_boards b
    join public.board_columns c on c.board_id = b.id and c.id = p_column_id
    where b.id = p_board_id and b.project_id = p_project_id and b.agency_id = p_agency_id
      and c.agency_id = p_agency_id
  ) then raise exception 'Quadro ou coluna inválidos'; end if;
  if p_parent_task_id is not null and not exists (
    select 1 from public.tasks t where t.id = p_parent_task_id
      and t.agency_id = p_agency_id and t.project_id = p_project_id
      and t.parent_task_id is null and t.archived_at is null
  ) then raise exception 'Tarefa superior indisponível'; end if;

  if cardinality(assignees) > 0 then
    if not private.can_editorial(p_agency_id, 'tasks.assign') then
      raise exception 'Sem permissão para atribuir responsáveis' using errcode = '42501';
    end if;
    select coalesce(array_agg(distinct x), array[]::uuid[]) into assignees
    from unnest(assignees) x;
    if exists (
      select 1 from unnest(assignees) x
      where not exists (
        select 1 from public.project_members pm
        where pm.project_id = p_project_id and pm.agency_id = p_agency_id and pm.user_id = x
      )
    ) then raise exception 'Responsável fora do projeto'; end if;
  end if;

  perform 1 from public.board_columns c where c.id = p_column_id for update;
  select coalesce(max(t.position), 0) + 1000 into next_position
  from public.tasks t where t.column_id = p_column_id and t.archived_at is null;

  insert into public.tasks (
    agency_id, project_id, board_id, column_id, parent_task_id, title, description,
    priority, status, position, start_date, due_date, completed_at, created_by
  ) values (
    p_agency_id, p_project_id, p_board_id, p_column_id, p_parent_task_id, btrim(p_title),
    nullif(p_description, ''), p_priority, p_status, next_position, p_start_date, p_due_date,
    case when p_status = 'done' then now() else null end, actor
  ) returning id into created_task;

  insert into public.task_assignees (agency_id, task_id, user_id)
  select p_agency_id, created_task, x from unnest(assignees) x
  on conflict (task_id, user_id) do nothing;

  insert into public.task_activity (agency_id, task_id, actor_user_id, action, metadata)
  values (p_agency_id, created_task, actor, 'created', jsonb_build_object('title', btrim(p_title)));

  insert into private.task_create_requests (agency_id, user_id, request_id, task_id)
  values (p_agency_id, actor, p_request_id, created_task);
  return created_task;
end;
$$;

create function public.create_task_with_assignees(
  p_agency_id uuid,
  p_project_id uuid,
  p_board_id uuid,
  p_column_id uuid,
  p_parent_task_id uuid,
  p_title text,
  p_description text,
  p_priority text,
  p_status text,
  p_start_date date,
  p_due_date date,
  p_assignee_ids uuid[],
  p_request_id uuid
) returns uuid
language sql security definer set search_path = '' as $$
  select private.create_task_with_assignees(
    p_agency_id, p_project_id, p_board_id, p_column_id, p_parent_task_id, p_title,
    p_description, p_priority, p_status, p_start_date, p_due_date, p_assignee_ids, p_request_id
  );
$$;
revoke all on function private.create_task_with_assignees(uuid,uuid,uuid,uuid,uuid,text,text,text,text,date,date,uuid[],uuid) from public, anon, authenticated;
revoke all on function public.create_task_with_assignees(uuid,uuid,uuid,uuid,uuid,text,text,text,text,date,date,uuid[],uuid) from public, anon;
grant execute on function public.create_task_with_assignees(uuid,uuid,uuid,uuid,uuid,text,text,text,text,date,date,uuid[],uuid) to authenticated;
