-- Create within this validated transaction; published task RPC has a legacy signature.
create or replace function private.return_presentation_review_to_production(p_agency uuid,p_review uuid,p_task uuid default null,p_project uuid default null,p_department text default 'design')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 pres public.presentations%rowtype; r public.presentation_material_reviews%rowtype; a public.presentation_assets%rowtype;
 target public.tasks%rowtype; prior public.presentation_review_returns%rowtype;
 v_project_id uuid; v_board_id uuid; v_column_id uuid; v_task_id uuid; v_next_position double precision; prefix text; note text; is_new boolean:=p_task is null;
begin
 if auth.uid() is null or not public.has_agency_permission(p_agency,'presentations.edit') or not public.has_agency_permission(p_agency,'tasks.move') or not public.has_agency_permission(p_agency,'tasks.comment') then raise exception 'Permissão para editar apresentações, mover e comentar demandas necessária.' using errcode='42501'; end if;
 -- Same lock used by client submissions: serializes latest-review checks and retries.
 select p.* into pres from public.presentations p join public.presentation_material_reviews rv on rv.presentation_id=p.id and rv.agency_id=p.agency_id where rv.id=p_review and p.agency_id=p_agency for update of p;
 if not found or pres.status='archived' or pres.archived_at is not null or not exists(select 1 from public.clients c where c.id=pres.client_id and c.agency_id=p_agency) then raise exception 'Apresentação indisponível.'; end if;
 select * into r from public.presentation_material_reviews where id=p_review and agency_id=p_agency;
 if r.decision not in ('changes_requested','rejected') or not exists(select 1 from public.presentation_material_reviews latest where latest.id=r.id and latest.id=(select v.id from public.presentation_material_reviews v where v.presentation_id=pres.id and v.asset_id=r.asset_id and v.agency_id=p_agency order by v.created_at desc,v.id desc limit 1)) then raise exception 'A avaliação mudou. Atualize o painel antes de reenviar.'; end if;
 select * into prior from public.presentation_review_returns where review_id=r.id and agency_id=p_agency;
 if found then return jsonb_build_object('task_id',prior.task_id,'already_sent',true); end if;
 select * into a from public.presentation_assets where id=r.asset_id and presentation_id=pres.id and agency_id=p_agency;
 if not found then raise exception 'Material indisponível.'; end if;
 note:=format(E'Ajuste solicitado na apresentação: %s\nMaterial: %s\nRetorno do cliente: %s\nApresentação: /presentations/%s',pres.title,a.title,coalesce(nullif(trim(r.note),''),'Revisar o material reprovado com o cliente.'),pres.id);
 if p_task is not null then
  select t.* into target from public.tasks t join public.projects pr on pr.id=t.project_id and pr.agency_id=t.agency_id where t.id=p_task and t.agency_id=p_agency and pr.client_id=pres.client_id and pr.archived_at is null and t.archived_at is null and t.status<>'archived' for update of t;
  if not found or not public.can_access_task(target.id) or not (target.title like '[Design]%' or target.title like '[Videomaker]%' or target.title like '[Tráfego Pago]%') then raise exception 'Selecione uma demanda de produção acessível do mesmo cliente.' using errcode='42501'; end if;
  v_task_id:=target.id; v_board_id:=target.board_id;
 else
  if not public.has_agency_permission(p_agency,'tasks.create') then raise exception 'Permissão para criar demandas necessária.' using errcode='42501'; end if;
  prefix:=case p_department when 'design' then '[Design]' when 'video' then '[Videomaker]' when 'traffic' then '[Tráfego Pago]' else null end;
  if prefix is null then raise exception 'Setor inválido.'; end if;
  v_project_id:=coalesce(p_project,pres.production_project_id);
  if v_project_id is null then
   if not public.has_agency_permission(p_agency,'projects.create') then raise exception 'Selecione um projeto existente ou solicite a criação ao responsável.' using errcode='42501'; end if;
   v_project_id:=public.create_project_with_board(p_agency,pres.client_id,left('Ajustes · '||pres.title,240),'Ajustes dos materiais da apresentação '||pres.id::text,'normal','active',null,null,auth.uid(),null);
   update public.presentations set production_project_id=v_project_id where id=pres.id and agency_id=p_agency;
  end if;
  if not exists(select 1 from public.projects pr where pr.id=v_project_id and pr.agency_id=p_agency and pr.client_id=pres.client_id and pr.archived_at is null and public.can_access_project(pr.id)) then raise exception 'Projeto indisponível ou de outro cliente.' using errcode='42501'; end if;
  select b.id into v_board_id from public.project_boards b where b.project_id=v_project_id and b.agency_id=p_agency order by b.is_default desc,b.created_at,b.id limit 1;
 end if;
 select bc.id into v_column_id from public.board_columns bc where bc.board_id=v_board_id and bc.agency_id=p_agency and bc.category='in_progress' order by bc.position,bc.id limit 1;
 if v_column_id is null then raise exception 'O quadro precisa de uma coluna Em produção.'; end if;
 if is_new then
  perform 1 from public.board_columns where id=v_column_id and agency_id=p_agency for update;
  select coalesce(max(t.position),0)+1000 into v_next_position from public.tasks t where t.column_id=v_column_id and t.agency_id=p_agency;
  insert into public.tasks(agency_id,project_id,board_id,column_id,title,description,priority,status,position,created_by)
  values(p_agency,v_project_id,v_board_id,v_column_id,left(prefix||' Ajuste · '||a.title,500),note,'normal','in_progress',v_next_position,auth.uid()) returning id into v_task_id;
  insert into public.task_activity(agency_id,task_id,actor_user_id,action,metadata) values(p_agency,v_task_id,auth.uid(),'created',jsonb_build_object('title',prefix||' Ajuste · '||a.title));
 else
  select coalesce(max(t.position),0)+1000 into v_next_position from public.tasks t where t.column_id=v_column_id and t.agency_id=p_agency;
  perform public.move_task(v_task_id,v_column_id,v_next_position);
 end if;
 insert into public.task_comments(agency_id,task_id,author_id,content) values(p_agency,v_task_id,auth.uid(),note);
 insert into public.task_activity(agency_id,task_id,actor_user_id,action,metadata) values(p_agency,v_task_id,auth.uid(),'presentation_review_returned',jsonb_build_object('presentation_id',pres.id,'asset_id',a.id,'review_id',r.id,'decision',r.decision));
 insert into public.presentation_review_returns(review_id,agency_id,presentation_id,asset_id,task_id,created_by) values(r.id,p_agency,pres.id,a.id,v_task_id,auth.uid());
 return jsonb_build_object('task_id',v_task_id,'already_sent',false,'created',is_new);
end $$;
