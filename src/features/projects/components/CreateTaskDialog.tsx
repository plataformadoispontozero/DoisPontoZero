import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useCreateTask } from '@/features/tasks/hooks/useTasks'
import { toast } from '@/components/ui/Toast'
import type { BoardColumn, CreateTaskForm, Priority } from '@/types/projects'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: BoardColumn[]
  defaultColumnId?: string
  projectId: string
  boardId: string
  agencyId: string
  titlePrefix?: string
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  columns,
  defaultColumnId,
  projectId,
  boardId,
  agencyId,
  titlePrefix = '',
}) => {
  const createTask = useCreateTask()

  const [form, setForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    priority: 'normal',
    column_id: defaultColumnId ?? columns[0]?.id ?? '',
    due_date: null,
    start_date: null,
    assignee_ids: [],
    parent_task_id: null,
  })

  const [error, setError] = useState('')

  // Reset form when opened
  React.useEffect(() => {
    if (open) {
      setForm({
        title: '',
        description: '',
        priority: 'normal',
        column_id: defaultColumnId ?? columns[0]?.id ?? '',
        due_date: null,
        start_date: null,
        assignee_ids: [],
        parent_task_id: null,
      })
      setError('')
    }
  }, [open, defaultColumnId, columns])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('O título da tarefa é obrigatório.')
      return
    }

    try {
      const category = columns.find(c => c.id === form.column_id)?.category
      await createTask.mutateAsync({
        form: { ...form, title: titlePrefix ? `${titlePrefix} ${form.title.trim()}` : form.title.trim() },
        initialStatus: !category || category === 'backlog' ? 'open' : category,
        projectId,
        boardId,
        agencyId,
      })
      toast.success('Tarefa criada com sucesso!')
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao criar tarefa.')
      console.error(err)
    }
  }

  const columnOptions = columns.map((col) => ({
    value: col.id,
    label: col.name,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>Nova Tarefa</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
              Título <span className="text-red-400">*</span>
            </label>
            <Input
              id="task-title"
              placeholder="Ex.: Criar peças para Instagram"
              value={form.title}
              onChange={(e) => {
                setForm((f) => ({ ...f, title: e.target.value }))
                setError('')
              }}
              autoFocus
              className={error ? 'border-red-500/50' : ''}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
              Descrição
            </label>
            <Textarea
              id="task-description"
              placeholder="Detalhes, requisitos e critérios de aceitação..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Column + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                Coluna
              </label>
              <Select
                id="task-column"
                value={form.column_id}
                onChange={(e) => setForm((f) => ({ ...f, column_id: e.target.value }))}
                options={columnOptions}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                Prioridade
              </label>
              <Select
                id="task-priority"
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as Priority }))
                }
                options={PRIORITY_OPTIONS}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                Início
              </label>
              <Input
                id="task-start-date"
                type="date"
                value={form.start_date ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value || null }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                Prazo
              </label>
              <Input
                id="task-due-date"
                type="date"
                value={form.due_date ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value || null }))
                }
              />
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={createTask.isPending}
            disabled={createTask.isPending}
          >
            <Plus className="w-3.5 h-3.5" />
            Criar Tarefa
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
