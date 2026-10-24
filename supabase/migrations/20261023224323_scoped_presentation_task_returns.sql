-- Private per-demand return history survives deletion of its source presentation/material/review.
CREATE TABLE public.task_presentation_returns (
 id uuid PRIMARY KEY,
 agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
 task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
 presentation_id uuid NOT NULL,
 asset_id uuid NOT NULL,
 material_title text NOT NULL,
 presentation_title text NOT NULL,
 decision text NOT NULL CHECK(decision IN ('changes_requested','rejected')),
 note text NOT NULL,
 comment_snapshot text NOT NULL,
 created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 actor_name text NOT NULL,
 returned_at timestamptz NOT NULL DEFAULT now(),
 file_reference_id uuid,
 google_file_id text,
 folder_id text,
 file_modified_time timestamptz,
 file_mime_type text,
 file_name text,
 file_size_bytes bigint,
 file_snapshot_captured_at timestamptz NOT NULL DEFAULT now(),
 file_snapshot_verified boolean NOT NULL DEFAULT false
);
CREATE INDEX task_presentation_returns_task ON public.task_presentation_returns(agency_id,task_id,returned_at DESC);
ALTER TABLE public.task_presentation_returns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.task_presentation_returns FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.task_presentation_returns TO authenticated;

-- Only the sender and the task's CURRENT active assignees can read this specific record.
CREATE OR REPLACE FUNCTION private.can_view_task_presentation_return(p_review uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
 SELECT 1 FROM public.task_presentation_returns r JOIN public.tasks t ON t.id=r.task_id AND t.agency_id=r.agency_id
 WHERE r.id=p_review AND private.can_editorial(r.agency_id,'tasks.view')
 AND (r.created_by=auth.uid() OR EXISTS(SELECT 1 FROM public.task_assignees ta JOIN public.agency_members m ON m.user_id=ta.user_id AND m.agency_id=ta.agency_id AND m.status='active' WHERE ta.task_id=r.task_id AND ta.agency_id=r.agency_id AND ta.user_id=auth.uid())));
$$;
REVOKE ALL ON FUNCTION private.can_view_task_presentation_return(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.can_view_task_presentation_return(uuid) TO authenticated;
CREATE POLICY task_presentation_returns_participant_read ON public.task_presentation_returns FOR SELECT TO authenticated USING(private.can_view_task_presentation_return(id));
DROP POLICY presentation_returns_read ON public.presentation_review_returns;
CREATE POLICY presentation_returns_participant_read ON public.presentation_review_returns FOR SELECT TO authenticated USING(private.can_view_task_presentation_return(review_id));

ALTER TABLE public.task_comments ADD COLUMN presentation_return_id uuid;
ALTER TABLE public.task_activity ADD COLUMN presentation_return_id uuid;
CREATE POLICY task_return_comment_scope ON public.task_comments AS RESTRICTIVE FOR SELECT TO authenticated USING(presentation_return_id IS NULL OR private.can_view_task_presentation_return(presentation_return_id));
CREATE POLICY task_return_comment_participant_read ON public.task_comments FOR SELECT TO authenticated USING(presentation_return_id IS NOT NULL AND private.can_view_task_presentation_return(presentation_return_id));
CREATE POLICY task_return_comment_no_edit ON public.task_comments AS RESTRICTIVE FOR UPDATE TO authenticated USING(presentation_return_id IS NULL) WITH CHECK(presentation_return_id IS NULL);
CREATE POLICY task_return_comment_no_delete ON public.task_comments AS RESTRICTIVE FOR DELETE TO authenticated USING(presentation_return_id IS NULL);
CREATE POLICY task_return_comment_no_direct_insert ON public.task_comments AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(presentation_return_id IS NULL);
CREATE POLICY task_return_activity_scope ON public.task_activity AS RESTRICTIVE FOR SELECT TO authenticated USING(presentation_return_id IS NULL OR private.can_view_task_presentation_return(presentation_return_id));
CREATE POLICY task_return_activity_participant_read ON public.task_activity FOR SELECT TO authenticated USING(presentation_return_id IS NOT NULL AND private.can_view_task_presentation_return(presentation_return_id));
CREATE POLICY task_return_activity_no_direct_insert ON public.task_activity AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(presentation_return_id IS NULL);
-- Let the sender retain the task card without changing general project permissions.
CREATE POLICY task_return_sender_task_read ON public.tasks FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.task_presentation_returns r WHERE r.task_id=tasks.id AND r.agency_id=tasks.agency_id AND r.created_by=auth.uid()));

-- Preserve existing generated return notes before restricting their old generic surfaces.
INSERT INTO public.task_presentation_returns(id,agency_id,task_id,presentation_id,asset_id,material_title,presentation_title,decision,note,comment_snapshot,created_by,actor_name,returned_at,file_reference_id,google_file_id,folder_id,file_modified_time,file_mime_type,file_name,file_size_bytes,file_snapshot_verified)
SELECT rr.review_id,rr.agency_id,rr.task_id,rr.presentation_id,rr.asset_id,a.title,p.title,rv.decision,rv.note,
 format(E'Ajuste solicitado na apresentação: %s\nMaterial: %s\nRetorno do cliente: %s\nApresentação: /presentations/%s',p.title,a.title,coalesce(nullif(trim(rv.note),''),'Revisar o material reprovado com o cliente.'),p.id),
 rr.created_by,coalesce(u.full_name,'Membro da equipe'),rr.created_at,a.file_reference_id,d.google_file_id,d.parent_folder_id,d.modified_time,d.mime_type,d.name,d.size_bytes,coalesce(rv.content_hash=private.presentation_review_content_hash(p.id) AND d.modified_time<=rr.created_at AND d.google_file_id IS NOT NULL AND d.mime_type IS NOT NULL,false)
FROM public.presentation_review_returns rr JOIN public.presentation_material_reviews rv ON rv.id=rr.review_id AND rv.agency_id=rr.agency_id JOIN public.presentations p ON p.id=rr.presentation_id AND p.agency_id=rr.agency_id JOIN public.presentation_assets a ON a.id=rr.asset_id AND a.agency_id=rr.agency_id JOIN public.tasks t ON t.id=rr.task_id AND t.agency_id=rr.agency_id LEFT JOIN public.profiles u ON u.id=rr.created_by LEFT JOIN public.drive_file_references d ON d.id=a.file_reference_id AND d.agency_id=rr.agency_id;
UPDATE public.task_comments c SET presentation_return_id=r.id FROM public.task_presentation_returns r WHERE c.task_id=r.task_id AND c.agency_id=r.agency_id AND c.author_id=r.created_by AND c.created_at=r.returned_at AND c.content=r.comment_snapshot;
UPDATE public.task_activity a SET presentation_return_id=r.id FROM public.task_presentation_returns r WHERE a.task_id=r.task_id AND a.agency_id=r.agency_id AND a.action='presentation_review_returned' AND a.metadata->>'review_id'=r.id::text;
-- Only the exact system-generated description is moved to the protected snapshot; custom descriptions are untouched.
UPDATE public.tasks t SET description='Ajuste de material. O retorno detalhado está no histórico restrito da demanda.' FROM public.task_presentation_returns r WHERE t.id=r.task_id AND t.agency_id=r.agency_id AND t.description=r.comment_snapshot;

CREATE OR REPLACE FUNCTION public.get_task_presentation_returns(p_agency uuid,p_task uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'asset_id',r.asset_id,'material_title',r.material_title,'presentation_id',r.presentation_id,'presentation_title',r.presentation_title,'note',r.note,'decision',r.decision,'returned_at',r.returned_at,'actor_name',r.actor_name,'has_preview',r.google_file_id IS NOT NULL AND r.file_snapshot_verified) ORDER BY r.returned_at DESC,r.id DESC),'[]'::jsonb)
 FROM public.task_presentation_returns r WHERE r.agency_id=p_agency AND r.task_id=p_task AND private.can_view_task_presentation_return(r.id);
$$;
REVOKE ALL ON FUNCTION public.get_task_presentation_returns(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_task_presentation_returns(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_task_presentation_return_media(p_review uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.task_presentation_returns;
BEGIN
 IF NOT private.can_view_task_presentation_return(p_review) THEN RAISE EXCEPTION 'Acesso ao retorno atribuído necessário' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.task_presentation_returns WHERE id=p_review;
 IF r.google_file_id IS NULL OR NOT r.file_snapshot_verified THEN RAISE EXCEPTION 'Material sem referência de arquivo disponível'; END IF;
 RETURN jsonb_build_object('agencyId',r.agency_id,'fileReferenceId',r.file_reference_id,'googleFileId',r.google_file_id,'folderId',r.folder_id,'modifiedTime',r.file_modified_time,'mimeType',r.file_mime_type,'name',r.file_name,'previewAvailable',true);
END; $$;
REVOKE ALL ON FUNCTION public.get_task_presentation_return_media(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_task_presentation_return_media(uuid) TO authenticated;

-- One defaulted six-argument RPC replaces the old five-argument signature, avoiding PostgREST overload ambiguity.
DROP FUNCTION public.return_presentation_review_to_production(uuid,uuid,uuid,uuid,text);
DROP FUNCTION private.return_presentation_review_to_production(uuid,uuid,uuid,uuid,text);
create or replace function private.return_presentation_review_to_production(p_agency uuid,p_review uuid,p_task uuid default null,p_project uuid default null,p_department text default 'design',p_assignee_ids uuid[] default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 pres public.presentations%rowtype; r public.presentation_material_reviews%rowtype; a public.presentation_assets%rowtype;
 target public.tasks%rowtype; prior public.presentation_review_returns%rowtype;
 v_project_id uuid; v_board_id uuid; v_column_id uuid; v_task_id uuid; v_next_position double precision; prefix text; note text; is_new boolean:=p_task is null; new_project boolean:=false; selected_ids uuid[]; f public.drive_file_references; actor_label text; previous_context text;
begin
 if auth.uid() is null or not private.can_editorial(p_agency,'presentations.edit') or not private.can_editorial(p_agency,'tasks.move') or not private.can_editorial(p_agency,'tasks.comment') or not private.can_editorial(p_agency,'tasks.view') then raise exception 'Permissão para editar apresentações, mover e comentar demandas necessária.' using errcode='42501'; end if;
 -- Same lock used by client submissions: serializes latest-review checks and retries.
 select p.* into pres from public.presentations p join public.presentation_material_reviews rv on rv.presentation_id=p.id and rv.agency_id=p.agency_id where rv.id=p_review and p.agency_id=p_agency for update of p;
 if not found or pres.status='archived' or pres.archived_at is not null or not exists(select 1 from public.clients c where c.id=pres.client_id and c.agency_id=p_agency) then raise exception 'Apresentação indisponível.'; end if;
 select * into r from public.presentation_material_reviews where id=p_review and agency_id=p_agency;
 if r.content_hash is distinct from private.presentation_review_content_hash(pres.id) or r.public_link_id is distinct from (select l.id from public.presentation_public_links l where l.presentation_id=pres.id and l.agency_id=p_agency and l.revoked_at is null order by l.created_at desc,l.id desc limit 1) or not exists(select 1 from public.presentation_public_links l where l.id=r.public_link_id and l.presentation_id=pres.id and l.agency_id=p_agency and l.revoked_at is null and (l.expires_at is null or l.expires_at>now())) or r.decision not in ('changes_requested','rejected') or not exists(select 1 from public.presentation_material_reviews latest where latest.id=r.id and latest.id=(select v.id from public.presentation_material_reviews v where v.presentation_id=pres.id and v.asset_id=r.asset_id and v.agency_id=p_agency order by v.created_at desc,v.id desc limit 1)) then raise exception 'A avaliação mudou. Atualize o painel antes de reenviar.'; end if;
 select * into prior from public.presentation_review_returns where review_id=r.id and agency_id=p_agency;
 if found then
 if not private.can_view_task_presentation_return(r.id) then raise exception 'Retorno já enviado; acesso restrito aos participantes da demanda.' using errcode='42501'; end if;
 return jsonb_build_object('task_id',prior.task_id,'already_sent',true); end if;
 select * into a from public.presentation_assets where id=r.asset_id and presentation_id=pres.id and agency_id=p_agency for share;
 if not found then raise exception 'Material indisponível.'; end if;
 select * into f from public.drive_file_references where id=a.file_reference_id and agency_id=p_agency for share;
 if r.content_hash is distinct from private.presentation_review_content_hash(pres.id) then raise exception 'O material mudou. Atualize a avaliação antes de reenviar.'; end if;
 note:=format(E'Ajuste solicitado na apresentação: %s\nMaterial: %s\nRetorno do cliente: %s\nApresentação: /presentations/%s',pres.title,a.title,coalesce(nullif(trim(r.note),''),'Revisar o material reprovado com o cliente.'),pres.id);
 if p_task is not null then
  select t.* into target from public.tasks t join public.projects pr on pr.id=t.project_id and pr.agency_id=t.agency_id where t.id=p_task and t.agency_id=p_agency and pr.client_id=pres.client_id and pr.archived_at is null and t.archived_at is null and t.status<>'archived' for update of t;
  if not found or not public.can_access_task(target.id) or not (target.title like '[Design]%' or target.title like '[Videomaker]%' or target.title like '[Tráfego Pago]%') then raise exception 'Selecione uma demanda de produção acessível do mesmo cliente.' using errcode='42501'; end if;
  if cardinality(coalesce(p_assignee_ids,array[]::uuid[]))>0 then raise exception 'Atribuições da demanda existente são preservadas. Altere os responsáveis na própria demanda.'; end if;
  perform 1 from public.task_assignees ta join public.agency_members m on m.agency_id=ta.agency_id and m.user_id=ta.user_id where ta.task_id=target.id and ta.agency_id=p_agency for share of ta,m;
  if not exists(select 1 from public.task_assignees ta join public.agency_members m on m.agency_id=ta.agency_id and m.user_id=ta.user_id and m.status='active' where ta.task_id=target.id and ta.agency_id=p_agency) then raise exception 'Atribua ao menos um membro ativo à demanda antes de reenviar.'; end if;
  v_task_id:=target.id; v_board_id:=target.board_id;
 else
  if not private.can_editorial(p_agency,'tasks.assign') then raise exception 'Permissão para atribuir responsáveis necessária.' using errcode='42501'; end if;
  if cardinality(coalesce(p_assignee_ids,array[]::uuid[])) not between 1 and 200 or array_position(p_assignee_ids,null) is not null then raise exception 'Selecione ao menos um responsável ativo (máximo 200).'; end if;
  select array_agg(distinct x) into selected_ids from unnest(p_assignee_ids) x;
  if exists(select 1 from unnest(selected_ids) x where not exists(select 1 from public.agency_members m where m.agency_id=p_agency and m.user_id=x and m.status='active')) then raise exception 'Selecione apenas responsáveis ativos desta agência.'; end if;
  if not private.can_editorial(p_agency,'tasks.create') then raise exception 'Permissão para criar demandas necessária.' using errcode='42501'; end if;
  prefix:=case p_department when 'design' then '[Design]' when 'video' then '[Videomaker]' when 'traffic' then '[Tráfego Pago]' else null end;
  if prefix is null then raise exception 'Setor inválido.'; end if;
  v_project_id:=coalesce(p_project,pres.production_project_id);
  if v_project_id is null then
   if not private.can_editorial(p_agency,'projects.create') then raise exception 'Selecione um projeto existente ou solicite a criação ao responsável.' using errcode='42501'; end if;
   v_project_id:=public.create_project_with_board(p_agency,pres.client_id,left('Ajustes · '||pres.title,240),'Ajustes dos materiais da apresentação '||pres.id::text,'normal','active',null,null,auth.uid(),null);
   new_project:=true;
   update public.presentations set production_project_id=v_project_id where id=pres.id and agency_id=p_agency;
  end if;
  if not exists(select 1 from public.projects pr where pr.id=v_project_id and pr.agency_id=p_agency and pr.client_id=pres.client_id and pr.archived_at is null and public.can_access_project(pr.id)) then raise exception 'Projeto indisponível ou de outro cliente.' using errcode='42501'; end if;
  if new_project then
   insert into public.project_members(agency_id,project_id,user_id) select p_agency,v_project_id,x from unnest(selected_ids) x on conflict(project_id,user_id) do nothing;
  elsif exists(select 1 from unnest(selected_ids) x where not exists(select 1 from public.project_members pm where pm.agency_id=p_agency and pm.project_id=v_project_id and pm.user_id=x)) then raise exception 'Responsável fora do projeto. Selecione membros já vinculados ao projeto de produção.'; end if;
  select b.id into v_board_id from public.project_boards b where b.project_id=v_project_id and b.agency_id=p_agency order by b.is_default desc,b.created_at,b.id limit 1;
 end if;
 select bc.id into v_column_id from public.board_columns bc where bc.board_id=v_board_id and bc.agency_id=p_agency and bc.category='in_progress' order by bc.position,bc.id limit 1;
 if v_column_id is null then raise exception 'O quadro precisa de uma coluna Em produção.'; end if;
 previous_context:=current_setting('app.presentation_review_return',true);
 perform set_config('app.presentation_review_return','true',true);
 if is_new then
  v_task_id:=public.create_task_with_assignees(p_agency,v_project_id,v_board_id,v_column_id,null,left(prefix||' Ajuste de material',500),'Ajuste de material. O retorno detalhado está no histórico restrito da demanda.','normal','in_progress',null,null,selected_ids,r.id);
 else
  select coalesce(max(t.position),0)+1000 into v_next_position from public.tasks t where t.column_id=v_column_id and t.agency_id=p_agency;
  perform public.move_task(v_task_id,v_column_id,v_next_position);
 end if;
 perform set_config('app.presentation_review_return',coalesce(previous_context,''),true);
 select full_name into actor_label from public.profiles where id=auth.uid();
 insert into public.task_presentation_returns(id,agency_id,task_id,presentation_id,asset_id,material_title,presentation_title,decision,note,comment_snapshot,created_by,actor_name,file_reference_id,google_file_id,folder_id,file_modified_time,file_mime_type,file_name,file_size_bytes,file_snapshot_verified)
 values(r.id,p_agency,v_task_id,pres.id,a.id,a.title,pres.title,r.decision,r.note,note,auth.uid(),coalesce(actor_label,'Membro da equipe'),a.file_reference_id,f.google_file_id,f.parent_folder_id,f.modified_time,f.mime_type,f.name,f.size_bytes,f.google_file_id IS NOT NULL AND f.modified_time IS NOT NULL AND f.mime_type IS NOT NULL);
 insert into public.task_comments(agency_id,task_id,author_id,content,presentation_return_id) values(p_agency,v_task_id,auth.uid(),note,r.id);
 insert into public.task_activity(agency_id,task_id,actor_user_id,action,metadata,presentation_return_id) values(p_agency,v_task_id,auth.uid(),'presentation_review_returned',jsonb_build_object('presentation_id',pres.id,'asset_id',a.id,'review_id',r.id,'decision',r.decision,'file_reference_id',a.file_reference_id,'material_title',a.title,'note',r.note),r.id);
 insert into public.presentation_review_returns(review_id,agency_id,presentation_id,asset_id,task_id,created_by) values(r.id,p_agency,pres.id,a.id,v_task_id,auth.uid());
 insert into public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id)
 select p_agency,m.user_id,'material_changes_requested','Retorno de material enviado à demanda','Há um retorno de apresentação no histórico restrito da demanda.','task',v_task_id
 from public.agency_members m where m.agency_id=p_agency and m.status='active' and private.operational_notification_access(p_agency,m.user_id,'tasks.view')
 and (m.user_id=auth.uid() or exists(select 1 from public.task_assignees ta where ta.agency_id=p_agency and ta.task_id=v_task_id and ta.user_id=m.user_id));
 return jsonb_build_object('task_id',v_task_id,'already_sent',false,'created',is_new);
end $$;
CREATE FUNCTION public.return_presentation_review_to_production(p_agency uuid,p_review uuid,p_task uuid default null,p_project uuid default null,p_department text default 'design',p_assignee_ids uuid[] default null)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.return_presentation_review_to_production(p_agency,p_review,p_task,p_project,p_department,p_assignee_ids); $$;
REVOKE ALL ON FUNCTION private.return_presentation_review_to_production(uuid,uuid,uuid,uuid,text,uuid[]),public.return_presentation_review_to_production(uuid,uuid,uuid,uuid,text,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.return_presentation_review_to_production(uuid,uuid,uuid,uuid,text,uuid[]),public.return_presentation_review_to_production(uuid,uuid,uuid,uuid,text,uuid[]) TO authenticated;

create or replace function private.assign_new_client_demand() returns trigger language plpgsql security definer set search_path='' as $$
declare client uuid; sector text;
begin
 if current_setting('app.presentation_review_return',true)='true' then return new;end if;
 sector:=case when new.title like '[Design]%' then 'design' when new.title like '[Videomaker]%' then 'videomaker' when new.title like '[Tráfego Pago]%' then 'traffic' when new.title like '[Social Media]%' then 'social_media' else null end;
 if sector is null then return new;end if;
 select client_id into client from public.projects where id=new.project_id and agency_id=new.agency_id;
 insert into public.project_members(agency_id,project_id,user_id) select distinct new.agency_id,new.project_id,a.user_id from private.client_department_assignments a join public.agency_members m on m.agency_id=a.agency_id and m.user_id=a.user_id and m.status='active' where a.agency_id=new.agency_id and a.client_id=client and a.department=sector on conflict(project_id,user_id) do nothing;
 insert into public.task_assignees(agency_id,task_id,user_id) select new.agency_id,new.id,a.user_id from private.client_department_assignments a join public.agency_members m on m.agency_id=a.agency_id and m.user_id=a.user_id and m.status='active' where a.agency_id=new.agency_id and a.client_id=client and a.department=sector on conflict(task_id,user_id) do nothing;
 return new;
end;$$;

create or replace function private.notify_task_production_started() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if current_setting('app.presentation_review_return',true)='true' then return new;end if;
 if new.status is not distinct from old.status or new.status<>'in_progress' or auth.uid() is null or not exists(select 1 from public.agency_members m join public.agencies a on a.id=m.agency_id where m.agency_id=new.agency_id and m.user_id=auth.uid() and m.status='active' and a.status='active') then return new;end if;
 if not exists(select 1 from public.projects where id=new.project_id and agency_id=new.agency_id) then return new;end if;
 insert into public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id)
 select new.agency_id,m.user_id,'task_production_started','Demanda entrou em produção',new.title||' está em produção.','task',new.id
 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id
 where m.agency_id=new.agency_id and m.user_id<>auth.uid() and private.operational_notification_access(new.agency_id,m.user_id,'tasks.view')
 and (exists(select 1 from public.task_assignees ta where ta.agency_id=new.agency_id and ta.task_id=new.id and ta.user_id=m.user_id) or r.name in ('OWNER','ADMIN','MANAGER','GESTOR'))
 and (r.name in ('OWNER','ADMIN') or exists(select 1 from public.project_members pm where pm.agency_id=new.agency_id and pm.project_id=new.project_id and pm.user_id=m.user_id) or exists(select 1 from public.projects p where p.id=new.project_id and p.agency_id=new.agency_id and (p.created_by=m.user_id or p.owner_id=m.user_id)));
 return new;
end;$$;

-- Evaluate legacy notification scope in a definer helper, so RLS cannot make NOT EXISTS appear true.
CREATE OR REPLACE FUNCTION private.can_read_task_return_notification(p_agency uuid,p_task uuid,p_created_at timestamptz)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT NOT EXISTS(SELECT 1 FROM public.task_presentation_returns r WHERE r.task_id=p_task AND r.agency_id=p_agency AND r.returned_at=p_created_at)
 OR EXISTS(SELECT 1 FROM public.task_presentation_returns r WHERE r.task_id=p_task AND r.agency_id=p_agency AND r.returned_at=p_created_at AND private.can_view_task_presentation_return(r.id));
$$;
REVOKE ALL ON FUNCTION private.can_read_task_return_notification(uuid,uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.can_read_task_return_notification(uuid,uuid,timestamptz) TO authenticated;
CREATE POLICY task_return_notification_scope ON public.notifications AS RESTRICTIVE FOR SELECT TO authenticated USING(
 NOT(type IN ('task_production_started','material_changes_requested') AND resource_type='task')
 OR private.can_read_task_return_notification(agency_id,resource_id,created_at)
);

-- Protect the scope tag from future UPDATE policies or definer helpers that edit generic history.
CREATE OR REPLACE FUNCTION private.guard_scoped_task_return_history_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.presentation_return_id IS NOT NULL THEN RAISE EXCEPTION 'Histórico de retorno é imutável'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_scoped_task_return_history_update() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER task_return_activity_immutable BEFORE UPDATE ON public.task_activity FOR EACH ROW EXECUTE FUNCTION private.guard_scoped_task_return_history_update();
CREATE TRIGGER task_return_comment_immutable BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION private.guard_scoped_task_return_history_update();

CREATE OR REPLACE FUNCTION private.guard_task_return_notification_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF OLD.type IN ('task_production_started','material_changes_requested') AND OLD.resource_type='task' AND EXISTS(SELECT 1 FROM public.task_presentation_returns r WHERE r.task_id=OLD.resource_id AND r.agency_id=OLD.agency_id AND r.returned_at=OLD.created_at)
 AND (NEW.type IS DISTINCT FROM OLD.type OR NEW.resource_type IS DISTINCT FROM OLD.resource_type OR NEW.resource_id IS DISTINCT FROM OLD.resource_id OR NEW.agency_id IS DISTINCT FROM OLD.agency_id OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.title IS DISTINCT FROM OLD.title OR NEW.body IS DISTINCT FROM OLD.body) THEN RAISE EXCEPTION 'Identidade da notificação de retorno é imutável'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_task_return_notification_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER task_return_notification_identity BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION private.guard_task_return_notification_identity();
