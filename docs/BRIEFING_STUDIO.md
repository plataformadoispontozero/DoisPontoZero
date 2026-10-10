# DOIS.ZERO — BRIEFING STUDIO ARCHITECTURE (FASE 06)

## 1. Visão Geral

O **Briefing Studio** é o módulo operacional de captura padronizada de demandas criativas do **Dois.Zero Creative Agency OS**. Ele substitui briefings fragmentados via e-mail ou mensagens instantâneas por um fluxo profissional, seguro e integrado com formulários dinâmicos, links públicos White Label, versionamento imutável e exportação em PDF editorial.

---

## 2. Rotas do Módulo

| Rota | Descrição | Escopo de Acesso |
| :--- | :--- | :--- |
| `/briefings` | Dashboard principal com KPIs reais, filtros por status e listagem | Autenticado (AppLayout) |
| `/briefings/templates` | Biblioteca de modelos de briefing oficiais e personalizados | Autenticado (AppLayout) |
| `/briefings/templates/new` | Form Builder visual (editor em 3 colunas) | Autenticado (AppLayout) |
| `/briefings/templates/:templateId/edit` | Edição e versionamento de modelos existentes | Autenticado (AppLayout) |
| `/briefings/new` | Fluxo guiado em 5 etapas para criação e vinculação de briefing | Autenticado (AppLayout) |
| `/briefings/:briefingId/responses` | Painel de visualização de respostas, auditoria e aprovação | Autenticado (AppLayout) |
| `/briefings/:briefingId/export` | PDF Studio — personalização White Label, prévia e download | Autenticado (AppLayout) |
| `/b/:publicToken` | Formulário público mobile-first para preenchimento pelo cliente | **Público (Sem autenticação requerida)** |

---

## 3. Modelo de Dados & PostgreSQL (Migration 20261010000004)

O módulo introduz 10 tabelas relacionais com integridade referencial estrita e triggers para `updated_at`:

1. `briefing_templates`: Catálogo de modelos com categorias criativas (`branding`, `social_media`, `motion`, `audiovisual`, `paid_media`, `campaign`, `general`, `custom`), controle de versão incremental e status (`draft`, `published`, `archived`).
2. `briefing_sections`: Seções ordenadas do questionário.
3. `briefing_questions`: Perguntas tipadas (`short_text`, `long_text`, `single_choice`, `multiple_choice`, `date`, `number`, `url`, `email`, `file_upload`) com validações e identificador semântico (`question_key`).
4. `briefings`: Instâncias de briefing vinculadas a uma agência, cliente (`clients.id`) e template com versionamento registrado.
5. `briefing_answers`: Respostas estruturadas em JSONB com constraint única `(briefing_id, question_id)`.
6. `briefing_public_links`: Links de preenchimento protegidos. **Tokens em texto puro nunca são armazenados** — persiste apenas o hash SHA-256 criptográfico (`token_hash`), com contagem de submissões (`submission_count <= max_submissions`) e expiração (`expires_at`, `revoked_at`).
7. `briefing_attachments`: Metadados de arquivos e anexos vinculados a perguntas e armazenados no Supabase Storage.
8. `briefing_versions`: Snapshots imutáveis de briefings submetidos para garantia jurídica e histórico de escopo.
9. `briefing_exports`: Registro de PDFs gerados com snapshot do branding da agência no momento da emissão.
10. `briefing_activity`: Trilha de auditoria das ações realizadas sobre o briefing.

---

## 4. Segurança & Row Level Security (RLS)

- **Isolamento Multitenant:** Todas as consultas internas exigem associação à agência via `public.is_agency_member(agency_id)`.
- **Controle de Permissões no Backend:** Operações administrativas utilizam `public.has_agency_permission(agency_id, 'briefings.create')`, `briefings.manage_templates`, etc.
- **Formulário Público Seguro (RPC):**
  - O endpoint público não expõe IDs internos nem políticas RLS públicas com permissão SELECT irrestrita.
  - A função `public.get_public_briefing(p_token_hash)` valida status, expiração e limites do link antes de retornar exclusivamente os dados necessários ao preenchimento.
  - A função `public.submit_public_briefing(p_token_hash, p_answers)` executa a persistência de forma atômica e transacional.

---

## 5. Form Builder Visual

Desenvolvido para máxima ergonomia e conformidade de acessibilidade:
- **Painel Esquerdo (Paleta):** 9 tipos de perguntas suportadas com ícones semânticos e descrições de uso.
- **Área Central (Canvas):** Seções e perguntas com botões de reordenação (subir/descer), duplicação rápida e exclusão.
- **Painel Direito (Inspetor de Propriedades):** Configuração de rótulo, chave semântica, descrição, obrigatoriedade, opções (para múltipla escolha) e placeholders.
- **Prevenção de Perda de Dados:** Indicador visual de alterações não salvas e modal de pré-visualização em tempo real.

---

## 6. Integrações Futuras: Strategy Studio & Proposal Studio

As perguntas possuem `question_key` padronizadas que mapeiam diretamente para:
- `StrategyBriefingExtraction`: Extrai objetivos centrais, público-alvo, posicionamento, tom de voz, concorrentes e referências visuais sem depender de parsing de PDF.
- `ProposalBriefingExtraction`: Extrai escopo, entregáveis solicitados, prazos desejados e orçamento para montagem automática de propostas comerciais.
