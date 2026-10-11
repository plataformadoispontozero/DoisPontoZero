import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { usePermission } from '@/features/auth/AuthProvider'
import { useAgenda } from './useAgenda'

type Period = 'day' | 'week' | 'month'
export function agendaRange(anchor: Date, period: Period) {
  const start = new Date(anchor.getFullYear(),anchor.getMonth(),anchor.getDate())
  if (period === 'month') start.setDate(1)
  if (period === 'week') start.setDate(start.getDate() - (start.getDay()+6)%7)
  const end = new Date(start)
  if (period === 'month') end.setMonth(end.getMonth()+1)
  else end.setDate(end.getDate()+(period==='week'?7:1))
  return {start,end}
}
export function CalendarPage() {
  const navigate = useNavigate()
  const [period,setPeriod] = useState<Period>('month')
  const [anchor,setAnchor] = useState(new Date())
  const {start,end}=agendaRange(anchor,period)
  const query=useAgenda(start,end)
  const canCreate=usePermission('meetings.create')
  function move(direction: number) {
    const next = new Date(start)
    if(period==='month') next.setMonth(next.getMonth()+direction)
    else next.setDate(next.getDate()+direction*(period==='week'?7:1))
    setAnchor(next)
  }
  return <div className="space-y-6">
    <PageHeader title="Minha Agenda" subtitle="Reuniões das quais você participa e prazos das tarefas atribuídas a você." breadcrumbs={[{label:'Visão Geral',href:'/dashboard'},{label:'Minha Agenda'}]} actions={<Button size="sm" disabled={!canCreate} onClick={()=>navigate('/meetings/new')}><Plus className="w-4 h-4" />Novo Compromisso</Button>} />
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="agenda-period">Período</label><select id="agenda-period" className="rounded border border-[#30303B] bg-[#1C1C24] p-2" value={period} onChange={e=>setPeriod(e.target.value as Period)}><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option></select>
      <Button variant="secondary" aria-label="Período anterior" onClick={()=>move(-1)}><ChevronLeft className="w-4 h-4" /></Button>
      <Button variant="secondary" onClick={()=>setAnchor(new Date())}>Hoje</Button>
      <Button variant="secondary" aria-label="Próximo período" onClick={()=>move(1)}><ChevronRight className="w-4 h-4" /></Button>
      <Button variant="secondary" aria-label="Atualizar agenda" onClick={()=>void query.refetch()}><RefreshCw className="w-4 h-4" /></Button>
    </div>
    <h2 className="text-lg font-semibold">{start.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})} — {new Date(end.getTime()-1).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}</h2>
    {query.isLoading ? <p role="status">Carregando agenda…</p> : query.isError ? <p role="alert" className="text-[#FB7185]">Não foi possível consultar sua agenda. Nenhum compromisso fictício foi exibido. Tente atualizar; se persistir, verifique as permissões do backend.</p> : query.data?.length ? <ul className="space-y-3">{query.data.map(entry=><li key={`${entry.kind}:${entry.id}`} className="rounded-xl border border-[#30303B] bg-[#1C1C24] p-4"><Link to={entry.href} className="font-semibold text-[#F8F9FC] hover:underline">{entry.title}</Link><p className="text-sm text-[#A1A1B0]">{entry.kind==='task'?'Prazo de tarefa':'Reunião'} · <time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString('pt-BR')}{entry.kind==='meeting'?' · '+new Date(entry.date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''}</time></p></li>)}</ul> : <p className="rounded-xl border border-[#30303B] p-8 text-[#A1A1B0]">Nenhuma reunião ou tarefa com prazo neste período.</p>}
  </div>
}
