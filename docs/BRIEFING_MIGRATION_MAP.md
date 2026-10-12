# Auditoria de migração de briefings Lovable → Dois.Zero

Auditoria em 12/10/2026. **Somente SELECT na origem e destino. Zero gravações em banco neste trabalho. Migração definitiva e piloto aguardam apresentação do relatório e confirmação.**

## Fontes reais

| Fonte | Estrutura / vínculo | Quantidade | Situação |
|---|---|---:|---|
| public.briefings | 64 colunas; PK id; FK cliente_id → clientes.id; respostas distribuídas em colunas | 23 | 23 snapshots históricos existentes, conteúdo sanitizado idêntico à origem atual |
| public.briefing_historico | PK id; FK briefing_id → briefings.id; alterado_por, campo_alterado, valor_anterior, valor_novo, alterado_em | 554 | Não importado; 554 relacionados e mapeados; nenhum órfão |
| public.task_briefings | PK id; FK demand_id → demands.id; objetivo, formato, tema, publico, mensagem_principal, copy, cta, referencia, identidade, observacoes, completo, preenchido_por, created_at, updated_at | 0 | Estrutura descoberta, vazia |
| public.demands.briefing | Texto livre, demanda client_id; calendar_post_id e approved_snapshot | 326 | Preservados em 326 snapshots de demandas; não duplicar como briefing de cliente |
| public.calendarios.analise_pre_geracao | JSONB: estrategia_id, resumo_estrategia, datas_incluidas, pendencias | 91 | Contexto de estratégia, não respostas de briefing; preservado dentro dos 103 calendários históricos |
| public.clientes | Dados do negócio, audiência, responsáveis e Drive; entregaveis_contratados JSONB | 29 clientes com mapeamento no destino | Dados de cliente/contexto, não 29 briefings adicionais |

Pesquisa information_schema por brief/form/answer/respost encontrou as tabelas acima; metricas_performance e designer_hub_config possuem contadores/prazos, não respostas. As 64 colunas reais de briefings são listadas abaixo, em ordem original. Não foram assumidas tabelas inexistentes. Cabe ampliar consulta para novas tabelas caso a origem seja alterada depois desta auditoria.

## Destino atual e relações

- public.clients: id, agency_id, name, slug, logo_url, status, datas, profile JSONB. Relação antiga → nova já em profile.source_id (29 correspondências de clientes, 23 briefings ligados corretamente).
- public.client_legacy_records: id próprio, agency_id, client_id, source_project, source_kind, source_id, source_client_id, source_status, source_created_at, source_updated_at, payload JSONB, imported_at. UNIQUE(agency_id, source_project, source_kind, source_id). source_project identifica a origem Lovable, sem nova tabela duplicada.
- Existem **23 históricos de briefing, mas 0 formulários nativos** em public.briefings. A UI principal lista formulários nativos; isso explica por que histórico do cliente e lista principal divergem. O calendário já consulta históricos por cliente. Não confundir snapshot histórico com formulário ativo/aprovado.
- public.briefings usa template_id obrigatório, template_version, client_id, title, description, status, created_by/assigned_to → auth.users, datas submitted_at/approved_at. Respostas em briefing_answers(answer_value JSONB) ligadas a briefing_questions; perguntas com question_key, tipo, posição, seção e regras; templates versionados. Campos desconhecidos continuam em payload original.
- source_kind permite apenas briefings/estrategias_mensais/calendarios/demands/controle_videomaker; **554 históricos não podem ser gravados nessa tabela sem adaptação revisada**. Proposta futura: ampliar tipo para briefing_historico com RLS briefings.view, preservar briefing_id no payload e ligação pelo source_id, sem duplicar briefing.
- Não existe FK direto briefing → calendário na origem. demands.calendar_post_id é FK lógica de peça; não tratá-lo como calendário id sem mapa calendar_posts. Nenhuma demanda/calendário novo será criado por causa da migração.

## Mapeamento completo

| Origem Lovable | Destino existente / futuro proposto | Transformação |
|---|---|---|
| `id` (uuid) | client_legacy_records.source_id | UUID original; novo ID próprio independente. |
| `cliente_id` (uuid) | client_legacy_records.source_client_id → client_id | Mapear exclusivamente clients.profile.source_id; ambíguo/ausente vai para quarentena. |
| `criado_por` (uuid) | payload.criado_por; futuro briefings.created_by | 4 responsáveis antigos sem correspondência validada; manter UUID legado, não criar usuário. |
| `atualizado_por` (uuid) | payload.atualizado_por | Manter UUID e marcar pendência de responsável. |
| `nome_fantasia` (text) | payload.nome_fantasia; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `razao_social` (text) | payload.razao_social; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `segmento` (text) | payload.segmento; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `tempo_mercado` (text) | payload.tempo_mercado; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `descricao_negocio` (text) | payload.descricao_negocio; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `diferenciais` (text) | payload.diferenciais; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `produtos_servicos` (text) | payload.produtos_servicos; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `ticket_medio` (numeric) | payload.ticket_medio; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `faturamento_mensal` (text) | payload.faturamento_mensal; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `numero_funcionarios` (text) | payload.numero_funcionarios; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `unidades` (text) | payload.unidades; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `persona_descricao` (text) | payload.persona_descricao; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `faixa_etaria` (text) | payload.faixa_etaria; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `genero_predominante` (text) | payload.genero_predominante; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `classe_social` (text) | payload.classe_social; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `localizacao_publico` (text) | payload.localizacao_publico; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `dores_principais` (text) | payload.dores_principais; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `desejos_principais` (text) | payload.desejos_principais; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `objecoes_comuns` (text) | payload.objecoes_comuns; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `missao` (text) | payload.missao; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `visao` (text) | payload.visao; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `valores` (text) | payload.valores; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `tom_de_voz` (text) | payload.tom_de_voz; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `personalidade_marca` (text) | payload.personalidade_marca; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `palavras_proibidas` (text) | payload.palavras_proibidas; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `concorrentes` (text) | payload.concorrentes; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `diferenciais_vs_concorrentes` (text) | payload.diferenciais_vs_concorrentes; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `instagram` (text) | payload.instagram; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `facebook` (text) | payload.facebook; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `tiktok` (text) | payload.tiktok; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `youtube` (text) | payload.youtube; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `linkedin` (text) | payload.linkedin; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `site` (text) | payload.site; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `outros_canais` (text) | payload.outros_canais; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `seguidores_instagram` (integer) | payload.seguidores_instagram; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `bio_atual` (text) | payload.bio_atual; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `conteudo_que_funciona` (text) | payload.conteudo_que_funciona; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `conteudo_que_nao_funciona` (text) | payload.conteudo_que_nao_funciona; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `ja_fez_trafego_pago` (boolean) | payload.ja_fez_trafego_pago; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `plataformas_trafego` (text) | payload.plataformas_trafego; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `orcamento_trafego` (numeric) | payload.orcamento_trafego; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `resultados_anteriores` (text) | payload.resultados_anteriores; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `agencias_anteriores` (text) | payload.agencias_anteriores; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `o_que_nao_gostou` (text) | payload.o_que_nao_gostou; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `objetivo_principal` (text) | payload.objetivo_principal; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `objetivos_secundarios` (text) | payload.objetivos_secundarios; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `meta_leads_mes` (integer) | payload.meta_leads_mes; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `meta_faturamento` (text) | payload.meta_faturamento; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `prazo_resultados` (text) | payload.prazo_resultados; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `responsavel_cliente` (text) | payload.responsavel_cliente; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `contato_whatsapp` (text) | payload.contato_whatsapp; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `melhor_horario_contato` (text) | payload.melhor_horario_contato; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `dia_reuniao_mensal` (text) | payload.dia_reuniao_mensal; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `acesso_drive` (text) | Referência validada fora do campo acesso_* | Preservar somente URL HTTPS Drive/Docs após triagem; 0 URLs atuais válidas. |
| `acesso_canva` (text) | Referência validada fora do campo acesso_* | Preservar somente URL HTTPS Canva; 0 URLs atuais válidas. Credenciais excluídas. |
| `observacoes_gerais` (text) | payload.observacoes_gerais; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `status` (text) | source_status + payload.status | rascunho (16) → draft; completo (7) → submitted como proposta, nunca approved automático. |
| `percentual_preenchimento` (integer) | payload.percentual_preenchimento; futuro briefing_answers.answer_value | Preservar tipo/valor original; question_key igual à chave original em template legado versionado, ordem conforme schema. |
| `criado_em` (timestamp with time zone) | source_created_at + payload.criado_em | Preservar timestamptz; não substituir por now(). |
| `atualizado_em` (timestamp with time zone) | source_updated_at + payload.atualizado_em | Preservar; comparação antes de atualização. |

Histórico: id → source_id; briefing_id → payload.briefing_id e resolução pelo snapshot briefings.source_id; alterado_por → UUID legado pendente; campo_alterado/valor_anterior/valor_novo → payload intacto (sem segredos); alterado_em → source_created_at. Para task_briefings futuro, demand_id deve apontar ao source_id da demanda existente; sem match fica pendente, não cria demanda.

## Dry run real

| Indicador | Resultado |
|---|---:|
| Briefings origem | 23 |
| Briefings históricos destino | 23 |
| Idênticos, ignorar | 23 |
| Novo briefing a inserir | 0 |
| Conflitos detectados nos snapshots | 0 |
| Briefings sem cliente | 0 |
| Histórico origem | 554 |
| Histórico com cliente/briefing válido | 554 |
| Histórico ainda não migrado | 554 |
| Usuários antigos sem match validado | 4 |
| Links Drive/Canva válidos nos campos atuais de acesso | 0 / 0 |
| Alterações históricas de campo Link do Google Drive | 1 |
| Gravações executadas | 0 |

O relatório reconcilia 23 = 23 skip_unchanged e 554 = 554 ready. “Ready” indica relação resolvida, **não autorização de escrita nem schema pronto**. Responsáveis continuam pendentes até validação humana de identidade; não assumir que UUID ou nome igual seja conta equivalente.

## Arquivos de segurança e repetição

Backups privados fora do repositório: /Users/designer/Documents/Codex/2026-10-12/briefing-audit/. Contém lovable-briefings-backup.json (23 sanitizados), briefing-history-backup.json (554), destination-briefings.json, briefing-client-map.json, briefing-user-map.json (vazio até confirmação), briefing-migration-report.json. Não commitar respostas/PII.

Comandos offline reproduzíveis, sem conexão ou escrita no banco:

```sh
npm run briefing:audit -- --directory /Users/designer/Documents/Codex/2026-10-12/briefing-audit
npm run briefing:export -- --directory /Users/designer/Documents/Codex/2026-10-12/briefing-audit
npm run briefing:dry-run -- --directory /Users/designer/Documents/Codex/2026-10-12/briefing-audit
npm run briefing:verify -- --directory /Users/designer/Documents/Codex/2026-10-12/briefing-audit
```

O CLI não possui modo migrate nesta fase. O audit/verify valida backups capturados; não certifica conexão live nem anexos funcionais. Consultas SELECT reproduzíveis em scripts/migrate-briefings/source-audit.sql e target-audit.sql. Atualização do backup via ferramenta autenticada SELECT antes de qualquer futuro piloto.

## Segurança e riscos concretos

1. RLS dos históricos exige clients.view + permissão por tipo. Nativos usam is_agency_member no SELECT: **mais amplo que cliente autorizado solicitado**; revisar antes de materializar formulários nativos para social media/design/video. Não ampliar acesso nem mudar RLS sem piloto.
2. Links atuais de acesso não são automaticamente credenciais, mas nenhuma URL válida atual foi encontrada. Backup elimina campos acesso_* e segredos; referência válida, se existente, será preservada em nome seguro. Binários/Base64/chaves privadas não entram em banco/backup sanitizado.
3. Histórico tem uma alteração do Link Google Drive; não significa arquivo acessível. Nenhum PDF/imagem foi copiado; nenhuma permissão remota ou HTTP do anexo foi validada.
4. Quatro autores legados não mapeados. Preservar IDs, marcar migration_pending e não criar usuários nem atribuir admin atual como autor original.
5. Atualizações futuras exigem comparar fonte, snapshot, imported_at e edição local; o dry run marca qualquer divergência como conflict_review, sem overwrite automático. Snapshot histórico é somente leitura para equipe.
6. Dois estados antigos não comprovam aprovação do cliente. completo → submitted é proposta de normalização, sujeita à confirmação; status original permanece auditável. Nenhum link público/token antigo é migrado.

## Piloto proposto (não executado)

Cliente destino b006af7c-9719-4471-8d60-106101c14a67, origem 8fde80c6-307c-4cab-b6ad-96c0bbafb278, já visualizado pelo usuário. Após confirmação: comparar todas as respostas/datas/campo vazio/Unicode e responsáveis deste cliente; disponibilizar consulta renderizada com campos em ordem e histórico relacionado; testar clientes permitidos/negados e gestor/admin; preservar metadados/links sem download binário. Somente depois validar escopo e autorizar importação dos 554 históricos/restante. Não publicar nem executar a migração total automaticamente.

Referência de segurança consultada: https://supabase.com/docs/guides/database/postgres/row-level-security. Índice de changelog.md não pôde ser aberto pelo web devido content-type text/markdown; nenhuma feature nova Supabase foi implementada nesta auditoria.


## Reconciliação do backup fornecido pelo usuário

Arquivo adicional auditado: `/Users/designer/Downloads/backup-agencia-2026-10-12.json` (8.022.405 bytes), estrutura `{gerado_em, clientes:[...]}`. Conteúdo tratado somente como dados. **Nenhuma importação executada.**

| Categoria | Backup fornecido | Auditoria da origem | Payload sanitizado idêntico | Divergências de conteúdo |
|---|---:|---:|---:|---:|
| Clientes | 29 | 29 mapas validados no destino | 29 IDs resolvidos | Matching por ID legado, não nome |
| Briefings embutidos | 23 | 23 | 23 | 0 |
| Calendários embutidos | 102 | 103 | 102 | 0 nos IDs presentes; 1 ausente do arquivo |
| Demandas embutidas | 326 | 326 | 326 | 0 |
| Histórico de briefing | Ausente | 554 | Não aplicável | O arquivo não substitui a extração readonly do histórico |

Seis clientes têm `briefing:null`; não fabricar um briefing para preencher esse vazio. Não há IDs duplicados nos três tipos de documento. Nenhum cliente do arquivo está sem mapa validado no destino. Todos os 23 briefs do arquivo correspondem aos históricos já existentes; reimportar esse backup não produziria novos briefs nem faria aparecer formulários nativos automaticamente.

O backup contém 148 campos com nomes sensíveis (incluindo `token_aprovacao` e `acesso_*`, contagem não comprova credencial válida). Não copiá-lo para Git nem tratar o arquivo como payload administrativo direto. Comparação excluiu esses campos e não imprimiu conteúdo de respostas/credenciais. Não foram encontradas strings binárias `data:...;base64` nesta varredura. Arquivo bruto permaneceu em Downloads.

Relatório privado da reconciliação: `/Users/designer/Documents/Codex/2026-10-12/briefing-audit/provided-export-reconciliation.json`. Registra IDs faltantes e conflitos sem respostas. O único calendário ausente deve ser recuperado pela origem live, não eliminado do destino. Nenhuma nova fonte de briefing foi descoberta neste backup. O próximo passo continua sendo apresentação do dry run e confirmação do piloto, conforme o pedido completo.

## Conciliação do backup fornecido pelo usuário

Arquivo analisado em 12/10/2026: `backup-agencia-2026-10-12.json`, aproximadamente 8 MB. Leitura local; nenhuma importação ou inclusão do arquivo no Git. Comparação por UUID original e conteúdo normalizado/sanitizado, sem nomes como chave.

| Coleção do arquivo | Quantidade | Comparação com a auditoria |
|---|---:|---|
| clientes | 29 | Seis sem briefing |
| clientes[].briefing | 23 | UUIDs únicos, todos idênticos; nenhum extra ou ausente |
| clientes[].calendarios | 102 | Todos idênticos; um dos 103 calendários auditados ausente |
| clientes[].demandas | 326 | UUIDs únicos, todos idênticos; nenhum extra ou ausente |
| briefing_historico | Não incluído | Os 554 históricos exigem o backup separado da origem |

Usar apenas esse JSON perderia um calendário e todo o histórico de alterações de briefing. Não há conflito de conteúdo nas coleções comparadas. Relatório agregado privado: `/Users/designer/Documents/Codex/2026-10-12/briefing-audit/provided-backup-comparison.json`.

SELECT adicional: `audit_log` não tem entidade identificada como briefing nem registro associado por `entidade_id` a um briefing existente. Não foram encontrados nomes de chaves de briefing/resposta em `calendarios.conteudo_estruturado` nem `clientes.entregaveis_contratados`. Descrições ou estratégias não foram contadas como novos briefings. O histórico identificado continua sendo as 554 linhas de `briefing_historico`.

**Estado:** zero alterações na origem, zero importações definitivas no destino e piloto ainda sujeito à confirmação exigida no documento do usuário.
