import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
} from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PRIORITY_CONFIG } from '@/features/projects/utils/projectUtils'
import type { Task, BoardColumn } from '@/types/projects'

interface TaskCalendarViewProps {
  tasks: Task[]
  columns: BoardColumn[]
  onSelectTask: (taskId: string) => void
  onNewTask?: () => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  columns,
  onSelectTask,
  onNewTask,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const nextMonth = () => setCurrentDate((d) => addMonths(d, 1))
  const prevMonth = () => setCurrentDate((d) => subMonths(d, 1))
  const goToToday = () => setCurrentDate(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Map tasks by formatted due_date (YYYY-MM-DD)
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (task.due_date) {
      const dateKey = task.due_date.split('T')[0]
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(task)
    }
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1C1C24] p-4 rounded-2xl border border-[#30303B]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7952FF]/10 text-[#7952FF] rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-[#F8F9FC] capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <p className="text-xs text-[#717182]">Visualização de prazos e entregas criativas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs h-8">
            Hoje
          </Button>
          <div className="flex items-center border border-[#30303B] rounded-lg overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-[#252530] text-[#A1A1B0] hover:text-[#F8F9FC] transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-[#30303B]" />
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-[#252530] text-[#A1A1B0] hover:text-[#F8F9FC] transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {onNewTask && (
            <Button variant="primary" size="sm" onClick={onNewTask} className="text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#1C1C24] rounded-2xl border border-[#30303B] overflow-hidden">
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 border-b border-[#30303B] bg-[#14141A]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-xs font-semibold text-[#717182] uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#30303B]/60 bg-[#14141A]/30 min-h-[560px]">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayTasks = tasksByDate[dateKey] || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 transition-colors flex flex-col justify-between ${
                  !isCurrentMonth ? 'bg-[#14141A]/80 opacity-40' : 'hover:bg-[#1C1C24]/80'
                }`}
              >
                {/* Date Number Badge */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 ${
                      isCurrentDay
                        ? 'bg-[#7952FF] text-white shadow-lg shadow-[#7952FF]/30'
                        : isCurrentMonth
                        ? 'text-[#F8F9FC]'
                        : 'text-[#717182]'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-[#717182] font-mono">
                      {dayTasks.length} {dayTasks.length === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </div>

                {/* Day Tasks List */}
                <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none flex-1">
                  {dayTasks.map((t) => {
                    const priorityCfg = PRIORITY_CONFIG[t.priority]
                    const col = columns.find((c) => c.id === t.column_id)

                    return (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t.id)}
                        className="px-2 py-1 rounded bg-[#252530] hover:bg-[#30303B] border border-[#30303B] text-[11px] font-medium text-[#F8F9FC] truncate cursor-pointer transition-colors flex items-center gap-1.5 group"
                        title={t.title}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: col?.color || '#7952FF' }}
                        />
                        <span className="truncate group-hover:text-[#7952FF]">{t.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
