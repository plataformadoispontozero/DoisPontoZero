import { Avatar } from '@/components/ui/Avatar'
import { professions } from './teamProfessions'
import { useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useAgencyTeam } from '@/features/settings/hooks/useAgencySettings'
import { PageHeader } from '@/components/ui/PageHeader'
import { Input } from '@/components/ui/Input'
import { TeamManagementPage } from '@/features/settings/TeamManagementPage'

export function TeamDirectoryPage() {
  const { memberId } = useParams()
  const { pathname } = useLocation()
  const team = useAgencyTeam()
  const [search, setSearch] = useState('')
  const member = team.members.find(m => m.id === memberId)
  const members = team.members.filter(m => m.full_name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  return <div className="space-y-6">
    <PageHeader title="Equipe & Profissionais" subtitle="Profissionais vinculados à agência. Squads organizam grupos de trabalho; papéis controlam acesso." />
    {team.isLoading && <p role="status">Carregando equipe…</p>}
    {team.isError && <p role="alert">Não foi possível carregar a equipe. Verifique a conexão e as permissões.</p>}
    {pathname === '/team/new' ? <TeamManagementPage /> : memberId ? (
      !team.isLoading && !team.isError && (member ? <div className="space-y-3 rounded-xl border border-[#30303B] p-5"><Avatar name={member.full_name} src={member.avatar_url||undefined} size="xl"/><h2 className="text-xl">{member.full_name}</h2><p>Função: {professions.find(p=>p.value===member.profession)?.label||'Não informada'}</p><p>Vínculo: {member.status}</p><p>Papel de acesso: {member.role_name}</p><Link className="text-[#FF8759]" to="/team">Voltar à equipe</Link></div> : <p role="alert">Profissional não encontrado nesta agência.</p>)
    ) : <>
      <label htmlFor="team-search">Buscar profissional por nome</label>
      <Input id="team-search" value={search} onChange={e => setSearch(e.target.value)} />
      {!team.isLoading && !team.isError && members.length === 0 && <p>Nenhum profissional encontrado.</p>}
      {!team.isError && <ul aria-label="Profissionais da agência" className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{members.map(m => <li key={m.id} className="flex min-h-52 flex-col rounded-2xl border border-[#30303B] bg-[#19191f] p-5"><div className="flex flex-1 flex-col items-start gap-3"><Avatar name={m.full_name} src={m.avatar_url||undefined}/><Link className="font-semibold text-[#FF8759] focus-visible:outline-orange-400" to={`/team/${m.id}`}>{m.full_name}</Link></div><p className="mt-2 text-sm">{professions.find(p=>p.value===m.profession)?.label||'Função não informada'}</p><p className="text-sm">{m.status} · Papel de acesso: {m.role_name}</p></li>)}</ul>}
      <Link className="text-[#FF8759]" to="/team/new">Convidar profissional</Link>
    </>}
  </div>
}
