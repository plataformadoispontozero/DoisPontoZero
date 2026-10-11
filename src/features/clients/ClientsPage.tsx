import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useClient } from '@/features/clients/hooks/useClients'
import { toast } from '@/components/ui/Toast'
import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS — FASE 03
// Clients & CRM Management Page (/clients)
// ============================================================

import React, { useEffect, useState } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  Building2,
  FileText,
  FolderKanban,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingState } from '@/components/ui/FeedbackStates'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from './hooks/useClients'
import { ClientBriefingsTab } from './components/ClientBriefingsTab'
import type { Client } from '@/types/projects'

const DEMO_AGENCY_ID = 'demo-agency'

export const ClientsPage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()
  const { clientId } = useParams<{ clientId?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: routeClient, isError: routeError } = useClient(clientId)

  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const { data: clients = [], isLoading } = useClients(DEMO_AGENCY_ID, {
    search: search.trim() || undefined,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  })

  const createClient = useCreateClient(DEMO_AGENCY_ID)
  const updateClient = useUpdateClient(DEMO_AGENCY_ID)
  const deleteClient = useDeleteClient(DEMO_AGENCY_ID)

  // Dialog & Sheet State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedClientHub, setSelectedClientHub] = useState<Client | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  useEffect(() => {
    if (location.pathname === '/clients/new') {
      setEditingClient(null); setName(''); setSlug(''); setLogoUrl(''); setStatus('active'); setIsCreateOpen(true)
    } else if (routeClient && clientId) {
      if (location.pathname.endsWith('/edit')) {
        setSelectedClientHub(null); setEditingClient(routeClient); setName(routeClient.name); setSlug(routeClient.slug)
        setLogoUrl(routeClient.logo_url || ''); setStatus(routeClient.status === 'active' ? 'active' : 'inactive'); setIsCreateOpen(true)
      } else { setIsCreateOpen(false); setSelectedClientHub(routeClient) }
    }
  }, [location.pathname, clientId, routeClient])

  const handleOpenCreate = () => {
    setEditingClient(null)
    setName('')
    setSlug('')
    setLogoUrl('')
    setStatus('active')
    setIsCreateOpen(true)
    navigate('/clients/new')
  }

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client)
    setName(client.name)
    setSlug(client.slug)
    setLogoUrl(client.logo_url || '')
    setStatus(client.status === 'active' ? 'active' : 'inactive')
    setIsCreateOpen(true)
    navigate(`/clients/${client.id}/edit`)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    try {
    if (editingClient) {
      await updateClient.mutateAsync({
        id: editingClient.id,
        name: name.trim(),
        slug: slug.trim() || undefined,
        logo_url: logoUrl.trim() || null,
        status,
      })
    } else {
      await createClient.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        logo_url: logoUrl.trim() || null,
        status,
      })
    }

    setIsCreateOpen(false)
    if (location.pathname !== '/clients') navigate('/clients')
    } catch { toast.error('Não foi possível salvar o cliente. Confira o acesso à agência e tente novamente.') }
  }

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Tem certeza que deseja arquivar este cliente?')) {
      try { await deleteClient.mutateAsync(clientId) } catch { toast.error('Não foi possível arquivar o cliente.') }
    }
  }

  const activeCount = clients.filter((c) => c.status === 'active').length
  const inactiveCount = clients.filter((c) => c.status === 'inactive').length

  if (clientId && routeError) return <div role="alert">Cliente indisponível ou sem acesso nesta agência.</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      <PageHeader
        title="Clientes & Contas"
        subtitle="Gestão centralizada de contas ativas, histórico de projetos, diretrizes e briefings."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Clientes' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Cliente</span>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#98989F] block tracking-wider">
                Total de Clientes
              </span>
              <span className="text-xl font-bold text-[#F8F9FC] mt-0.5 block">
                {clients.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#C74410]/10 text-[#C74410] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#98989F] block tracking-wider">
                Contas Ativas
              </span>
              <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
                {activeCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1C1C24] border-[#30303B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#98989F] block tracking-wider">
                Inativos / Pausados
              </span>
              <span className="text-xl font-bold text-[#B8B8C0] mt-0.5 block">
                {inactiveCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#252530] text-[#B8B8C0] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#98989F]" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9 bg-[#1C1C24] border-[#30303B]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedStatus === st
                  ? 'bg-[#C74410] text-white shadow-sm'
                  : 'bg-[#1C1C24] text-[#B8B8C0] hover:text-[#F8F9FC] border border-[#30303B]'
              }`}
            >
              {st === 'all' ? 'Todos' : st === 'active' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <LoadingState message="Carregando clientes..." />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente localizado"
          description={
            search || selectedStatus !== 'all'
              ? 'Tente remover os filtros de busca para encontrar clientes cadastrados.'
              : 'Cadastre sua primeira conta corporativa para vincular projetos, briefings e estratégias.'
          }
          actionLabel="Cadastrar Primeiro Cliente"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const initials = client.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <Card
                key={client.id}
                className="bg-[#1C1C24] border-[#30303B] hover:border-[#C74410]/40 transition-colors flex flex-col justify-between group"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C74410]/20 to-[#FF8759]/20 border border-[#C74410]/30 flex items-center justify-center font-bold text-xs text-[#F8F9FC]">
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#F8F9FC] group-hover:text-[#C74410] transition-colors">
                          {client.name}
                        </h4>
                        <span className="text-[11px] text-[#98989F] font-mono">
                          @{client.slug}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={client.status === 'active' ? 'success' : 'neutral'}
                      className="text-[10px] px-2 py-0.5"
                    >
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-[#30303B]/60 flex items-center justify-between text-xs text-[#B8B8C0]">
                    <span>Cadastrado em:</span>
                    <span className="font-medium text-[#F8F9FC]">
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>

                <div className="px-5 py-3 border-t border-[#30303B]/60 bg-[#13131A]/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-1.5 rounded-lg text-[#98989F] hover:text-[#F8F9FC] hover:bg-[#30303B]/60 transition-colors"
                      title="Editar dados do cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 rounded-lg text-[#98989F] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Arquivar cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="text-xs h-7 gap-1 px-2.5 text-[#C74410] hover:bg-[#C74410]/10"
                  >
                    <span>Client Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={open => { setIsCreateOpen(open); if (!open && location.pathname !== '/clients') navigate('/clients') }}>
        <DialogContent className="max-w-md bg-[#1C1C24] border-[#30303B] text-[#F8F9FC]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#F8F9FC]">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label htmlFor="client-name" className="font-medium text-[#B8B8C0]">Nome da Marca / Razão Social *</label>
              <Input
                id="client-name" placeholder="Ex: Studio Vertex Design"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!editingClient && !slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')
                    )
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="client-slug" className="font-medium text-[#B8B8C0]">Identificador Único (Slug)</label>
              <Input
                id="client-slug" placeholder="studio-vertex"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="client-logo" className="font-medium text-[#B8B8C0]">URL do Logotipo (Opcional)</label>
              <Input
                id="client-logo" placeholder="https://exemplo.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="client-status" className="font-medium text-[#B8B8C0]">Status Operacional</label>
              <select id="client-status"
                className="w-full h-9 rounded-md bg-[#13131A] border border-[#30303B] px-2 text-xs text-[#F8F9FC] focus:outline-none focus:border-[#C74410]"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              >
                <option value="active">Ativo (Conta com demandas em andamento)</option>
                <option value="inactive">Inativo (Sem contrato vigente)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || createClient.isPending || updateClient.isPending}
            >
              {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Hub Sheet */}
      {selectedClientHub && (
        <Sheet
          open={Boolean(selectedClientHub)}
          side="right"
          className="max-w-xl"
          onOpenChange={(open) => {
            if (!open) { setSelectedClientHub(null); if (clientId) navigate('/clients') }
          }}
        >
          <SheetHeader onClose={() => setSelectedClientHub(null)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C74410]/20 to-[#FF8759]/20 border border-[#C74410]/30 flex items-center justify-center font-bold text-sm text-[#F8F9FC]">
                {selectedClientHub.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-[#F8F9FC]">
                  {selectedClientHub.name}
                </SheetTitle>
                <p className="text-xs text-[#B8B8C0]">Client Hub & Central da Marca</p>
              </div>
            </div>
          </SheetHeader>

          <SheetContent className="space-y-6">
              <Tabs defaultValue="briefings" className="w-full">
                <TabsList className="bg-[#1C1C24] border border-[#30303B] p-1 rounded-xl flex gap-1 w-full">
                  <TabsTrigger
                    value="briefings"
                    className="flex-1 text-xs py-1.5 data-[state=active]:bg-[#C74410] data-[state=active]:text-white"
                  >
                    Briefings
                  </TabsTrigger>
                  <TabsTrigger
                    value="overview"
                    className="flex-1 text-xs py-1.5 data-[state=active]:bg-[#C74410] data-[state=active]:text-white"
                  >
                    Dados da Conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="briefings" className="mt-4">
                  <ClientBriefingsTab
                    clientId={selectedClientHub.id}
                    agencyId={DEMO_AGENCY_ID}
                  />
                </TabsContent>

                <TabsContent value="overview" className="mt-4 space-y-4 text-xs">
                  <Card className="bg-[#1C1C24] border-[#30303B]">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <span className="text-[#98989F] font-semibold block">Identificador Slug:</span>
                        <span className="text-[#F8F9FC] font-mono">{selectedClientHub.slug}</span>
                      </div>
                      <div>
                        <span className="text-[#98989F] font-semibold block">Status da Parceria:</span>
                        <Badge
                          variant={selectedClientHub.status === 'active' ? 'success' : 'neutral'}
                          className="mt-1"
                        >
                          {selectedClientHub.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-[#98989F] font-semibold block">Cadastrado em:</span>
                        <span className="text-[#B8B8C0]">
                          {new Date(selectedClientHub.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
export default ClientsPage
