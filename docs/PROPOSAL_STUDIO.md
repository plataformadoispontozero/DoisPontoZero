# DOIS.ZERO — PROPOSAL STUDIO (FASE 08)

## Visão Geral
O **Proposal Studio** é o módulo comercial do **Dois.Zero Creative Agency OS**. Ele permite a criação, edição, precificação, aprovação interna, publicação online interativa e exportação em PDF de propostas comerciais de agências criativas.

---

## 1. Rotas do Módulo

| Rota | Descrição |
|---|---|
| `/proposals` | Dashboard principal com indicadores comerciais, busca, filtros e alternância de visualização em grade/lista. |
| `/proposals/new` | Wizard guiado em 3 etapas para vincular cliente, briefing, estratégia e template comercial. |
| `/proposals/services` | Catálogo de serviços da agência com modelo de precificação (fixo, mensal, hora, unidade, orçado). |
| `/proposals/templates` | Modelos comerciais reutilizáveis com seções e itens pré-configurados. |
| `/proposals/:proposalId` | Workspace de trabalho da proposta com 4 abas (Editor de Seções, Precificação & Serviços, Aprovações & Versões, PDF & Compartilhamento). |
| `/proposals/:proposalId/export` | Página de geração e download do PDF oficial. |
| `/p/:publicToken` | Rota pública autônoma (fora do AppLayout) para apresentação interativa ao cliente final. |

---

## 2. Modelo de Dados

### Tabelas PostgreSQL / Supabase
1. `agency_services`: Catálogo de serviços padronizados da agência.
2. `proposals`: Entidade principal da proposta comercial.
3. `proposal_sections`: Seções estruturadas da proposta (Capa, Apresentação, Diagnóstico, Objetivos, Escopo, Entregáveis, Cronograma, Investimento, Termos, Encerramento).
4. `proposal_items`: Itens e serviços vinculados à proposta.
5. `proposal_pricing`: Totais financeiros calculados no backend em centavos inteiros.
6. `proposal_templates`: Modelos comerciais reutilizáveis.
7. `proposal_versions`: Snapshots imutáveis de versão.
8. `proposal_approvals`: Histórico de aprovações internas da equipe.
9. `proposal_public_links`: Tokens seguros com hash SHA-256 para acesso externo.
10. `proposal_events`: Auditoria de eventos comerciais.
11. `proposal_exports`: Registro de exportações em PDF.

---

## 3. Segurança & RLS

- **Políticas RLS ativas em todas as 11 tabelas**.
- **6 Novas Permissões Cadastradas**: `proposals.delete`, `proposals.publish`, `proposals.manage_templates`, `proposals.manage_services`, `proposals.manage_pricing`, `proposals.manage_public_links`.
- **RPC `get_public_proposal(p_token text)`**: Consulta pública segura usando hash SHA-256 sem expor o banco de dados.
- **RPC `submit_public_proposal_feedback`**: Registra decisão (aceite, recusa, negociação) do cliente com auditoria.
