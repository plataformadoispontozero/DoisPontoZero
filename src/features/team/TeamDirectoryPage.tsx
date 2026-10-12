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
      !team.isLoading && !team.isError && (member ? <div className="space-y-3 rounded-xl border border-[#30303B] p-5"><h2 className="text-xl">{member.full_name}</h2><p>Vínculo: {member.status}</p><p>Papel de acesso: {member.role_name}</p><p>Especialidades, disponibilidade e carga de trabalho ainda não possuem contrato homologado. Não são inferidas do papel de acesso.</p><Link className="text-[#FF8759]" to="/team">Voltar à equipe</Link></div> : <p role="alert">Profissional não encontrado nesta agência.</p>)
    ) : <>
      <label htmlFor="team-search">Buscar profissional por nome</label>
      <Input id="team-search" value={search} onChange={e => setSearch(e.target.value)} />
      {!team.isLoading && !team.isError && members.length === 0 && <p>Nenhum profissional encontrado.</p>}
      {!team.isError && <ul className="space-y-3">{members.map(m => <li key={m.id} className="rounded-xl border border-[#30303B] p-4"><Link className="text-[#FF8759]" to={`/team/${m.id}`}>{m.full_name}</Link><p className="text-sm">{m.status} · Papel de acesso: {m.role_name}</p></li>)}</ul>}
      <Link className="text-[#FF8759]" to="/team/new">Convidar profissional</Link>
    </>}
  </div>
}
