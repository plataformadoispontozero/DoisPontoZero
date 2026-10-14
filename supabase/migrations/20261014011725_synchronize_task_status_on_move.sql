-- Synchronize canonical task status when moving between production columns.
-- No row backfill; authorization checks and activity history are preserved.
CREATE OR REPLACE FUNCTION public.move_task(
  p_task_id      UUID,
  p_column_id    UUID,
  p_position     DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task        RECORD;
  v_old_col_name TEXT;
  v_new_col_name TEXT;
BEGIN
  SELECT t.*, bc.name AS col_name
  INTO v_task
  FROM public.tasks t
  JOIN public.board_columns bc ON bc.id = t.column_id
  WHERE t.id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarefa não encontrada';
  END IF;

  -- Verifica permissão de movimentação
  IF NOT (
    public.can_access_project(v_task.project_id)
    AND (
      public.has_agency_permission(v_task.agency_id, 'tasks.move')
      OR public.is_agency_owner(v_task.agency_id)
      OR v_task.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.task_assignees ta
        WHERE ta.task_id = p_task_id AND ta.user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Permissão negada para mover esta tarefa';
  END IF;

  -- Verifica que a nova coluna pertence ao mesmo board
  IF NOT EXISTS (
    SELECT 1 FROM public.board_columns bc
    WHERE bc.id = p_column_id AND bc.board_id = v_task.board_id
  ) THEN
    RAISE EXCEPTION 'Coluna de destino não pertence ao mesmo quadro';
  END IF;

  -- Obtém nome das colunas para o log
  SELECT name INTO v_old_col_name FROM public.board_columns WHERE id = v_task.column_id;
  SELECT name INTO v_new_col_name FROM public.board_columns WHERE id = p_column_id;

  -- Atualiza a tarefa
  UPDATE public.tasks
  SET
    column_id    = p_column_id,
    position     = p_position,
    status       = CASE (SELECT category FROM public.board_columns WHERE id = p_column_id)
      WHEN 'backlog' THEN 'open'
      WHEN 'todo' THEN 'open'
      WHEN 'in_progress' THEN 'in_progress'
      WHEN 'review' THEN 'review'
      WHEN 'done' THEN 'done'
      ELSE status
    END,
    updated_at   = now(),
    -- Atualiza completed_at se chegou em coluna done
    completed_at = CASE
      WHEN (
        SELECT category FROM public.board_columns WHERE id = p_column_id
      ) = 'done' AND completed_at IS NULL THEN now()
      WHEN (
        SELECT category FROM public.board_columns WHERE id = p_column_id
      ) != 'done' THEN NULL
      ELSE completed_at
    END
  WHERE id = p_task_id;

  -- Registra atividade
  INSERT INTO public.task_activity (agency_id, task_id, actor_user_id, action, metadata)
  VALUES (
    v_task.agency_id, p_task_id, auth.uid(), 'moved',
    jsonb_build_object(
      'from_column', v_old_col_name,
      'to_column', v_new_col_name,
      'from_column_id', v_task.column_id,
      'to_column_id', p_column_id
    )
  );
END;
$$;
