import { memberRoleOptions } from '@/features/team/memberRoleOptions'
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogBody, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Avatar } from '@/components/ui/Avatar'
import { toast } from '@/components/ui/Toast'
import { useAgencyTeam } from './hooks/useAgencySettings'
import { Users, UserPlus, Mail, Shield, Trash2, Clock, CheckCircle, ShieldAlert } from 'lucide-react'

export const TeamManagementPage: React.FC = () => {
  const { roles, members, invitations, inviteMember, revokeInvitation, updateMemberRole, canInvite, canUpdateRole, isError, rolesLoading, rolesError } = useAgencyTeam()

  const roleOptions = memberRoleOptions(roles)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !inviteEmail.includes('@') || !roles.some(r => r.id === inviteRoleId)) {
      toast.error('Informe um endereço de e-mail válido.')
      return
    }

    setIsSubmitting(true)
    try {
      await inviteMember({ email: inviteEmail, roleId: inviteRoleId })
      toast.success(`Convite seguro enviado com sucesso para ${inviteEmail}!`)
      setInviteEmail('')
      setIsInviteOpen(false)
    } catch {
      toast.error('Erro ao enviar convite.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = async (invitationId: string, email: string) => {
    try {
      await revokeInvitation(invitationId)
      toast.info(`Convite para ${email} revogado.`)
    } catch {
      toast.error('Erro ao revogar convite.')
    }
  }

  const handleRoleChange = async (memberId: string, currentRole: string, newRoleId: string) => {
    if (currentRole === 'OWNER') {
      toast.error('O cargo de OWNER possui proteções exclusivas e não pode ser alterado.')
      return
    }

    try {
      await updateMemberRole({ memberId, newRoleId })
      toast.success('Cargo do membro atualizado com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar cargo do membro.')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {isError && <p role="alert">Não foi possível carregar os dados da equipe. Nenhum registro de demonstração substitui esta falha.</p>}
      {!canInvite && <p>Envio de convites e alteração de papéis aguardam homologação do serviço seguro no servidor.</p>}
      <section className="space-y-2 rounded-xl border border-[#30303B] p-4" aria-label="Papéis disponíveis">
        <h2 className="font-semibold">Papéis de acesso disponíveis</h2>
        {rolesLoading ? <p role="status">Carregando papéis…</p> : rolesError ? <p role="alert">Não foi possível carregar os papéis da agência.</p> : roleOptions.length === 0 ? <p>Nenhum papel disponível para atribuição.</p> : <ul className="space-y-1 text-sm">{roleOptions.map(role => <li key={role.value}>{role.label}</li>)}</ul>}
        <p className="text-xs text-[#A1A1B0]">Especialidades profissionais não concedem permissões. OWNER é reservado ao proprietário.</p>
      </section>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7952FF]" />
            Gestão de Equipe & Colaboradores
          </h3>
          <p className="text-xs text-[#A1A1B0]">
            Administre os membros ativos da agência, convites pendentes e atribuição de cargos.
          </p>
        </div>

        {/* Botão de Convite */}
        <Button variant="accent" size="sm" disabled={!canInvite} onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="w-4 h-4" />
          <span>Convidar Membro</span>
        </Button>

        {/* Modal de Convite */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogBody className="bg-[#1C1C24] border-[#30303B] text-[#F8F9FC]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#B8FF65]" />
                Convidar Colaborador para a Agência
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-[#A1A1B0] block mb-1.5">
                  Endereço de E-mail do Convidado <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#717182] absolute left-3 top-2.5" />
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colaborador@agencia.com.br"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="invite-role" className="text-xs font-semibold text-[#A1A1B0] block mb-1.5">
                  Papel de acesso atribuído
                </label>
                <Select
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                  id="invite-role"
                  required
                  disabled={rolesLoading || rolesError || roleOptions.length === 0}
                  options={[{value: '', label: rolesLoading ? 'Carregando papéis…' : rolesError ? 'Falha ao carregar papéis' : roleOptions.length ? 'Selecione um papel de acesso' : 'Nenhum papel disponível'}, ...roleOptions]}
                />
              </div>

              <div className="p-3 rounded-xl bg-[#101014] border border-[#30303B] text-[11px] text-[#A1A1B0] space-y-1">
                <span className="font-semibold text-[#F8F9FC] block flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#7952FF]" />
                  Convite com Hash Seguro de 7 Dias
                </span>
                <p>
                  O colaborador receberá um link único com expiração automática. Nenhuma senha ou token em texto puro é armazenado.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="accent" size="sm" loading={isSubmitting} disabled={!canInvite || !roleOptions.some(r => r.value === inviteRoleId)}>
                  Enviar Convite
                </Button>
              </div>
            </form>
          </DialogBody>
        </Dialog>
      </div>

      {/* Tabela de Membros Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Membros da Equipe ({members.length})</CardTitle>
          <CardDescription className="text-xs">
            Lista de usuários com acesso autorizado ao workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-[#30303B]">
            {members.map((member) => (
              <div key={member.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <Avatar src={member.avatar_url} name={member.full_name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F8F9FC] text-sm">{member.full_name}</span>
                      {member.role_name === 'OWNER' && (
                        <Badge variant="accent" className="text-[10px] py-0">
                          PROPRIETÁRIO
                        </Badge>
                      )}
                    </div>
                    <span className="text-[#A1A1B0] text-xs">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[#717182] text-[11px] hidden md:inline">
                    Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                  </span>

                  {/* Seletor de Cargo */}
                  <div className="w-36">
                    <Select
                      disabled={!canUpdateRole || member.role_name === 'OWNER'}
                      value={member.role_id}
                      onChange={(e) => handleRoleChange(member.id, member.role_name, e.target.value)}
                      options={roles.map((r) => ({
                        value: r.id,
                        label: r.name,
                      }))}
                    />
                  </div>

                  <Badge variant={member.status === 'active' ? 'default' : 'neutral'}>
                    {member.status === 'active' ? 'Ativo' : member.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Convites Pendentes */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Convites Pendentes ({invitations.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Convites enviados aguardando aceite pelo colaborador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#30303B]">
              {invitations.map((inv) => (
                <div key={inv.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-medium text-[#F8F9FC] text-sm block">{inv.email}</span>
                    <span className="text-[11px] text-[#A1A1B0]">
                      Convidado como <strong className="text-[#7952FF]">{inv.role_name}</strong> por {inv.invited_by_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#717182]">
                      Expira em {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(inv.id, inv.email)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revogar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
