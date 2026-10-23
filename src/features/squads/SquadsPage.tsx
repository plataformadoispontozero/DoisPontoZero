import React,{useState} from 'react'
import {useAgencyId} from '@/features/auth/AuthProvider'
import {OperationalSquads} from './OperationalSquads'
import {Button} from '@/components/ui/Button'
import {Dialog,DialogHeader,DialogTitle,DialogDescription,DialogBody,DialogFooter} from '@/components/ui/Dialog'
import {Input} from '@/components/ui/Input'
import {Textarea} from '@/components/ui/Textarea'
import {cn} from '@/lib/utils'
import {toast} from '@/components/ui/Toast'
import {useCreateSquad} from './hooks/useSquads'
import {SPECIALTY_OPTIONS,AVATAR_COLORS,AVATAR_EMOJIS} from '@/types/squads'

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <div className={cn('space-y-1.5', className)}>
    <label className="block text-xs font-medium text-[#B8B8C0]">{label}</label>
    {children}
  </div>
)

// ---- Native select styled ----
const NativeSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
> = ({ children, className, ...props }) => (
  <select
    className={cn(
      'w-full h-9 rounded-xl bg-[#252530] border border-[#30303B] text-[#F8F9FC] text-xs px-3 outline-none focus:ring-1 focus:ring-[#C74410] focus:border-[#C74410] transition-all',
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
              <p className="text-xs text-[#B8B8C0] mb-2">Emoji</p>
              <div className="flex flex-wrap gap-1">
                {AVATAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-lg text-base transition-all',
                      emoji === e
                        ? 'bg-[#C74410]/20 ring-1 ring-[#C74410]'
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


export const SquadsPage: React.FC = () => {
 const agencyId=useAgencyId()
 const [showCreateSquad,setShowCreateSquad]=useState(false)
 return <><OperationalSquads agencyId={agencyId} onCreateSquad={()=>setShowCreateSquad(true)}/><CreateSquadDialog open={showCreateSquad} onClose={()=>setShowCreateSquad(false)} agencyId={agencyId}/></>
}
