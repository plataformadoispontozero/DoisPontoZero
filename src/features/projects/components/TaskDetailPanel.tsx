import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  User,
  Users,
  Flag,
  CheckSquare,
  Plus,
  Trash2,
  ExternalLink,
  Paperclip,
  MessageSquare,
  Activity,
  Archive,
  ChevronDown,
  Sparkles,
  Link as LinkIcon,
  Send,
  AlertCircle,
} from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Sheet, SheetHeader, SheetTitle, SheetContent } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { toast } from '@/components/ui/Toast'
import {
  useTask,
  useSubtasks,
  useTaskComments,
  useTaskAttachments,
  useTaskLinks,
  useTaskActivity,
  useUpdateTask,
  useArchiveTask,
  useToggleChecklistItem,
  useCreateChecklist,
  useAddChecklistItem,
  useAddComment,
  useDeleteComment,
  useAddLink,
} from '@/features/tasks/hooks/useTasks'
import {
  PRIORITY_CONFIG,
  detectLinkType,
  formatDate,
  formatDateTime,
  isOverdue,
} from '@/features/projects/utils/projectUtils'
import type { Task, Priority, BoardColumn } from '@/types/projects'

interface TaskDetailPanelProps {
  taskId: string | null
  projectId: string
  agencyId: string
  columns: BoardColumn[]
  open: boolean
  onClose: () => void
  titlePrefix?: string
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  taskId,
  projectId,
  agencyId,
  columns,
  open,
  onClose,
  titlePrefix,
}) => {
  const { data: realTask, isLoading, isError } = useTask(taskId ?? undefined)
  const { data: subtasks = [] } = useSubtasks(taskId ?? undefined)
  const { data: comments = [] } = useTaskComments(taskId ?? undefined)
  const { data: attachments = [] } = useTaskAttachments(taskId ?? undefined)
  const { data: links = [] } = useTaskLinks(taskId ?? undefined)
  const { data: activities = [] } = useTaskActivity(taskId ?? undefined)

  const updateTask = useUpdateTask()
  const archiveTask = useArchiveTask()
  const toggleChecklistItem = useToggleChecklistItem()
  const createChecklist = useCreateChecklist()
  const addChecklistItem = useAddChecklistItem()
  const addComment = useAddComment()
  const deleteComment = useDeleteComment()
  const addLink = useAddLink()

  // State for editable fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [showAddLinkForm, setShowAddLinkForm] = useState(false)
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [showAddChecklist, setShowAddChecklist] = useState(false)
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null)
  const [newItemTitle, setNewItemTitle] = useState('')

  // Sync state when task changes
  useEffect(() => {
    if (realTask) {
      setTitle(realTask.title)
      setDescription(realTask.description || '')
    }
  }, [realTask])

  if (!open || !taskId) return null

  if (isSupabaseConfigured && !realTask) return <Sheet open={open} onOpenChange={onClose}><SheetHeader onClose={onClose}><SheetTitle>Detalhes da demanda</SheetTitle></SheetHeader><SheetContent><p role={isError ? 'alert' : 'status'}>{isLoading ? 'Carregando demanda…' : 'Não foi possível carregar esta demanda.'}</p></SheetContent></Sheet>

  // Fallback demo data if realTask is null (e.g. Supabase disconnected or mocked)
  const task: Task = realTask ?? {
    id: taskId,
    agency_id: agencyId,
    project_id: projectId,
    board_id: 'default',
    column_id: columns[0]?.id ?? 'col-1',
    parent_task_id: null,
    title: title || 'Tarefa Selecionada',
    description: description || 'Detalhamento do escopo e requisitos técnicos...',
    priority: 'normal',
    status: 'in_progress',
    position: 1000,
    start_date: null,
    due_date: null,
    completed_at: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignees: [],
    checklists: [],
    comments_count: comments.length,
    attachments_count: attachments.length,
    links_count: links.length,
    column: columns[0] ?? {
      id: 'col-1',
      agency_id: agencyId,
      board_id: 'default',
      name: 'A Fazer',
      color: '#98989F',
      position: 1000,
      category: 'backlog',
      wip_limit: null,
      is_system: true,
      created_at: new Date().toISOString(),
    },
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask.mutate({
        taskId,
        projectId,
        updates: { title: titlePrefix && !title.trim().startsWith(titlePrefix) ? `${titlePrefix} ${title.trim()}` : title.trim() },
      })
    }
  }

  const handleDescriptionBlur = () => {
    if (description !== (task.description || '')) {
      updateTask.mutate({
        taskId,
        projectId,
        updates: { description: description.trim() || undefined },
      })
    }
  }

  const handlePriorityChange = (newPriority: Priority) => {
    updateTask.mutate({
      taskId,
      projectId,
      updates: { priority: newPriority },
    })
  }

  const handleColumnChange = (newColumnId: string) => {
    const category = columns.find(c => c.id === newColumnId)?.category
    updateTask.mutate({
      taskId,
      projectId,
      updates: { column_id: newColumnId, status: !category || category === 'backlog' ? 'open' : category, completed_at: category === 'done' ? new Date().toISOString() : null },
    })
  }

  const handleDueDateChange = (date: string) => {
    updateTask.mutate({
      taskId,
      projectId,
      updates: { due_date: date || undefined },
    })
  }

  const handleArchive = () => {
    if (window.confirm('Tem certeza de que deseja arquivar esta tarefa?')) {
      archiveTask.mutate(
        { taskId, projectId },
        {
          onSuccess: () => {
            toast.success('Tarefa arquivada.')
            onClose()
          },
        }
      )
    }
  }

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    addComment.mutate(
      {
        taskId,
        agencyId,
        content: newComment.trim(),
        authorId: task.created_by || 'current-user',
      },
      {
        onSuccess: () => {
          setNewComment('')
          toast.success('Comentário publicado!')
        },
      }
    )
  }

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLinkUrl.trim()) return

    addLink.mutate(
      {
        taskId,
        agencyId,
        url: newLinkUrl.trim(),
        title: newLinkTitle.trim() || newLinkUrl.trim(),
        createdBy: task.created_by || 'current-user',
      },
      {
        onSuccess: () => {
          setNewLinkUrl('')
          setNewLinkTitle('')
          setShowAddLinkForm(false)
          toast.success('Link adicionado com sucesso!')
        },
      }
    )
  }

  const handleCreateChecklist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChecklistTitle.trim()) return

    createChecklist.mutate(
      {
        taskId,
        agencyId,
        title: newChecklistTitle.trim(),
      },
      {
        onSuccess: () => {
          setNewChecklistTitle('')
          setShowAddChecklist(false)
          toast.success('Checklist criado!')
        },
      }
    )
  }

  const handleAddChecklistItem = (checklistId: string) => {
    if (!newItemTitle.trim()) return

    addChecklistItem.mutate(
      {
        checklistId,
        agencyId,
        taskId,
        title: newItemTitle.trim(),
      },
      {
        onSuccess: () => {
          setNewItemTitle('')
          setActiveChecklistId(null)
        },
      }
    )
  }

  const priorityCfg = PRIORITY_CONFIG[task.priority]
  const overdue = isOverdue(task.due_date, task.completed_at)

  // Calculate checklist progress
  const allChecklists = task.checklists || []
  const totalItems = allChecklists.reduce((acc, c) => acc + (c.items?.length || 0), 0)
  const completedItems = allChecklists.reduce(
    (acc, c) => acc + (c.items?.filter((i) => i.is_completed).length || 0),
    0
  )
  const checklistPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:max-w-xl md:max-w-2xl bg-[#1C1C24] border-l border-[#30303B] shadow-2xl animate-in slide-in-from-right duration-300">
        <SheetHeader onClose={onClose} className="border-b border-[#30303B] px-6 py-4">
          <div className="flex items-center justify-between w-full pr-8">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#98989F]">#{task.id.slice(0, 8)}</span>
              <span className="text-[#30303B]">•</span>
              <Badge variant="outline" className={priorityCfg.color}>
                <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dotColor} mr-1.5`} />
                {priorityCfg.label}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              className="text-[#98989F] hover:text-red-400 hover:bg-red-500/10"
              title="Arquivar tarefa"
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">Arquivar</span>
            </Button>
          </div>
        </SheetHeader>

        <SheetContent className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Title */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Título da tarefa..."
              className="text-lg font-bold bg-transparent border-transparent hover:border-[#30303B] focus:border-[#C74410] px-2 -mx-2 rounded-lg"
            />
          </div>

          {/* Quick Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#14141A] rounded-xl border border-[#30303B]">
            {/* Status / Column */}
            <div>
              <span className="text-[11px] font-medium text-[#98989F] block mb-1">Coluna</span>
              <Select
                value={task.column_id}
                onChange={(e) => handleColumnChange(e.target.value)}
                options={columns.map((c) => ({ value: c.id, label: c.name }))}
                className="h-8 text-xs py-1"
              />
            </div>

            {/* Priority */}
            <div>
              <span className="text-[11px] font-medium text-[#98989F] block mb-1">Prioridade</span>
              <Select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                options={PRIORITY_OPTIONS}
                className="h-8 text-xs py-1"
              />
            </div>

            {/* Due Date */}
            <div>
              <span className="text-[11px] font-medium text-[#98989F] block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Prazo
              </span>
              <Input
                type="date"
                value={task.due_date || ''}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className={`h-8 text-xs py-1 ${overdue ? 'border-red-500 text-red-400' : ''}`}
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#B8B8C0] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Responsáveis
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {task.assignees && task.assignees.length > 0 ? (
                task.assignees.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 bg-[#252530] border border-[#30303B] px-2.5 py-1 rounded-full text-xs"
                  >
                    <Avatar
                      src={a.profile?.avatar_url || undefined}
                      name={a.profile?.full_name || 'Membro'}
                      size="sm"
                      className="w-5 h-5 text-[10px]"
                    />
                    <span className="text-[#F8F9FC] font-medium">
                      {a.profile?.full_name || 'Membro da equipe'}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-[#98989F] italic">Nenhum responsável atribuído.</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">Descrição</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Adicione detalhes, requisitos criativos ou observações..."
              rows={4}
              className="text-xs bg-[#14141A] border-[#30303B] focus:border-[#C74410] resize-y"
            />
          </div>

          {/* Checklists */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#C74410]" />
                <span className="text-xs font-semibold text-[#F8F9FC]">Checklist</span>
                {totalItems > 0 && (
                  <span className="text-[11px] text-[#98989F]">
                    ({completedItems}/{totalItems} • {checklistPercent}%)
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddChecklist(!showAddChecklist)}
                className="text-xs text-[#C74410] hover:bg-[#C74410]/10 h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                Novo grupo
              </Button>
            </div>

            {totalItems > 0 && (
              <div className="w-full bg-[#252530] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#C74410] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>
            )}

            {showAddChecklist && (
              <form onSubmit={handleCreateChecklist} className="flex gap-2">
                <Input
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="Nome do checklist (ex.: Etapas Criativas)..."
                  className="h-8 text-xs"
                  autoFocus
                />
                <Button type="submit" variant="primary" size="sm" className="h-8 text-xs">
                  Criar
                </Button>
              </form>
            )}

            {allChecklists.map((checklist) => (
              <div
                key={checklist.id}
                className="bg-[#14141A] border border-[#30303B] rounded-xl p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F8F9FC]">{checklist.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setActiveChecklistId(activeChecklistId === checklist.id ? null : checklist.id)
                    }
                    className="text-[11px] text-[#B8B8C0] hover:text-[#F8F9FC] h-6 px-1.5"
                  >
                    <Plus className="w-3 h-3 mr-0.5" /> Item
                  </Button>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {checklist.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 text-xs group cursor-pointer"
                      onClick={() =>
                        toggleChecklistItem.mutate({
                          itemId: item.id,
                          taskId,
                          isCompleted: !item.is_completed,
                          userId: task.created_by || 'user-1',
                        })
                      }
                    >
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => {}}
                        className="rounded border-[#424252] bg-[#1C1C24] text-[#C74410] focus:ring-0 cursor-pointer"
                      />
                      <span
                        className={`flex-1 transition-all ${
                          item.is_completed
                            ? 'line-through text-[#98989F]'
                            : 'text-[#F8F9FC] group-hover:text-white'
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>

                {activeChecklistId === checklist.id && (
                  <div className="flex gap-2 pt-1.5">
                    <Input
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="Adicionar item..."
                      className="h-7 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddChecklistItem(checklist.id)
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddChecklistItem(checklist.id)}
                      className="h-7 text-xs px-2.5"
                    >
                      Salvar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#B8B8C0]">Subtarefas</span>
              <div className="space-y-1.5">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2.5 bg-[#14141A] rounded-lg border border-[#30303B] flex items-center justify-between text-xs"
                  >
                    <span className="text-[#F8F9FC]">{sub.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs for Feed: Comments, Links, Attachments, Activity */}
          <div className="pt-2">
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-[#14141A]">
                <TabsTrigger value="comments" className="text-xs gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat ({comments.length})</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="text-xs gap-1">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Links ({links.length})</span>
                </TabsTrigger>
                <TabsTrigger value="attachments" className="text-xs gap-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Anexos ({attachments.length})</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Histórico</span>
                </TabsTrigger>
              </TabsList>

              {/* Comments Tab */}
              <TabsContent value="comments" className="space-y-4 pt-3">
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário ou feedback..."
                    className="text-xs bg-[#14141A] border-[#30303B]"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newComment.trim() || addComment.isPending}
                    className="shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>

                <div className="space-y-3">
                  {comments.length > 0 ? (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-[#14141A] rounded-xl border border-[#30303B] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={c.author?.avatar_url || undefined}
                              name={c.author?.full_name || 'Membro'}
                              size="sm"
                              className="w-5 h-5 text-[10px]"
                            />
                            <span className="font-medium text-[#F8F9FC]">
                              {c.author?.full_name || 'Membro da equipe'}
                            </span>
                            <span className="text-[11px] text-[#98989F]">
                              {formatDateTime(c.created_at)}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteComment.mutate({ commentId: c.id, taskId })}
                            className="text-[#98989F] hover:text-red-400"
                            title="Excluir comentário"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-[#B8B8C0] leading-relaxed whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#98989F] text-center py-4 italic">
                      Nenhum comentário registrado ainda.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Links Tab */}
              <TabsContent value="links" className="space-y-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-[#B8B8C0]">
                    Links externos de design e assets
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddLinkForm(!showAddLinkForm)}
                    className="text-xs text-[#C74410] h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar link
                  </Button>
                </div>

                {showAddLinkForm && (
                  <form
                    onSubmit={handleAddLink}
                    className="p-3 bg-[#14141A] rounded-xl border border-[#30303B] space-y-2.5"
                  >
                    <Input
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Título (ex.: Figma - Design System)"
                      className="text-xs h-8"
                    />
                    <Input
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="URL (https://figma.com/...)"
                      className="text-xs h-8"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddLinkForm(false)}
                        className="h-7 text-xs"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" size="sm" className="h-7 text-xs">
                        Adicionar
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {links.length > 0 ? (
                    links.map((link) => {
                      const detected = detectLinkType(link.url)
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-[#14141A] hover:bg-[#252530] border border-[#30303B] rounded-xl text-xs transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{detected.icon}</span>
                            <div>
                              <p className="font-medium text-[#F8F9FC] group-hover:text-[#C74410] transition-colors">
                                {link.title}
                              </p>
                              <p className="text-[10px] text-[#98989F] truncate max-w-xs">
                                {link.url}
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-[#98989F] group-hover:text-[#F8F9FC]" />
                        </a>
                      )
                    })
                  ) : (
                    <p className="text-xs text-[#98989F] text-center py-4 italic">
                      Nenhum link anexado a esta tarefa.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Attachments Tab */}
              <TabsContent value="attachments" className="space-y-3 pt-3">
                <div className="p-6 border-2 border-dashed border-[#30303B] rounded-xl text-center space-y-2">
                  <Paperclip className="w-6 h-6 text-[#98989F] mx-auto" />
                  <p className="text-xs text-[#B8B8C0]">
                    Arraste arquivos ou clique para fazer upload
                  </p>
                  <p className="text-[11px] text-[#98989F]">
                    Imagens, PDFs, vídeos ou briefs criativos até 50MB.
                  </p>
                </div>

                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-[#14141A] border border-[#30303B] rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-[#C74410]" />
                        <span className="text-[#F8F9FC] font-medium">
                          {file.name || file.file_name || 'Arquivo'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#98989F]">
                        {Math.round((file.size_bytes || file.file_size || 0) / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-3 pt-3">
                <div className="space-y-2.5">
                  {activities.length > 0 ? (
                    activities.map((act) => (
                      <div key={act.id} className="flex items-start gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C74410] mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[#F8F9FC]">
                            <span className="font-medium text-[#C74410]">
                              {act.actor?.full_name || 'Usuário'}
                            </span>{' '}
                            {act.action} a tarefa
                          </p>
                          <span className="text-[10px] text-[#98989F]">
                            {formatDateTime(act.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#98989F] text-center py-4 italic">
                      Nenhuma atividade registrada ainda.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </div>
    </Sheet>
  )
}
