import React, { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  MoreVertical,
  Plus,
  Search,
  Users,
  CheckSquare,
  MessageSquare,
  Paperclip,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import {
  PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  formatDate,
  isOverdue,
} from '@/features/projects/utils/projectUtils'
import type { Task, BoardColumn } from '@/types/projects'

interface TaskListViewProps {
  tasks: Task[]
  columns: BoardColumn[]
  onSelectTask: (taskId: string) => void
  onNewTask?: () => void
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  columns,
  onSelectTask,
  onNewTask,
}) => {
  const [search, setSearch] = useState('')
  const [selectedColumn, setSelectedColumn] = useState<string>('all')

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    const matchesColumn = selectedColumn === 'all' || t.column_id === selectedColumn
    return matchesSearch && matchesColumn
  })

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1C1C24] p-3 rounded-xl border border-[#30303B]">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#98989F] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarefas..."
              className="pl-9 h-9 text-xs bg-[#14141A] border-[#30303B]"
            />
          </div>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="h-9 px-3 text-xs bg-[#14141A] border border-[#30303B] rounded-xl text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
          >
            <option value="all">Todas as colunas</option>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {onNewTask && (
          <Button variant="primary" size="sm" onClick={onNewTask} className="shrink-0 h-9">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Task List / Table */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-[#1C1C24] rounded-2xl border border-[#30303B]">
          <CheckCircle2 className="w-10 h-10 text-[#98989F] mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-semibold text-[#F8F9FC] mb-1">Nenhuma tarefa encontrada</h4>
          <p className="text-xs text-[#98989F] max-w-sm mx-auto">
            {search
              ? 'Tente ajustar sua busca ou limpar os filtros para ver mais resultados.'
              : 'Crie uma nova tarefa para começar a gerenciar o fluxo deste projeto.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#1C1C24] rounded-2xl border border-[#30303B] overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#30303B] text-[11px] font-semibold text-[#98989F] uppercase tracking-wider bg-[#14141A]/50">
            <div className="col-span-5">Tarefa</div>
            <div className="col-span-2">Coluna</div>
            <div className="col-span-2">Prioridade</div>
            <div className="col-span-2">Prazo</div>
            <div className="col-span-1 text-right">Equipe</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#30303B]/60">
            {filteredTasks.map((t) => {
              const priorityCfg = PRIORITY_CONFIG[t.priority]
              const column = columns.find((c) => c.id === t.column_id)
              const overdue = isOverdue(t.due_date, t.completed_at)

              // Checklists summary
              const totalItems =
                t.checklists?.reduce((acc, c) => acc + (c.items?.length || 0), 0) || 0
              const doneItems =
                t.checklists?.reduce(
                  (acc, c) => acc + (c.items?.filter((i) => i.is_completed).length || 0),
                  0
                ) || 0

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className="px-5 py-3.5 hover:bg-[#252530]/50 transition-colors cursor-pointer group"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    {/* Task Title & Details */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0 bg-[#C74410]" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F8F9FC] group-hover:text-[#C74410] transition-colors truncate">
                          {t.title}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#98989F] mt-0.5">
                          {totalItems > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" />
                              {doneItems}/{totalItems}
                            </span>
                          )}
                          {(t.comments_count ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {t.comments_count}
                            </span>
                          )}
                          {(t.attachments_count ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {t.attachments_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column Badge */}
                    <div className="col-span-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border"
                        style={{
                          backgroundColor: `${column?.color || '#C74410'}15`,
                          borderColor: `${column?.color || '#C74410'}30`,
                          color: column?.color || '#C74410',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: column?.color || '#C74410' }}
                        />
                        {column?.name || 'A Fazer'}
                      </span>
                    </div>

                    {/* Priority */}
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${priorityCfg.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dotColor}`} />
                        {priorityCfg.label}
                      </span>
                    </div>

                    {/* Due Date */}
                    <div className="col-span-2 text-xs">
                      {t.due_date ? (
                        <span
                          className={`flex items-center gap-1.5 ${
                            overdue ? 'text-red-400 font-medium' : 'text-[#B8B8C0]'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(t.due_date)}
                          {overdue && <span className="text-[10px] uppercase font-bold">(Atrasada)</span>}
                        </span>
                      ) : (
                        <span className="text-[#98989F]">—</span>
                      )}
                    </div>

                    {/* Assignees */}
                    <div className="col-span-1 flex justify-end">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {t.assignees && t.assignees.length > 0 ? (
                          t.assignees.slice(0, 3).map((a) => (
                            <Avatar
                              key={a.id}
                              src={a.profile?.avatar_url || undefined}
                              name={a.profile?.full_name || 'Membro'}
                              size="sm"
                              className="w-6 h-6 text-[10px] ring-2 ring-[#1C1C24]"
                            />
                          ))
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-dashed border-[#424252] flex items-center justify-center text-[#98989F]">
                            <Users className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Stacked Card Layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#F8F9FC] group-hover:text-[#C74410] transition-colors leading-snug">
                        {t.title}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium shrink-0"
                        style={{
                          backgroundColor: `${column?.color || '#C74410'}20`,
                          color: column?.color || '#C74410',
                        }}
                      >
                        {column?.name || 'A Fazer'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#98989F] pt-1">
                      <span className={`inline-flex items-center gap-1 ${priorityCfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dotColor}`} />
                        {priorityCfg.label}
                      </span>

                      {t.due_date && (
                        <span
                          className={`flex items-center gap-1 text-[11px] ${
                            overdue ? 'text-red-400 font-medium' : 'text-[#B8B8C0]'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {formatDate(t.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
