import {defaultPhotography} from '@/features/production/photographicDirection'
import {PhotographyDirectionFields} from '@/features/production/PhotographyDirectionFields'
import React, { useRef, useState } from 'react'
import {serializeCreativeDemand,type CreativeDemand} from './creativeDemand'
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

  const emptyCreative=React.useCallback(():CreativeDemand=>({format:titlePrefix==='[Videomaker]'?'reels':titlePrefix==='[Design]'?'post':'general',title:'',support:'',cta:'',caption:'',hashtags:'',direction:'',angle:'',sequence:'',photography:defaultPhotography()}),[titlePrefix])
  const [creative,setCreative]=useState<CreativeDemand>(emptyCreative)
  const structured=creative.format!=='general'
  const [error, setError] = useState('')
  const requestId = useRef<string | null>(null)
  if (!requestId.current) requestId.current = crypto.randomUUID()

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
      setCreative(emptyCreative())
      setError('')
      requestId.current = crypto.randomUUID()
    }
  }, [open, defaultColumnId, columns, emptyCreative])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('O título da tarefa é obrigatório.')
      return
    }

    if(structured&&[creative.support,creative.cta,creative.caption,creative.hashtags,creative.direction,creative.angle].some(v=>!v.trim())){setError('Preencha texto de apoio, CTA, legenda, hashtags, direção criativa e ângulo.');return}
    if(structured&&creative.format!=='post'&&!creative.sequence.trim()){setError('Descreva as lâminas do carrossel ou as cenas do vídeo.');return}
    try {
      const activeRequestId=requestId.current||crypto.randomUUID()
      requestId.current=activeRequestId
      const category = columns.find(c => c.id === form.column_id)?.category
      await createTask.mutateAsync({
        form: { ...form, description:structured?serializeCreativeDemand({...creative,title:form.title}):form.description, title: `${structured?(creative.format==='reels'?'[Videomaker]':'[Design]'):titlePrefix} ${form.title.trim()}`.trim() },
        initialStatus: !category || category === 'backlog' ? 'open' : category,
        projectId,
        boardId,
        agencyId,
        requestId: activeRequestId,
      })
      toast.success('Tarefa criada com sucesso!')
      requestId.current = crypto.randomUUID()
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
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-3xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>Nova Tarefa</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <label className="block text-sm">Formato da demanda<Select aria-label="Formato da demanda" value={creative.format} onChange={e=>setCreative(c=>({...c,format:e.target.value}))} options={[...(['[Design]','[Videomaker]'].includes(titlePrefix)?[]:[{value:'general',label:'Demanda geral'}]),...(titlePrefix==='[Videomaker]'?[]:[{value:'post',label:'Post estático'},{value:'carousel',label:'Carrossel'}]),{value:'reels',label:'Vídeo / roteiro'}]}/></label>
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
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
          {!structured&&<div>
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

          }
          {structured&&<section className="space-y-4 rounded-xl border border-white/10 p-4"><h3 className="font-semibold">Copy e direção de produção</h3><p className="text-xs text-zinc-400">Preencha o conteúdo aprovado. A legenda e as hashtags serão salvas juntas na demanda.</p>{([['support','Texto de apoio'],['cta','CTA'],['caption','Legenda'],['hashtags','Hashtags'],['direction','Direção criativa'],['angle','Ângulo e enquadramento']] as const).map(([key,label])=><label key={key} className="block text-sm">{label}<Textarea aria-label={label} value={creative[key]} onChange={e=>setCreative(c=>({...c,[key]:e.target.value}))} rows={key==='caption'||key==='direction'?4:2} placeholder={key==='direction'?'Imagem, composição, iluminação, referências e elementos da marca':key==='angle'?'Ângulo da imagem, plano, enquadramento e movimento de câmera':undefined}/></label>)}<PhotographyDirectionFields value={creative.photography||defaultPhotography()} copy={form.title} disabled={createTask.isPending} onChange={photography=>setCreative(c=>({...c,photography}))}/>{creative.format!=='post'&&<label className="block text-sm">{creative.format==='carousel'?'Lâminas do carrossel':'Cenas do roteiro'}<Textarea aria-label={creative.format==='carousel'?'Lâminas do carrossel':'Cenas do roteiro'} rows={8} value={creative.sequence} onChange={e=>setCreative(c=>({...c,sequence:e.target.value}))} placeholder={creative.format==='carousel'?'Lâmina 1: Título, texto e direção visual\nLâmina 2: …':'Cena 1 (8s): Fala, texto na tela, visual, câmera e áudio\nCena 2 (10s): …'}/></label>}</section>}
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
