import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// SquadsPage — Fase 05: Squads, Metas & Gamificação
// ============================================================
import React, { useState } from 'react'
import {
  Users2,
  Plus,
  Trophy,
  Target,
  BarChart3,
  Crown,
  Star,
  Zap,
  Archive,
  Activity,
  Calendar,
  CheckCircle2,
  Clock3,
  Flame,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import {
  useSquads,
  useSquadRanking,
  useAgencyGoals,
  useSquadSnapshots,
  useCreateSquad,
  useArchiveSquad,
  useCreateGoal,
  useUpsertSnapshot,
} from '@/features/squads/hooks/useSquads'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { Squad, SquadRankingEntry, GoalMetric, GoalPeriod } from '@/types/squads'
import {
  GOAL_METRIC_LABELS,
  GOAL_STATUS_CONFIG,
  SPECIALTY_OPTIONS,
  AVATAR_COLORS,
  AVATAR_EMOJIS,
  MONTH_NAMES,
  getGoalProgress,
  getMedalForRank,
  getScoreColor,
  getScoreBg,
} from '@/types/squads'

// -------------------------
// Demo Agency ID
// -------------------------
const MOCK_AGENCY_ID = 'demo-agency'

// ============================================================
// Utility UI Components
// ============================================================

// ---- Labelled field wrapper ----
const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <div className={cn('space-y-1.5', className)}>
    <label className="block text-xs font-medium text-[#A1A1B0]">{label}</label>
    {children}
  </div>
)

// ---- Native select styled ----
const NativeSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
> = ({ children, className, ...props }) => (
  <select
    className={cn(
      'w-full h-9 rounded-xl bg-[#252530] border border-[#30303B] text-[#F8F9FC] text-xs px-3 outline-none focus:ring-1 focus:ring-[#7952FF] focus:border-[#7952FF] transition-all',
      className
    )}
    {...props}
  >
    {children}
  </select>
)

// ---- Squad Avatar (emoji + color swatch) ----
const SquadAvatar: React.FC<{
  emoji: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ emoji, color, size = 'md', className }) => {
  const sizes = { sm: 'w-9 h-9 text-lg', md: 'w-12 h-12 text-2xl', lg: 'w-16 h-16 text-3xl' }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl font-bold shrink-0',
        sizes[size],
        className
      )}
      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
    >
      <span role="img">{emoji}</span>
    </div>
  )
}

// ---- Score bar (horizontal) ----
const ScoreBar: React.FC<{ value: number; max?: number; color?: string }> = ({
  value,
  max = 100,
  color,
}) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const auto =
    pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : pct >= 40 ? '#F97316' : '#EF4444'
  return (
    <div className="w-full h-1.5 bg-[#252530] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color ?? auto }}
      />
    </div>
  )
}

// ---- SVG Progress ring ----
const ProgressRing: React.FC<{ value: number; size?: number; stroke?: number }> = ({
  value,
  size = 48,
  stroke = 4,
}) => {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const c =
    value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : value >= 40 ? '#F97316' : '#EF4444'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#252530" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={c}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  )
}

// ---- Stat Card ----
const StatCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}> = ({ icon, label, value, color }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#717182] truncate">{label}</p>
        <p className="text-lg font-black text-[#F8F9FC] tabular-nums leading-none mt-0.5">
          {value}
        </p>
      </div>
    </CardContent>
  </Card>
)

// ============================================================
// DIALOG: Create Squad
// ============================================================
const CreateSquadDialog: React.FC<{
  open: boolean
  onClose: () => void
  agencyId: string
}> = ({ open, onClose, agencyId }) => {
  const createSquad = useCreateSquad(agencyId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [capacity, setCapacity] = useState('20')
  const [color, setColor] = useState(AVATAR_COLORS[0])
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0])

  const reset = () => {
    setName(''); setDescription(''); setSpecialty(''); setCapacity('20')
    setColor(AVATAR_COLORS[0]); setEmoji(AVATAR_EMOJIS[0])
  }
  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createSquad.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        avatar_color: color,
        avatar_emoji: emoji,
        specialty: specialty || undefined,
        capacity: parseInt(capacity) || 20,
      })
      toast.success(`Squad "${name}" criado!`)
      handleClose()
    } catch (err) {
      toast.error(`Erro ao criar squad: ${String(err)}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader onClose={handleClose}>
        <DialogTitle>Criar Novo Squad</DialogTitle>
        <DialogDescription>Configure identidade, especialidade e capacidade.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <DialogBody className="space-y-4">
          {/* Avatar preview + emoji picker */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-[#111116] border border-[#30303B]">
            <SquadAvatar emoji={emoji} color={color} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#A1A1B0] mb-2">Emoji</p>
              <div className="flex flex-wrap gap-1">
                {AVATAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-lg text-base transition-all',
                      emoji === e
                        ? 'bg-[#7952FF]/20 ring-1 ring-[#7952FF]'
                        : 'bg-[#1C1C24] hover:bg-[#252530]'
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color picker */}
          <Field label="Cor do Squad">
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-transform',
                    color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>

          <Field label="Nome do Squad *">
            <Input
              placeholder="Ex: Squad Motion, Squad Social..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field label="Especialidade">
            <NativeSelect value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">Sem especialidade definida</option>
              {SPECIALTY_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Capacidade (tarefas/mês)">
            <Input
              type="number"
              placeholder="20"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </Field>

          <Field label="Descrição">
            <Textarea
              placeholder="Missão e foco do squad..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!name.trim() || createSquad.isPending}
          >
            {createSquad.isPending ? 'Criando...' : 'Criar Squad'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

// ============================================================
// DIALOG: Create Goal
// ============================================================
const CreateGoalDialog: React.FC<{
  open: boolean
  onClose: () => void
  agencyId: string
  squads: Squad[]
  defaultSquadId?: string
}> = ({ open, onClose, agencyId, squads, defaultSquadId }) => {
  const createGoal = useCreateGoal(agencyId)
  const now = new Date()
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [squadId, setSquadId] = useState(defaultSquadId ?? squads[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState<GoalMetric>('tasks_completed')
  const [targetValue, setTargetValue] = useState('10')
  const [period, setPeriod] = useState<GoalPeriod>('monthly')
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(lastOfMonth)
  const [weight, setWeight] = useState('3')
  const [description, setDescription] = useState('')
  const [metricLabel, setMetricLabel] = useState('')

  const reset = () => {
    setTitle(''); setMetric('tasks_completed'); setTargetValue('10')
    setPeriod('monthly'); setStartDate(firstOfMonth); setEndDate(lastOfMonth)
    setWeight('3'); setDescription(''); setMetricLabel('')
  }
  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !squadId) return
    try {
      await createGoal.mutateAsync({
        squad_id: squadId,
        title: title.trim(),
        description: description.trim() || undefined,
        metric,
        metric_label: metric === 'custom' ? metricLabel : undefined,
        target_value: parseFloat(targetValue) || 0,
        period,
        period_start: startDate,
        period_end: endDate,
        weight: parseInt(weight) || 3,
      })
      toast.success(`Meta "${title}" criada!`)
      handleClose()
    } catch (err) {
      toast.error(`Erro ao criar meta: ${String(err)}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader onClose={handleClose}>
        <DialogTitle>Nova Meta</DialogTitle>
        <DialogDescription>Defina uma meta mensurável para o squad.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <DialogBody className="space-y-3">
          <Field label="Squad *">
            <NativeSelect value={squadId} onChange={(e) => setSquadId(e.target.value)} required>
              {squads.map((s) => (
                <option key={s.id} value={s.id}>{s.avatar_emoji} {s.name}</option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Título da Meta *">
            <Input
              placeholder="Ex: Entregar 30 tarefas no prazo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Métrica *">
              <NativeSelect value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)}>
                {Object.entries(GOAL_METRIC_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Valor Alvo *">
              <Input
                type="number"
                step="0.01"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </Field>
          </div>

          {metric === 'custom' && (
            <Field label="Rótulo da Métrica">
              <Input
                placeholder="Ex: Leads qualificados"
                value={metricLabel}
                onChange={(e) => setMetricLabel(e.target.value)}
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Período">
              <NativeSelect value={period} onChange={(e) => setPeriod(e.target.value as GoalPeriod)}>
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
              </NativeSelect>
            </Field>
            <Field label="Peso (1–5)">
              <NativeSelect value={weight} onChange={(e) => setWeight(e.target.value)}>
                {[1, 2, 3, 4, 5].map((w) => (
                  <option key={w} value={w}>{'★'.repeat(w)} Peso {w}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Término">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Descrição">
            <Textarea
              placeholder="Contexto e critérios de sucesso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!title.trim() || !squadId || createGoal.isPending}
          >
            {createGoal.isPending ? 'Criando...' : 'Criar Meta'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

// ============================================================
// DIALOG: Upsert Performance Snapshot
// ============================================================
const PerformanceDialog: React.FC<{
  open: boolean
  onClose: () => void
  agencyId: string
  squad: Squad
}> = ({ open, onClose, agencyId, squad }) => {
  const upsert = useUpsertSnapshot(agencyId)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [completed, setCompleted] = useState('')
  const [total, setTotal] = useState('')
  const [onTime, setOnTime] = useState('')
  const [quality, setQuality] = useState('')
  const [collab, setCollab] = useState('')
  const [notes, setNotes] = useState('')

  const handleClose = () => {
    setCompleted(''); setTotal(''); setOnTime(''); setQuality(''); setCollab(''); setNotes('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsert.mutateAsync({
        squad_id: squad.id,
        year,
        month,
        tasks_completed: completed ? parseInt(completed) : undefined,
        tasks_total: total ? parseInt(total) : undefined,
        tasks_on_time: onTime ? parseInt(onTime) : undefined,
        quality_score: quality ? parseFloat(quality) : null,
        collaboration_score: collab ? parseFloat(collab) : null,
        notes: notes.trim() || undefined,
      })
      toast.success(`Performance registrada: ${squad.name} — ${MONTH_NAMES[month - 1]} ${year}`)
      handleClose()
    } catch (err) {
      toast.error(`Erro ao salvar: ${String(err)}`)
    }
  }

  const years = [now.getFullYear() - 1, now.getFullYear()]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader onClose={handleClose}>
        <DialogTitle>Registrar Performance</DialogTitle>
        <DialogDescription>{squad.avatar_emoji} {squad.name}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <DialogBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mês">
              <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Ano">
              <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </NativeSelect>
            </Field>
          </div>

          <div className="p-3 rounded-xl bg-[#111116] border border-[#30303B] space-y-2">
            <p className="text-xs font-medium text-[#A1A1B0]">Tarefas do Período</p>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Total">
                <Input type="number" placeholder="0" value={total} onChange={(e) => setTotal(e.target.value)} />
              </Field>
              <Field label="Concluídas">
                <Input type="number" placeholder="0" value={completed} onChange={(e) => setCompleted(e.target.value)} />
              </Field>
              <Field label="No Prazo">
                <Input type="number" placeholder="0" value={onTime} onChange={(e) => setOnTime(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#111116] border border-[#30303B] space-y-2">
            <p className="text-xs font-medium text-[#A1A1B0]">Scores de Avaliação (0–100)</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Qualidade">
                <Input type="number" step="0.1" min="0" max="100" placeholder="Ex: 85" value={quality} onChange={(e) => setQuality(e.target.value)} />
              </Field>
              <Field label="Colaboração">
                <Input type="number" step="0.1" min="0" max="100" placeholder="Ex: 90" value={collab} onChange={(e) => setCollab(e.target.value)} />
              </Field>
            </div>
          </div>

          <Field label="Observações">
            <Textarea
              placeholder="Contexto, destaques ou pontos de melhoria..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button type="submit" variant="primary" size="sm" disabled={upsert.isPending}>
            {upsert.isPending ? 'Salvando...' : 'Salvar Performance'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

// ============================================================
// TAB: Squads overview cards
// ============================================================
const SquadsTabContent: React.FC<{
  agencyId: string
  onCreateSquad: () => void
  onCreateGoal: (squadId: string) => void
  onPerformance: (squad: Squad) => void
}> = ({ agencyId, onCreateSquad, onCreateGoal, onPerformance }) => {
  const { data: squads = [], isLoading } = useSquads(agencyId)
  const archiveSquad = useArchiveSquad(agencyId)

  const handleArchive = async (squad: Squad) => {
    if (!confirm(`Arquivar o squad "${squad.name}"?`)) return
    try {
      await archiveSquad.mutateAsync(squad.id)
      toast.success(`Squad "${squad.name}" arquivado`)
    } catch (err) {
      toast.error(`Erro ao arquivar: ${String(err)}`)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
    )
  }

  if (squads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#7952FF]/10 flex items-center justify-center mb-4">
          <Users2 className="w-8 h-8 text-[#7952FF]" />
        </div>
        <h3 className="text-base font-bold text-[#F8F9FC] mb-1">Nenhum squad configurado</h3>
        <p className="text-xs text-[#A1A1B0] mb-4 max-w-xs">
          Agrupe especialistas em squads ágeis com metas claras e capacidade balanceada.
        </p>
        <Button variant="primary" size="sm" onClick={onCreateSquad}>
          <Plus className="w-3.5 h-3.5" />
          Criar Primeiro Squad
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {squads.map((squad) => (
        <SquadCard
          key={squad.id}
          squad={squad}
          onCreateGoal={() => onCreateGoal(squad.id)}
          onPerformance={() => onPerformance(squad)}
          onArchive={() => handleArchive(squad)}
        />
      ))}
    </div>
  )
}

// ---- Squad Card ----
const SquadCard: React.FC<{
  squad: Squad
  onCreateGoal: () => void
  onPerformance: () => void
  onArchive: () => void
}> = ({ squad, onCreateGoal, onPerformance, onArchive }) => {
  const members = squad.members ?? []
  const leader = members.find((m) => m.role === 'leader')
  const specialty = SPECIALTY_OPTIONS.find((s) => s.value === squad.specialty)

  return (
    <Card className="group hover:border-[#7952FF]/40 hover:shadow-lg hover:shadow-[#7952FF]/5 transition-all duration-200">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <SquadAvatar emoji={squad.avatar_emoji} color={squad.avatar_color} />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#F8F9FC] truncate">{squad.name}</h3>
              {specialty && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#A1A1B0] mt-0.5">
                  <span>{specialty.emoji}</span><span>{specialty.label}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onPerformance}
              title="Registrar performance"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#A1A1B0] hover:text-[#F8F9FC] hover:bg-[#252530] transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onArchive}
              title="Arquivar squad"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#A1A1B0] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {squad.description && (
          <p className="text-xs text-[#717182] leading-relaxed line-clamp-2">{squad.description}</p>
        )}

        {/* Member avatars */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((m) => (
                <Avatar
                  key={m.id}
                  src={m.profile?.avatar_url ?? undefined}
                  name={m.profile?.full_name ?? 'M'}
                  size="sm"
                  className="ring-2 ring-[#1C1C24]"
                />
              ))}
              {members.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-[#252530] border-2 border-[#1C1C24] flex items-center justify-center text-[9px] font-bold text-[#A1A1B0]">
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-[#A1A1B0]">
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
            </span>
          </div>
          {squad.capacity > 0 && (
            <span className="text-[10px] text-[#717182]">cap. {squad.capacity}/mês</span>
          )}
        </div>

        {leader?.profile && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#30303B]">
            <Crown className="w-3 h-3 text-[#F59E0B]" />
            <span className="text-[10px] text-[#A1A1B0]">
              Liderado por{' '}
              <span className="text-[#F8F9FC] font-medium">{leader.profile.full_name}</span>
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onCreateGoal} className="flex-1 text-xs h-8">
            <Target className="w-3 h-3" />
            Nova Meta
          </Button>
          <Button variant="ghost" size="sm" onClick={onPerformance} className="flex-1 text-xs h-8">
            <Activity className="w-3 h-3" />
            Performance
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// TAB: Ranking
// ============================================================
const RankingTabContent: React.FC<{ agencyId: string }> = ({ agencyId }) => {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { data: ranking = [], isLoading } = useSquadRanking(agencyId, year, month)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-sm font-bold text-[#F8F9FC]">
            Ranking — {MONTH_NAMES[month - 1]} {year}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NativeSelect
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="w-auto"
          >
            {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </NativeSelect>
          <NativeSelect
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-auto"
          >
            {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Podium */}
      {ranking.length >= 2 && (
        <div className="grid grid-cols-3 gap-3">
          <PodiumCard entry={ranking[1]} position={2} />
          <PodiumCard entry={ranking[0]} position={1} featured />
          {ranking[2]
            ? <PodiumCard entry={ranking[2]} position={3} />
            : <div />}
        </div>
      )}

      {/* Full list */}
      {ranking.length > 0 ? (
        <div className="space-y-2">
          {ranking.map((entry) => <RankingRow key={entry.squad_id} entry={entry} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy className="w-10 h-10 text-[#30303B] mb-3" />
          <p className="text-sm text-[#717182]">Nenhum dado para este período.</p>
          <p className="text-xs text-[#717182] mt-1">
            Registre performances nos squads para ver o ranking.
          </p>
        </div>
      )}
    </div>
  )
}

const PodiumCard: React.FC<{
  entry: SquadRankingEntry
  position: number
  featured?: boolean
}> = ({ entry, position, featured }) => {
  const medal = getMedalForRank(position)
  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all',
        featured
          ? 'border-[#F59E0B]/30 bg-gradient-to-b from-[#F59E0B]/10 to-transparent scale-105 shadow-lg shadow-[#F59E0B]/10'
          : 'border-[#30303B] bg-[#1C1C24]'
      )}
    >
      <span className="text-2xl">{medal}</span>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: `${entry.squad_color}20`, border: `1px solid ${entry.squad_color}40` }}
      >
        {entry.squad_emoji}
      </div>
      <p className="text-xs font-bold text-[#F8F9FC] leading-tight">{entry.squad_name}</p>
      <div className="flex items-center gap-1">
        <span className={cn('text-lg font-black tabular-nums', getScoreColor(entry.overall_score))}>
          {entry.overall_score.toFixed(1)}
        </span>
        <span className="text-[10px] text-[#717182]">pts</span>
      </div>
      <span className="text-[10px] text-[#717182]">{entry.member_count} membros</span>
    </div>
  )
}

const RankingRow: React.FC<{ entry: SquadRankingEntry }> = ({ entry }) => {
  const medal = getMedalForRank(entry.rank)
  const scoreColor = getScoreColor(entry.overall_score)

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#30303B] bg-[#1C1C24] hover:border-[#7952FF]/30 transition-all">
      <span className="w-8 text-center text-sm font-bold text-[#717182] shrink-0">{medal}</span>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: `${entry.squad_color}20`, border: `1px solid ${entry.squad_color}40` }}
      >
        {entry.squad_emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-[#F8F9FC] truncate">{entry.squad_name}</span>
          {entry.specialty && (
            <span className="text-[10px] text-[#717182]">
              {SPECIALTY_OPTIONS.find((s) => s.value === entry.specialty)?.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#717182]">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-[#10B981]" />
            {entry.tasks_completed}/{entry.tasks_total} tarefas
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="w-2.5 h-2.5 text-[#3B82F6]" />
            {entry.on_time_rate.toFixed(0)}% prazo
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-2.5 h-2.5 text-[#F59E0B]" />
            {entry.quality_score.toFixed(0)} qualidade
          </span>
        </div>
      </div>

      {/* Scores */}
      <div className="hidden md:flex items-center gap-4">
        {[
          { label: 'Prazo', value: entry.on_time_rate },
          { label: 'Qualidade', value: entry.quality_score },
          { label: 'Collab', value: entry.collaboration_score },
        ].map(({ label, value }) => (
          <div key={label} className="text-center w-16">
            <p className="text-[10px] text-[#717182] mb-0.5">{label}</p>
            <ScoreBar value={value} />
            <p className="text-[10px] font-medium text-[#F8F9FC] mt-0.5">{value.toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Ring score */}
      <div className="flex flex-col items-center shrink-0">
        <div className="relative">
          <ProgressRing value={entry.overall_score} size={40} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-[9px] font-black', scoreColor)}>
              {entry.overall_score.toFixed(0)}
            </span>
          </div>
        </div>
        <span className="text-[9px] text-[#717182] mt-0.5">score</span>
      </div>
    </div>
  )
}

// ============================================================
// TAB: Goals
// ============================================================
const GoalsTabContent: React.FC<{
  agencyId: string
  squads: Squad[]
  onCreateGoal: () => void
}> = ({ agencyId, squads, onCreateGoal }) => {
  const { data: goals = [], isLoading } = useAgencyGoals(agencyId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Target className="w-10 h-10 text-[#30303B] mb-3" />
        <p className="text-sm text-[#717182]">Nenhuma meta criada ainda.</p>
        <Button variant="primary" size="sm" onClick={onCreateGoal} className="mt-4">
          <Plus className="w-3.5 h-3.5" />
          Nova Meta
        </Button>
      </div>
    )
  }

  // Group by squad
  const bySquad = goals.reduce<Record<string, typeof goals>>((acc, g) => {
    if (!acc[g.squad_id]) acc[g.squad_id] = []
    acc[g.squad_id].push(g)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(bySquad).map(([squadId, squadGoals]) => {
        const squad = squads.find((s) => s.id === squadId)
        return (
          <div key={squadId} className="space-y-3">
            <div className="flex items-center gap-2">
              {squad
                ? <>
                  <SquadAvatar emoji={squad.avatar_emoji} color={squad.avatar_color} size="sm" />
                  <span className="text-sm font-bold text-[#F8F9FC]">{squad.name}</span>
                </>
                : <span className="text-sm font-bold text-[#A1A1B0]">Squad</span>
              }
              <Badge variant="outline">
                {squadGoals.length} meta{squadGoals.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="space-y-2 pl-11">
              {squadGoals.map((goal) => {
                const progress = getGoalProgress(goal)
                const statusCfg = GOAL_STATUS_CONFIG[goal.status]
                const metricLabel =
                  goal.metric === 'custom'
                    ? (goal.metric_label ?? 'Customizado')
                    : GOAL_METRIC_LABELS[goal.metric]
                const barColor =
                  progress >= 80 ? '#10B981' : progress >= 60 ? '#F59E0B' : '#7952FF'
                return (
                  <div
                    key={goal.id}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-[#30303B] bg-[#1C1C24] hover:border-[#7952FF]/30 transition-all"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#F8F9FC] truncate">{goal.title}</span>
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                        <span className="text-[10px] text-[#717182]">{metricLabel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <ScoreBar value={goal.current_value} max={goal.target_value} color={barColor} />
                        </div>
                        <span className="text-[10px] font-medium text-[#A1A1B0] tabular-nums shrink-0">
                          {goal.current_value}/{goal.target_value}
                        </span>
                        <span className={cn('text-[10px] font-bold tabular-nums shrink-0', progress >= 100 ? 'text-[#10B981]' : 'text-[#F8F9FC]')}>
                          {progress}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#717182]">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{goal.period_start} → {goal.period_end}</span>
                        <span className="ml-1">
                          {'★'.repeat(goal.weight)}<span className="text-[#30303B]">{'★'.repeat(5 - goal.weight)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// TAB: Performance History
// ============================================================
const PerformanceTabContent: React.FC<{
  squads: Squad[]
  onRecord: (squad: Squad) => void
}> = ({ squads, onRecord }) => {
  const [selectedSquadId, setSelectedSquadId] = useState(squads[0]?.id ?? '')
  const selectedSquad = squads.find((s) => s.id === selectedSquadId)
  const { data: snapshots = [], isLoading } = useSquadSnapshots(selectedSquadId)

  if (squads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="w-10 h-10 text-[#30303B] mb-3" />
        <p className="text-sm text-[#717182]">Crie squads para visualizar o histórico.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Squad pills */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {squads.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSquadId(s.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                selectedSquadId === s.id
                  ? 'border-[#7952FF] bg-[#7952FF]/10 text-[#7952FF]'
                  : 'border-[#30303B] text-[#A1A1B0] hover:border-[#7952FF]/30 hover:text-[#F8F9FC]'
              )}
            >
              <span>{s.avatar_emoji}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
        {selectedSquad && (
          <Button variant="secondary" size="sm" onClick={() => onRecord(selectedSquad)}>
            <Plus className="w-3.5 h-3.5" />
            Registrar Dados
          </Button>
        )}
      </div>

      {/* Snapshots list */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : snapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="w-8 h-8 text-[#30303B] mb-3" />
          <p className="text-sm text-[#717182]">Nenhum dado registrado para este squad.</p>
          {selectedSquad && (
            <Button variant="ghost" size="sm" onClick={() => onRecord(selectedSquad)} className="mt-3">
              <Plus className="w-3 h-3" />
              Registrar Primeiro Período
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map((snap) => {
            const onTimeRate = snap.on_time_rate ?? 0
            const overall =
              onTimeRate * 0.4 +
              (snap.quality_score ?? 0) * 0.35 +
              (snap.collaboration_score ?? 0) * 0.25

            return (
              <div key={snap.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#30303B] bg-[#1C1C24]">
                <div className="w-28 shrink-0">
                  <p className="text-xs font-bold text-[#F8F9FC]">{MONTH_NAMES[snap.period_month - 1]}</p>
                  <p className="text-[10px] text-[#717182]">{snap.period_year}</p>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-[#717182] mb-1">Tarefas</p>
                    <p className="text-sm font-bold text-[#F8F9FC]">
                      {snap.tasks_completed}
                      <span className="text-[10px] text-[#717182] font-normal">/{snap.tasks_total}</span>
                    </p>
                  </div>
                  {[
                    { label: 'Prazo', value: onTimeRate, suffix: '%' },
                    { label: 'Qualidade', value: snap.quality_score },
                    { label: 'Colaboração', value: snap.collaboration_score },
                  ].map(({ label, value, suffix }) => (
                    <div key={label}>
                      <p className="text-[10px] text-[#717182] mb-0.5">{label}</p>
                      <p className={cn('text-sm font-bold tabular-nums', getScoreColor(value ?? 0))}>
                        {value != null ? `${value.toFixed(1)}${suffix ?? ''}` : '—'}
                      </p>
                      {value != null && <ScoreBar value={value} />}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative">
                    <ProgressRing value={overall} size={44} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn('text-[9px] font-black', getScoreColor(overall))}>
                        {overall.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] text-[#717182] mt-0.5">score</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export const SquadsPage: React.FC = () => {
  const MOCK_AGENCY_ID = useAgencyId()

  const agencyId = MOCK_AGENCY_ID
  const { data: squads = [] } = useSquads(agencyId)

  const [showCreateSquad, setShowCreateSquad] = useState(false)
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [goalDefaultSquadId, setGoalDefaultSquadId] = useState<string | undefined>()
  const [performanceSquad, setPerformanceSquad] = useState<Squad | null>(null)

  const handleCreateGoal = (squadId?: string) => {
    setGoalDefaultSquadId(squadId)
    setShowCreateGoal(true)
  }

  const totalMembers = squads.reduce((acc, s) => acc + (s.members?.length ?? 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Squads & Equipes"
        subtitle="Gerencie times multidisciplinares, metas mensais e ranking de performance."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Squads' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCreateGoal()}
              disabled={squads.length === 0}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Nova Meta</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreateSquad(true)}>
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Squad</span>
            </Button>
          </div>
        }
      />

      {/* Demo mode banner */}
      {!isSupabaseConfigured && (
        <div className="flex items-center gap-2 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-4 py-2.5 text-xs text-[#F59E0B]">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Modo demonstração</strong> — Configure o Supabase em{' '}
            <code className="font-mono opacity-80">.env</code> para persistir dados.
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Users2 className="w-4 h-4 text-[#7952FF]" />}
          label="Squads Ativos"
          value={squads.length}
          color="#7952FF"
        />
        <StatCard
          icon={<Crown className="w-4 h-4 text-[#F59E0B]" />}
          label="Total de Membros"
          value={totalMembers}
          color="#F59E0B"
        />
        <StatCard
          icon={<Target className="w-4 h-4 text-[#10B981]" />}
          label="Metas Ativas"
          value="—"
          color="#10B981"
        />
        <StatCard
          icon={<Flame className="w-4 h-4 text-[#EF4444]" />}
          label="Melhor Score"
          value="—"
          color="#EF4444"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="squads">
        <TabsList>
          <TabsTrigger value="squads">
            <span className="flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5" />
              Squads
            </span>
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Ranking
            </span>
          </TabsTrigger>
          <TabsTrigger value="goals">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Metas
            </span>
          </TabsTrigger>
          <TabsTrigger value="performance">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Performance
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="squads">
          <SquadsTabContent
            agencyId={agencyId}
            onCreateSquad={() => setShowCreateSquad(true)}
            onCreateGoal={(squadId) => handleCreateGoal(squadId)}
            onPerformance={(squad) => setPerformanceSquad(squad)}
          />
        </TabsContent>

        <TabsContent value="ranking">
          <RankingTabContent agencyId={agencyId} />
        </TabsContent>

        <TabsContent value="goals">
          <GoalsTabContent
            agencyId={agencyId}
            squads={squads}
            onCreateGoal={() => handleCreateGoal()}
          />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTabContent
            squads={squads}
            onRecord={(squad) => setPerformanceSquad(squad)}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateSquadDialog
        open={showCreateSquad}
        onClose={() => setShowCreateSquad(false)}
        agencyId={agencyId}
      />

      <CreateGoalDialog
        open={showCreateGoal}
        onClose={() => { setShowCreateGoal(false); setGoalDefaultSquadId(undefined) }}
        agencyId={agencyId}
        squads={squads}
        defaultSquadId={goalDefaultSquadId}
      />

      {performanceSquad && (
        <PerformanceDialog
          open={Boolean(performanceSquad)}
          onClose={() => setPerformanceSquad(null)}
          agencyId={agencyId}
          squad={performanceSquad}
        />
      )}
    </div>
  )
}
