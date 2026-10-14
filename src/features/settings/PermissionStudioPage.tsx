import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { initialRoles, initialPermissions } from './hooks/useAgencySettings'

export const PermissionStudioPage = () => {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''
  const client = useQueryClient()
  const [draft, setDraft] = useState<Record<string, boolean> | null>(null)
  const [saving, setSaving] = useState(false)
  const query = useQuery({
    queryKey: ['permission-matrix', agencyId,auth.user?.id], enabled: !!agencyId,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (auth.isDemo || !supabase) return { roles: initialRoles, permissions: initialPermissions, grants: [] as any[] }
      const [roleResult, permissionResult] = await Promise.all([
        supabase.from('roles').select('id, name').eq('agency_id', agencyId).order('name'),
        supabase.from('permissions').select('id, permission_key, module, description').neq('module', 'proposals').order('permission_key'),
      ])
      if (roleResult.error) throw roleResult.error
      if (permissionResult.error) throw permissionResult.error
      const roles = roleResult.data ?? []
      const permissionIds = roles.map((role: any) => role.id)
      const result = permissionIds.length ? await supabase.from('role_permissions').select('role_id, permission_id, allowed').in('role_id', permissionIds) : { data: [], error: null }
      if (result.error) throw result.error
      return { roles, permissions: permissionResult.data ?? [], grants: result.data ?? [] }
    },
  })
  const { roles = [], permissions = [], grants = [] } = query.data ?? {}
  const base = Object.fromEntries(grants.map((grant: any) => [`${grant.role_id}_${grant.permission_id}`, grant.allowed]))
  const matrix = draft ?? base
  const canEdit = !auth.isDemo && !!auth.activeAgency && (auth.activeAgency.roleName === 'OWNER' || auth.permissions.has('permissions.manage')) && !!query.data && !query.isError
  useEffect(()=>{setDraft(null)},[agencyId,auth.user?.id]);
  const changes = roles.filter((role: any) => role.name !== 'OWNER').flatMap((role: any) => permissions.filter((permission: any) => !!matrix[`${role.id}_${permission.id}`] !== !!base[`${role.id}_${permission.id}`]).map((permission: any) => ({ role_id: role.id, permission_id: permission.id, allowed: !!matrix[`${role.id}_${permission.id}`] })))
  const canSave = canEdit && !query.isFetching && !saving && changes.length > 0
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!canSave || saving || !supabase) return
    setSaving(true)
    try {
      const { error } = await supabase.rpc('set_agency_role_permissions', { p_agency_id: agencyId, p_changes: changes })
      if (error) throw error
      setDraft(null)
      await client.invalidateQueries({ queryKey: ['permission-matrix', agencyId,auth.user?.id] })
      auth.reloadAccess()
      toast.success('Matriz salva no backend da agência.')
    } catch { toast.error('Não foi possível salvar. Verifique a permissão e a disponibilização da transação no backend.') }
    finally { setSaving(false) }
  }
  return <form onSubmit={save} className="space-y-5"><div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-lg font-bold">Permission Studio & Matriz de Controle de Acesso</h3><p className="text-xs text-[#B8B8C0]">{auth.isDemo ? 'Prévia local: alterações não são persistidas.' : 'Papéis e permissões da agência atual. Alterações salvas por transação segura; o papel OWNER permanece protegido.'}</p></div><Button type="submit" disabled={!canSave || saving || !draft} loading={saving}>Salvar Matriz</Button></div><Badge variant="outline">OWNER protegido</Badge>{query.isLoading && <p role="status">Carregando permissões…</p>}{query.isError && <p role="alert">Não foi possível carregar os papéis e permissões. Nenhuma matriz demonstrativa foi usada.</p>}<Card><CardContent className="overflow-x-auto"><table className="w-full text-xs"><caption className="text-left py-3">Matriz por papel — OWNER protegido</caption><thead><tr><th className="text-left">Permissão</th>{roles.map((role: any) => <th key={role.id} className="p-3">{role.name}</th>)}</tr></thead><tbody>{permissions.map((permission: any) => <tr key={permission.id} className="border-t border-[#30303B]"><th className="text-left font-normal p-3">{permission.permission_key || permission.id}<span className="block text-[#B8B8C0]">{permission.description}</span></th>{roles.map((role: any) => { const key = `${role.id}_${permission.id}`; return <td key={key} className="text-center"><input type="checkbox" aria-label={`${role.name}: ${permission.permission_key || permission.id}`} checked={role.name === 'OWNER' || !!matrix[key]} disabled={saving || query.isFetching || role.name === 'OWNER' || (!auth.isDemo && !canEdit)} onChange={e => setDraft({ ...matrix, [key]: e.target.checked })} /></td> })}</tr>)}</tbody></table></CardContent></Card></form>
}
