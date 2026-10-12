# Auditoria de prontidão — 12/10/2026

## Método e alcance
Revisão de rotas e contratos do código, testes de banco isolado e browser com sessão/APIs controladas. Os mocks não validam RLS remoto nem autenticação Google real. A origem Lovable permanece somente leitura; importação destino exige comparação de contagens, snapshots, datas e repetição idempotente.

## Correções desta rodada
Nova proposta e nova reunião buscavam clientes com `demo-agency` em produção. Agora recebem `useAgencyId()` e consultam o UUID da agência autenticada. O teste de browser verifica esse filtro e presença do cliente.

## Cobertura planejada
Dashboard, clientes, briefings, calendário editorial, projetos, tarefas, produção Design/Vídeo/Tráfego, nova proposta, nova reunião e configurações: navegação autenticada, refresh, erros JavaScript e overflow em desktop/tablet/mobile. Fluxos existentes cobrem briefing→calendário→editor de peça, Drive em demandas e perfis/squads. Geração deve permanecer em rascunho até o fluxo de aprovação do cliente; migração não aprova campanhas.

## Pendências explícitas para testes da equipe
- Propostas: aplicar template e salvar itens/seções é bloqueado pelo contrato atual, que exige persistência transacional no backend. Não confundir criação simples da proposta com editor financeiro completo.
- Reuniões: agenda, ata, decisões e ações relacionadas ainda exigem persistência transacional; atualização dos campos básicos da reunião funciona por contrato separado.
- Google Drive: upload/preview direto com conta real ainda não foi executado pelo agente; testes publicados usam APIs simuladas e validações SQL/handler.
- E-mail de convite/recuperação: configuração SMTP e entrega externa continuam dependentes da configuração do provedor; nenhum disparo real nesta rodada.
- Meta: dados reais dependem da autorização e conta conectada; nenhum número fictício deve substituir métricas reais.

## Evidências
Resultados finais da migração, gates e publicação serão registrados na story `full-native-briefings-and-client-readiness.md`. Não há declaração de que toda a plataforma foi homologada com contas reais.
