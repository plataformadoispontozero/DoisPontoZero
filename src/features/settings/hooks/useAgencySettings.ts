import { useAgencyId, useAuth } from '@/features/auth/AuthProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { defaultBranding } from '@/config/branding'
import type {
  AgencyBrandingData,
  AgencyPreferencesData,
  AgencyDocumentSettingsData,
  AgencyPortalSettingsData,
  AgencyMemberUser,
  AgencyInvitation,
  PermissionDefinition,
  RoleDefinition,
  RolePermissionMatrixItem,
  ActivityEvent,
} from '@/types/whitelabel'

const DEMO_AGENCY_ID = 'agency-001'

// Initial fallback branding data matching defaultBranding
export const initialAgencyBranding: AgencyBrandingData = {
  id: 'brand-001',
  agency_id: DEMO_AGENCY_ID,
  display_name: 'Dois.Zero',
  legal_name: 'Dois.Zero Sistemas Criativos Ltda.',
  tagline: 'Sua agência. Tudo conectado.',
  logo_light_path: '',
  logo_dark_path: '',
  symbol_path: '',
  favicon_path: '',
  primary_color: '#7952FF',
  secondary_color: '#A1A1B0',
  accent_color: '#B8FF65',
  background_color: '#101014',
  surface_color: '#1C1C24',
  text_color: '#F8F9FC',
  heading_font: 'Space Grotesk',
  body_font: 'Inter',
  theme_mode: 'dark',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const initialAgencyPreferences: AgencyPreferencesData = {
  id: 'pref-001',
  agency_id: DEMO_AGENCY_ID,
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  date_format: 'DD/MM/YYYY',
  time_format: '24h',
  currency: 'BRL',
  week_starts_on: 1,
  default_project_view: 'kanban',
  default_task_view: 'board',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const initialAgencyDocumentSettings: AgencyDocumentSettingsData = {
  id: 'doc-001',
  agency_id: DEMO_AGENCY_ID,
  header_style: 'centered_logo',
  footer_text: 'Documento confidencial gerado via Creative Agency OS',
  show_logo: true,
  show_watermark: true,
  watermark_opacity: 0.05,
  page_format: 'A4',
  document_font: 'Helvetica',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const initialAgencyPortalSettings: AgencyPortalSettingsData = {
  id: 'portal-001',
  agency_id: DEMO_AGENCY_ID,
  portal_title: 'Portal de Entregas & Briefings',
  welcome_message: 'Bem-vindo ao portal de colaboração da nossa agência.',
  show_agency_logo: true,
  show_client_logo: true,
  footer_text: 'Powered by Creative Agency OS',
  contact_email: 'contato@doiszero.com.br',
  website_url: 'https://doiszero.com.br',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const initialRoles: RoleDefinition[] = [
  { id: 'role-owner', agency_id: DEMO_AGENCY_ID, name: 'OWNER', description: 'Proprietário com acesso total e irrevogável.', is_system: true },
  { id: 'role-admin', agency_id: DEMO_AGENCY_ID, name: 'ADMIN', description: 'Administrador geral do workspace.', is_system: true },
  { id: 'role-manager', agency_id: DEMO_AGENCY_ID, name: 'MANAGER', description: 'Gestor de projetos, squads e briefings.', is_system: true },
  { id: 'role-member', agency_id: DEMO_AGENCY_ID, name: 'MEMBER', description: 'Membro executor da equipe criativa.', is_system: true },
  { id: 'role-viewer', agency_id: DEMO_AGENCY_ID, name: 'VIEWER', description: 'Acesso apenas para leitura e acompanhamento.', is_system: true },
]

export const initialPermissions: PermissionDefinition[] = [
  { id: 'p1', permission_key: 'dashboard.view', module: 'dashboard', description: 'Visualizar o painel de controle operacional e métricas' },
  { id: 'p2', permission_key: 'clients.view', module: 'clients', description: 'Visualizar carteira de clientes' },
  { id: 'p3', permission_key: 'clients.create', module: 'clients', description: 'Cadastrar novos clientes' },
  { id: 'p4', permission_key: 'clients.edit', module: 'clients', description: 'Editar dados de clientes' },
  { id: 'p5', permission_key: 'clients.delete', module: 'clients', description: 'Excluir clientes' },
  { id: 'p6', permission_key: 'projects.view', module: 'projects', description: 'Visualizar lista e quadro de projetos' },
  { id: 'p7', permission_key: 'projects.create', module: 'projects', description: 'Criar novos projetos' },
  { id: 'p8', permission_key: 'projects.edit', module: 'projects', description: 'Editar parâmetros de projetos' },
  { id: 'p9', permission_key: 'projects.delete', module: 'projects', description: 'Excluir projetos' },
  { id: 'p10', permission_key: 'tasks.view', module: 'tasks', description: 'Visualizar tarefas' },
  { id: 'p11', permission_key: 'tasks.create', module: 'tasks', description: 'Criar novas tarefas' },
  { id: 'p12', permission_key: 'tasks.edit', module: 'tasks', description: 'Editar tarefas' },
  { id: 'p13', permission_key: 'tasks.delete', module: 'tasks', description: 'Excluir tarefas' },
  { id: 'p14', permission_key: 'squads.view', module: 'squads', description: 'Visualizar squads e ranking' },
  { id: 'p15', permission_key: 'squads.edit', module: 'squads', description: 'Gerenciar membros e metas de squads' },
  { id: 'p16', permission_key: 'briefings.view', module: 'briefings', description: 'Visualizar e preencher briefings' },
  { id: 'p17', permission_key: 'briefings.create', module: 'briefings', description: 'Criar novos templates de briefing' },
  { id: 'p18', permission_key: 'briefings.export', module: 'briefings', description: 'Exportar briefings para PDF' },
  { id: 'p19', permission_key: 'strategy.view', module: 'strategy', description: 'Visualizar diagnósticos e planejamento' },
  { id: 'p20', permission_key: 'strategy.edit', module: 'strategy', description: 'Criar e editar pilares e pautas' },
  { id: 'p21', permission_key: 'proposals.view', module: 'proposals', description: 'Visualizar propostas comerciais' },
  { id: 'p22', permission_key: 'proposals.create', module: 'proposals', description: 'Gerar e editar propostas' },
  { id: 'p23', permission_key: 'proposals.export', module: 'proposals', description: 'Exportar e publicar propostas' },
  { id: 'p24', permission_key: 'drive.view', module: 'drive', description: 'Acessar arquivos e conexões de Drive' },
  { id: 'p25', permission_key: 'presentations.view', module: 'presentations', description: 'Visualizar apresentações executivas' },
  { id: 'p26', permission_key: 'meetings.view', module: 'meetings', description: 'Acessar agenda e reuniões' },
  { id: 'p27', permission_key: 'chat.access', module: 'chat', description: 'Acessar canais e DMs do Team Chat' },
  { id: 'p28', permission_key: 'branding.view', module: 'settings', description: 'Visualizar White Label Studio' },
  { id: 'p29', permission_key: 'branding.edit', module: 'settings', description: 'Editar identidade visual e cores' },
  { id: 'p30', permission_key: 'settings.view', module: 'settings', description: 'Visualizar dados da agência' },
  { id: 'p31', permission_key: 'settings.edit', module: 'settings', description: 'Editar dados cadastrais e preferências' },
  { id: 'p32', permission_key: 'permissions.view', module: 'settings', description: 'Visualizar Permission Studio' },
  { id: 'p33', permission_key: 'permissions.manage', module: 'settings', description: 'Salvar matriz de permissões' },
  { id: 'p34', permission_key: 'team.view', module: 'team', description: 'Visualizar colaboradores' },
  { id: 'p35', permission_key: 'team.invite', module: 'team', description: 'Convidar colaboradores' },
  { id: 'p36', permission_key: 'team.manage', module: 'team', description: 'Gerenciar cargos de membros' },
]

export const initialMembers: AgencyMemberUser[] = [
  {
    id: 'mem-001',
    agency_id: DEMO_AGENCY_ID,
    user_id: 'usr-001',
    role_id: 'role-owner',
    role_name: 'OWNER',
    status: 'active',
    full_name: 'Lucas Silveira',
    email: 'lucas@doiszero.com.br',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    joined_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'mem-002',
    agency_id: DEMO_AGENCY_ID,
    user_id: 'usr-002',
    role_id: 'role-admin',
    role_name: 'ADMIN',
    status: 'active',
    full_name: 'Camila Rocha',
    email: 'camila@doiszero.com.br',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    joined_at: '2026-02-15T14:30:00Z',
  },
  {
    id: 'mem-003',
    agency_id: DEMO_AGENCY_ID,
    user_id: 'usr-003',
    role_id: 'role-manager',
    role_name: 'MANAGER',
    status: 'active',
    full_name: 'Gabriel Costa',
    email: 'gabriel@doiszero.com.br',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    joined_at: '2026-03-01T09:15:00Z',
  },
  {
    id: 'mem-004',
    agency_id: DEMO_AGENCY_ID,
    user_id: 'usr-004',
    role_id: 'role-member',
    role_name: 'MEMBER',
    status: 'active',
    full_name: 'Mariana Lima',
    email: 'mariana@doiszero.com.br',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    joined_at: '2026-04-10T11:00:00Z',
  },
]

export const initialInvitations: AgencyInvitation[] = [
  {
    id: 'inv-001',
    agency_id: DEMO_AGENCY_ID,
    email: 'rodrigo.design@gmail.com',
    role_id: 'role-member',
    role_name: 'MEMBER',
    invited_by: 'usr-001',
    invited_by_name: 'Lucas Silveira',
    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    created_at: new Date().toISOString(),
  },
]

export const initialActivityEvents: ActivityEvent[] = [
  {
    id: 'act-101',
    agency_id: DEMO_AGENCY_ID,
    actor_user_id: 'usr-001',
    actor_name: 'Lucas Silveira',
    actor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    event_type: 'proposals.published',
    resource_type: 'proposal',
    resource_id: 'prop-001',
    summary: 'Publicou a Proposta Comercial de Rebranding para a Vanguarda Tech.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'act-102',
    agency_id: DEMO_AGENCY_ID,
    actor_user_id: 'usr-003',
    actor_name: 'Gabriel Costa',
    actor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    event_type: 'meetings.action_converted',
    resource_type: 'meeting',
    resource_id: 'meet-001',
    summary: 'Converteu 3 planos de ação da Reunião Semanal em tarefas no Quadro Kanban.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'act-103',
    agency_id: DEMO_AGENCY_ID,
    actor_user_id: 'usr-002',
    actor_name: 'Camila Rocha',
    actor_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    event_type: 'briefings.received',
    resource_type: 'briefing',
    resource_id: 'brf-002',
    summary: 'Recebeu resposta do Briefing de Campanha Social Media do cliente Lumina.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'act-104',
    agency_id: DEMO_AGENCY_ID,
    actor_user_id: 'usr-004',
    actor_name: 'Mariana Lima',
    actor_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    event_type: 'presentations.exported',
    resource_type: 'presentation',
    resource_id: 'pres-001',
    summary: 'Exportou o Deck Mensal de Resultados de Outubro em PDF.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
]

// Custom Hooks for Querying & Mutating Settings Data
export function useAgencyBranding(agencyId?: string) {
  const auth = useAuth()
  const currentAgencyId = useAgencyId()
  agencyId = currentAgencyId || agencyId || ''
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['agencyBranding', agencyId],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_branding')
          .select('*')
          .eq('agency_id', agencyId)
          .single()

        if (error) throw error
        if (data) {
          return data as AgencyBrandingData
        }
      }
      return initialAgencyBranding
    },
    initialData: initialAgencyBranding,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AgencyBrandingData>) => {
      const { id: _id, agency_id: _tenant, created_at: _created, updated_at: _updated, ...fields } = updates
      if (Object.values(fields).some(value => typeof value === 'string' && value.startsWith('blob:'))) throw new Error('Envie os assets ao Storage privado antes de salvar; URLs temporárias não persistem.')

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_branding')
          .upsert({
            ...fields,
            agency_id: agencyId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id' })
          .select()
          .single()

        if (error) throw error
        return data as AgencyBrandingData
      }
      return { ...query.data, ...updates, updated_at: new Date().toISOString() }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['agencyBranding', agencyId], updated)
    },
  })

  return {
    branding: query.data,
    isLoading: query.isLoading,
    updateBranding: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

export function useAgencyPreferences(agencyId?: string) {
  const auth = useAuth()
  const currentAgencyId = useAgencyId()
  agencyId = currentAgencyId || agencyId || ''
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['agencyPreferences', agencyId],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_preferences')
          .select('*')
          .eq('agency_id', agencyId)
          .single()

        if (error) throw error
        if (data) {
          return data as AgencyPreferencesData
        }
      }
      return initialAgencyPreferences
    },
    initialData: initialAgencyPreferences,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AgencyPreferencesData>) => {
      const { id: _id, agency_id: _tenant, created_at: _created, updated_at: _updated, ...fields } = updates
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_preferences')
          .upsert({
            ...fields,
            agency_id: agencyId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id' })
          .select()
          .single()

        if (error) throw error
        return data as AgencyPreferencesData
      }
      return { ...query.data, ...updates, updated_at: new Date().toISOString() }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['agencyPreferences', agencyId], updated)
    },
  })

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

export function useAgencyDocumentSettings(agencyId?: string) {
  const auth = useAuth()
  const currentAgencyId = useAgencyId()
  agencyId = currentAgencyId || agencyId || ''
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['agencyDocumentSettings', agencyId],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_document_settings')
          .select('*')
          .eq('agency_id', agencyId)
          .single()

        if (error) throw error
        if (data) {
          return data as AgencyDocumentSettingsData
        }
      }
      return initialAgencyDocumentSettings
    },
    initialData: initialAgencyDocumentSettings,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AgencyDocumentSettingsData>) => {
      const { id: _id, agency_id: _tenant, created_at: _created, updated_at: _updated, ...fields } = updates
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_document_settings')
          .upsert({
            ...fields,
            agency_id: agencyId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id' })
          .select()
          .single()

        if (error) throw error
        return data as AgencyDocumentSettingsData
      }
      return { ...query.data, ...updates, updated_at: new Date().toISOString() }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['agencyDocumentSettings', agencyId], updated)
    },
  })

  return {
    documentSettings: query.data,
    isLoading: query.isLoading,
    updateDocumentSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

export function useAgencyPortalSettings(agencyId?: string) {
  const auth = useAuth()
  const currentAgencyId = useAgencyId()
  agencyId = currentAgencyId || agencyId || ''
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['agencyPortalSettings', agencyId],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_portal_settings')
          .select('*')
          .eq('agency_id', agencyId)
          .single()

        if (error) throw error
        if (data) {
          return data as AgencyPortalSettingsData
        }
      }
      return initialAgencyPortalSettings
    },
    initialData: initialAgencyPortalSettings,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AgencyPortalSettingsData>) => {
      const { id: _id, agency_id: _tenant, created_at: _created, updated_at: _updated, ...fields } = updates
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_portal_settings')
          .upsert({
            ...fields,
            agency_id: agencyId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agency_id' })
          .select()
          .single()

        if (error) throw error
        return data as AgencyPortalSettingsData
      }
      return { ...query.data, ...updates, updated_at: new Date().toISOString() }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['agencyPortalSettings', agencyId], updated)
    },
  })

  return {
    portalSettings: query.data,
    isLoading: query.isLoading,
    updatePortalSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

export function useAgencyTeam(agencyId?: string) {
  const auth = useAuth()
  const currentAgencyId = useAgencyId()
  agencyId = currentAgencyId || agencyId || ''
  const queryClient = useQueryClient()

  const rolesQuery = useQuery({
    queryKey: ['agencyRoles', agencyId],
    queryFn: async () => {
      if (!supabase || !isSupabaseConfigured) return initialRoles
      const { data, error } = await supabase.from('roles').select('*').eq('agency_id', agencyId).order('name')
      if (error) throw error
      return (data ?? []) as RoleDefinition[]
    },
    enabled: !!agencyId,
    initialData: isSupabaseConfigured ? undefined : initialRoles,
  })
  const membersQuery = useQuery({
    queryKey: ['agencyMembers', agencyId],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_members')
          .select('*, profiles(full_name, avatar_url), roles(name)')
          .eq('agency_id', agencyId)

        if (error) throw error
        if (data) {
          return data.map((m: any) => ({
            id: m.id,
            agency_id: m.agency_id,
            user_id: m.user_id,
            role_id: m.role_id,
            role_name: m.roles?.name || 'MEMBER',
            status: m.status,
            full_name: m.profiles?.full_name || 'Usuário Sem Nome',
            email: m.user_id === auth.user?.id ? auth.user?.email || '' : '',
            avatar_url: m.profiles?.avatar_url,
            joined_at: m.joined_at,
          })) as AgencyMemberUser[]
        }
      }
      return initialMembers
    },
    initialData: isSupabaseConfigured ? undefined : initialMembers,
  })

  const invitationsQuery = useQuery({
    queryKey: ['agencyInvitations', agencyId],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_invitations')
          .select('*, roles(name), profiles:invited_by(full_name)')
          .eq('agency_id', agencyId)
          .is('accepted_at', null)
          .is('revoked_at', null)

        if (error) throw error
        if (data) {
          return data.map((inv: any) => ({
            id: inv.id,
            agency_id: inv.agency_id,
            email: inv.email,
            role_id: inv.role_id,
            role_name: inv.roles?.name || 'MEMBER',
            invited_by: inv.invited_by,
            invited_by_name: inv.profiles?.full_name || 'Administrador',
            expires_at: inv.expires_at,
            created_at: inv.created_at,
          })) as AgencyInvitation[]
        }
      }
      return initialInvitations
    },
    initialData: isSupabaseConfigured ? undefined : initialInvitations,
  })

  const inviteMemberMutation = useMutation({
    mutationFn: async ({ email, roleId }: { email: string; roleId: string }) => {
      if (isSupabaseConfigured) throw new Error('Convites dependem do fluxo seguro de envio e aceite no backend. Integração pendente; nenhum convite foi enviado.')
      const roleName = (rolesQuery.data ?? []).find((r) => r.id === roleId)?.name || 'MEMBER'
      const newInv: AgencyInvitation = {
        id: `inv-${Date.now()}`,
        agency_id: agencyId,
        email,
        role_id: roleId,
        role_name: roleName,
        invited_by: auth.user?.id || '',
        invited_by_name: 'Lucas Silveira',
        expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        created_at: new Date().toISOString(),
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('agency_invitations').insert({
          agency_id: agencyId,
          email,
          role_id: roleId,
          invited_by: auth.user?.id || '',
          token_hash: `token_${Math.random().toString(36).slice(2)}`,
          expires_at: newInv.expires_at,
        }).select().single()

        if (error) throw error
        return { ...newInv, id: data.id }
      }

      return newInv
    },
    onSuccess: (newInv) => {
      queryClient.setQueryData<AgencyInvitation[]>(['agencyInvitations', agencyId], (old = []) => [newInv, ...old])
    },
  })

  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('agency_invitations')
          .update({ revoked_at: new Date().toISOString() })
          .eq('id', invitationId).eq('agency_id', agencyId)
          .select('id').single()
        if (error) throw error
        if (!data) throw new Error('Convite não encontrado ou alteração não permitida.')
      }
      return invitationId
    },
    onSuccess: (revokedId) => {
      queryClient.setQueryData<AgencyInvitation[]>(['agencyInvitations', agencyId], (old = []) =>
        old.filter((inv) => inv.id !== revokedId)
      )
    },
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRoleId }: { memberId: string; newRoleId: string }) => {
      if (isSupabaseConfigured) throw new Error('Alteração de papel bloqueada até homologar a operação administrativa segura no backend.')
      const member = (membersQuery.data ?? []).find((m) => m.id === memberId)
      if (member?.role_name === 'OWNER') {
        throw new Error('O privilégio de OWNER é exclusivo e não pode ser alterado diretamente.')
      }

      const roleName = (rolesQuery.data ?? []).find((r) => r.id === newRoleId)?.name || 'MEMBER'

      if (isSupabaseConfigured && supabase) {
        await supabase.from('agency_members').update({ role_id: newRoleId }).eq('id', memberId).eq('agency_id', agencyId)
      }

      return { memberId, newRoleId, roleName }
    },
    onSuccess: ({ memberId, newRoleId, roleName }) => {
      queryClient.setQueryData<AgencyMemberUser[]>(['agencyMembers', agencyId], (old = []) =>
        old.map((m) => (m.id === memberId ? { ...m, role_id: newRoleId, role_name: roleName } : m))
      )
    },
  })

  return {
    roles: rolesQuery.data ?? [],
    rolesLoading: rolesQuery.isLoading,
    rolesError: rolesQuery.isError,
    members: membersQuery.data ?? [],
    invitations: invitationsQuery.data ?? [],
    isLoading: membersQuery.isLoading || invitationsQuery.isLoading,
    isError: membersQuery.isError || rolesQuery.isError || invitationsQuery.isError,
    canInvite: !isSupabaseConfigured,
    canUpdateRole: !isSupabaseConfigured,
    inviteMember: inviteMemberMutation.mutateAsync,
    revokeInvitation: revokeInvitationMutation.mutateAsync,
    updateMemberRole: updateMemberRoleMutation.mutateAsync,
  }
}

export function useActivityFeed(agencyId?: string) {
  const auth = useAuth()
  const currentAgencyId = useAgencyId()
  agencyId = currentAgencyId || agencyId || ''
  return useQuery({
    queryKey: ['activityFeed', agencyId],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, profiles:actor_user_id(full_name, avatar_url)')
          .eq('agency_id', agencyId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        if (data) {
          return data.map((log: any) => ({
            id: log.id,
            agency_id: log.agency_id,
            actor_user_id: log.actor_user_id,
            actor_name: log.profiles?.full_name || 'Sistema',
            actor_avatar: log.profiles?.avatar_url,
            event_type: log.action,
            resource_type: log.entity_type,
            resource_id: log.entity_id,
            summary: log.metadata?.summary || `${log.action} em ${log.entity_type}`,
            details: log.metadata,
            created_at: log.created_at,
          })) as ActivityEvent[]
        }
      }
      return isSupabaseConfigured ? [] : initialActivityEvents
    },
    initialData: isSupabaseConfigured ? [] : initialActivityEvents,
  })
}
