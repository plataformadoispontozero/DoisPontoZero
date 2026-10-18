# ClientHubModal / Histórico

Componente auxiliar alcançado por clientes/projetos, não uma rota independente.

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Aba `Histórico` | NÃO VERIFICADO | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:86-86` | Controle presente, fluxo não exercitado agora | MANTER NOVO | Preservar componente usado pelas rotas atuais | Troca pode perder contexto cliente/tarefa | Refresh, autorização e ação persistida |
| Alternativa antiga | Acesso bloqueado | Contratos atuais abaixo | Comparação bloqueada | INVESTIGAR | Ganho não comprovado | Duplicar estado ou autorização | Fonte legada/SHA e evidência funcional |

## Rastro e contratos

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:6-6` — `import { useAgencyId, usePermission } from '@/features/auth/AuthProvider';`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:24-24` — `const dialog=useRef<HTMLDialogElement>(null), navigate=useNavigate(), agency=useAgencyId();`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:25-25` — `const canEdit=usePermission('clients.edit'),canStrategy=usePermission('strategy.view'),canBriefs=usePermission('briefings.view');`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:26-26` — `const canPresentations=usePermission('presentations.view');`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:27-27` — `const update=useUpdateClient(agency);`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:28-28` — `const [section,setSection]=useState('Visão geral'),[editing,setEditing]=useState(false);`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:29-29` — `const [draft,setDraft]=useState<ClientProfile>(()=>readClientProfile(client.profile));`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:30-30` — `const [logo,setLogo]=useState(client.logo_url||'');`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:32-32` — `const campaigns=useQuery({queryKey:['client-profile-campaigns',agency,client.id],enabled:!!supabase&&canStrategy,queryFn:async()=>{`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:33-33` — `const {data,error}=await supabase!.from('monthly_editorial_campaigns').select('id,month,status').eq('agency_id',agency).eq('client_id',client.id).order('created_at',{ascending:fals`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:36-36` — `const contacts=useQuery({queryKey:['client-briefing-contacts',agency,client.id],enabled:!!supabase&&Boolean(agency&&client.id),queryFn:async()=>{`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:37-37` — `const {data,error}=await supabase!.from('briefings').select('id,answers:briefing_answers(question:briefing_questions(question_key),answer_value)').eq('agency_id',agency).eq('client`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/components/ClientHubModal.tsx:53-53` — `useEffect(()=>{`

São chamadas no componente, não prova de backend executado. Preservar os IDs de cliente/tarefa, permission gates, interfaces e Drive. Nenhuma edição aprovada. Rollback por PR/flag compatível sem excluir dados. Testes propostos: membro autorizado/negado, clienteA/B, erro, mobile, edição/refresh e arquivos privados. Estado: NÃO TESTADO nesta execução.
