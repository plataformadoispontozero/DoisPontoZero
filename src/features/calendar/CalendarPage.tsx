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
  const [view,setView]=useState<'calendar'|'list'>('calendar')
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
  const entries=query.data||[]
  const sameDay=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()
  const gridStart=new Date(start);if(period==='month')gridStart.setDate(1-(gridStart.getDay()+6)%7)
  const days=Array.from({length:period==='month'?42:period==='week'?7:1},(_,index)=>{const day=new Date(gridStart);day.setDate(day.getDate()+index);return day})
  const entryLink=(entry:typeof entries[number])=><Link key={`${entry.kind}:${entry.id}`} to={entry.href} className={`block rounded-lg border p-2 text-xs break-words ${entry.kind==='meeting'?'border-orange-400/30 bg-orange-400/10':'border-blue-400/30 bg-blue-400/10'}`}><span className="block font-semibold">{entry.title}</span><span className="mt-1 block text-zinc-400">{entry.kind==='meeting'?new Date(entry.date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'Prazo de tarefa'}</span></Link>
  return <div className="space-y-6">
    <PageHeader title="Minha Agenda" subtitle="Reuniões das quais você participa e prazos das tarefas atribuídas a você." breadcrumbs={[{label:'Visão Geral',href:'/dashboard'},{label:'Minha Agenda'}]} actions={<Button size="sm" disabled={!canCreate} onClick={()=>navigate('/meetings/new')}><Plus className="w-4 h-4" />Novo Compromisso</Button>} />
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="agenda-period">Período</label><select id="agenda-period" className="rounded border border-[#30303B] bg-[#1C1C24] p-2" value={period} onChange={e=>setPeriod(e.target.value as Period)}><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option></select>
      <Button variant="secondary" aria-label="Período anterior" onClick={()=>move(-1)}><ChevronLeft className="w-4 h-4" /></Button>
      <Button variant="secondary" onClick={()=>setAnchor(new Date())}>Hoje</Button>
      <Button variant="secondary" aria-label="Próximo período" onClick={()=>move(1)}><ChevronRight className="w-4 h-4" /></Button>
      <Button variant="secondary" aria-label="Atualizar agenda" onClick={()=>void query.refetch()}><RefreshCw className="w-4 h-4" /></Button>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-zinc-400">{entries.filter(e=>e.kind==='meeting').length} reuniões · {entries.filter(e=>e.kind==='task').length} prazos · Horário local: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p><div className="flex gap-2"><Button aria-pressed={view==='calendar'} onClick={()=>setView('calendar')}>Calendário</Button><Button aria-pressed={view==='list'} onClick={()=>setView('list')}>Lista</Button></div></div>
    <h2 className="text-lg font-semibold">{start.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})} — {new Date(end.getTime()-1).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}</h2>
    {query.isLoading&&<p role="status">Carregando agenda…</p>}{query.isError&&<p role="alert">Não foi possível consultar sua agenda. Tente atualizar.</p>}
    {!query.isLoading&&!query.isError&&view==='calendar'&&<section aria-label="Calendário pessoal" className="overflow-x-auto rounded-2xl border border-white/10"><div className={period==='day'?'':'min-w-[700px]'}>{period!=='day'&&<div className="grid grid-cols-7 bg-white/5">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(day=><p className="p-3 text-center text-xs text-zinc-400" key={day}>{day}</p>)}</div>}<div className={period==='day'?'':'grid grid-cols-7'}>{days.map(day=><div key={day.toISOString()} className={`min-h-32 border-t border-r border-white/10 p-2 ${day<start||day>=end?'bg-white/[0.02] text-zinc-600':''}`}><p className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${sameDay(day,new Date())?'bg-orange-600 text-white':''}`}>{day.getDate()}</p><div className="space-y-2">{entries.filter(e=>sameDay(new Date(e.date),day)).map(entryLink)}</div></div>)}</div></div></section>}
    {!query.isLoading&&!query.isError&&view==='list'&&<div className="space-y-3">{entries.map(entry=><article key={`${entry.kind}:${entry.id}`} className="rounded-xl border border-white/10 p-4"><p className="mb-2 text-sm text-zinc-400">{new Date(entry.date).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p>{entryLink(entry)}</article>)}</div>}
    {!query.isLoading&&!query.isError&&!entries.length&&<p className="rounded-xl border border-white/10 p-6 text-zinc-400">Nenhuma reunião ou tarefa com prazo neste período.</p>}
  </div>
}
