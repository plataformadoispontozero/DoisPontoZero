# Jornada do cliente: Drive, briefings, estratégia e produção

Status: Ready for Review — gates finais e publicação em andamento.

## Solicitação e resultado esperado

A equipe deve encontrar os briefings guardados na pasta do cliente no Google Drive tanto na ficha desse cliente quanto na área principal de Briefings. A partir dessas informações, deve poder revisar o contexto, adaptar modelos de briefing, estruturar a estratégia e o calendário editorial e acessar apresentação, aprovação e produção pela mesma jornada. O documento original continua no Drive; a plataforma não transforma uma simples leitura em aprovação de conteúdo.

Esta story cobre os requisitos atuais. Não autoriza importar arquivos reais automaticamente, tornar materiais públicos, enviar mensagens, alterar a conta Google ou ampliar scopes OAuth. Publicação depende do fluxo de autorização já estabelecido na conversa; esta tarefa de arquitetura não faz push.

## Critérios de aceite

### Briefings do Drive, disponíveis nos dois caminhos

- [x] Na ficha do cliente, a área Briefings permite localizar documentos na pasta Drive já vinculada ao cliente e abrir os documentos originais.
- [x] A área principal Briefings mostra os mesmos registros vinculados, com cliente, título, tipo/origem, data e estado de revisão. Não cria cópias independentes para cada área.
- [x] Filtros, estados vazios, carregamento, erros e ações distinguem briefings nativos, documentos Drive e histórico importado. Falhas externas não são substituídas por dados de demonstração.
- [x] A navegação preserva o cliente selecionado nas próximas etapas, sem permitir leitura cruzada entre clientes ou agências.
- [x] Sincronização repetida é idempotente por agência/cliente/ID do arquivo. Identificadores da fonte nunca substituem IDs internos de clientes.
- [x] Atualização do arquivo sinaliza contexto pendente de nova revisão; não sobrescreve texto/contexto já revisado pela equipe.

### Leitura segura e contexto revisado

- [x] Backend autentica usuário, verifica permissões e cliente pela agência ativa e deriva a pasta de `clients.profile.drive_url`, sem aceitar pasta arbitrária enviada pelo navegador.
- [x] Conta Google central, pasta raiz e validação de descendência existentes são preservadas. Falta de consentimento, pasta fora da raiz ou arquivo inacessível interrompe a operação com mensagem útil.
- [x] Descoberta de subpastas é limitada, paginada e restrita aos descendentes da pasta deste cliente. Atalhos, ciclos e limites atingidos não autorizam acesso fora desse escopo.
- [x] Google Docs e arquivos textuais suportados podem fornecer uma prévia textual limitada. PDF e DOCX nesta etapa são links para o original com preenchimento/revisão manual do contexto; a UI informa que não houve extração automática desses formatos.
- [x] Nenhum binário, arquivo base64, token OAuth, URL de upload temporária ou segredo é persistido no banco ou logado no navegador. Somente metadados e texto/contexto limitado e revisado são armazenados.
- [x] Fonte, ID do documento, MIME, alteração do Drive e autoria/data da revisão permitem rastrear o contexto. Texto externo é dado não confiável e nunca instrução para executar ações.
- [x] Objetivo, público, posicionamento, tom, restrições e temas são campos revisáveis. Nenhum fato aprovado é criado automaticamente. Prévia ou sugestão de extração não equivale a fato confirmado.
- [x] Salvar contexto exige revisão explícita. Informação ausente fica indicada e não é inventada nem cortada silenciosamente.

### Modelos de briefing editáveis

- [x] A equipe autorizada pode criar e editar nome, descrição, seções, perguntas, obrigatoriedade, tipos, opções e ordenação de modelos.
- [x] Salvar um modelo existente não cria silenciosamente outro modelo sem informar a revisão.
- [x] Persistência é transacional: modelo, seções e perguntas não ficam parcialmente gravados quando uma etapa falha.
- [x] Briefings e respostas já usados preservam suas perguntas e versão. Editar um modelo em uso cria uma revisão identificada; não apaga perguntas referenciadas por respostas anteriores.
- [x] Permissões de leitura/edição de modelos e escopo da agência são aplicados no backend, além da visibilidade dos botões.

### Estratégia, calendário e entrega

- [x] A partir da ficha e da área principal, a equipe acessa estratégia e calendário com o cliente correto previamente selecionado.
- [x] Os campos revisados do briefing podem preencher a prévia da estratégia/calendário mediante ação explícita. A origem aparece e alterações existentes não são sobrescritas sem indicação.
- [x] Calendário exige entradas mínimas do motor atual e mantém distribuição, quantidades, histórico, antirrepetição, slides/cenas configuráveis e revisão antes de salvar.
- [x] Revisão de briefing não aprova automaticamente calendário, apresentação, materiais ou tarefas.
- [x] Jornada oferece acessos claros a apresentação, link de aprovação existente e áreas de produção pertinentes, preservando os controles de acesso e aprovação atuais.
- [x] Versão/contexto usado pelo calendário é identificável; mudança posterior na fonte não muda silenciosamente uma campanha já enviada ou aprovada.
- [x] Mobile e desktop permitem percorrer o fluxo e acessar todas as ações sem overflow ou controle inacessível.

## Arquitetura mínima proposta

1. **Uma origem canônica por documento.** Persistir referência vinculada a agência/cliente e arquivo Drive, com unicidade e metadados de versão. As duas telas consultam a mesma origem. Manter briefings nativos e registros históricos existentes; não converter documentos em respostas falsas de um formulário nativo.
2. **Descoberta explícita e delimitada.** Nova ação no backend Google reutiliza conexão central e validações existentes. Começa exclusivamente na pasta cadastrada do cliente. Percorre fila de subpastas com conjunto de visitados e limites de profundidade, arquivos, pastas e páginas. Ao atingir limite, retorna resultado parcial claramente identificado e permite continuação apenas com cursor vinculado ao mesmo cliente/escopo. Não seguir atalhos para pastas externas.
3. **Texto, não binário no banco.** Google Docs: `files.export` para `text/plain`; arquivos plain text: leitura de conteúdo com MIME permitido e limite de bytes. Verificar tamanho durante a leitura, não confiar somente em `Content-Length`. Limite de prévia explícito; documento maior deve ser aberto na origem e resumido/revisado manualmente. PDF/DOCX: referência privada + formulário manual, sem anunciar parsing, OCR ou extração inexistentes.
4. **Revisão separada da sincronização.** Metadados de sincronização e contexto aprovado pela equipe são estados diferentes. Contexto usa campos reconhecidos, referência à versão da origem e revisão explícita. Sugestões não alteram automaticamente perfil, briefing existente, estratégia ou fatos aprovados.
5. **Modelos com versões preservadas.** Rascunho ainda não usado pode ser editado transacionalmente. Modelo já utilizado recebe revisão com perguntas próprias; briefings anteriores continuam ligados à versão/perguntas anteriores. As rotas de edição devem mostrar se o salvamento atualiza um rascunho ou gera nova revisão.
6. **Reutilizar os fluxos existentes.** Estratégia/editorial recebem contexto revisado e cliente selecionado. Apresentações, revisão pública de materiais e produção continuam com suas próprias permissões e aprovações. Links de navegação não concedem privilégios extras.

Limites concretos de descoberta e tamanho devem ser definidos como constantes no backend, testados e mostrados quando excedidos. Não devem ser configuráveis pelo usuário comum para contornar as proteções. Cancelamento e continuação não podem aumentar o escopo da pasta autorizada.

## Achados de arquitetura na leitura do código

- `ClientBriefingsTab.tsx` e `BriefingPage.tsx` consultam atualmente briefings nativos; documentos Drive não têm uma referência canônica compartilhada entre esses caminhos.
- `google-workspace/index.ts` lista apenas filhos diretos da pasta do cliente em `client-drive-list`. A validação de raiz/descendência já existe e deve ser reutilizada; a descoberta de subpastas exige implementação explícita e limitada.
- O upload atual aceita imagens e vídeos. Documentos já existentes podem ser lidos sem ampliar essa whitelist de upload nesta story.
- `BriefingTemplateEditorPage.tsx` usa `useCreateTemplate` mesmo quando possui `templateId`. Isso não comprova edição de modelo existente e precisa ser corrigido.
- `useCreateTemplate` faz inserções em etapas no navegador; uma falha depois do modelo pode deixar uma criação parcial. Salvar o conjunto deve ocorrer em transação no backend.
- `useBriefingTemplate` inclui chave de cache por ID sem agência ativa e oferece modelos iniciais em memória antes de consultar banco. Revisar a chave/escopo para evitar mostrar cache de outra agência e distinguir modelo-base de modelo persistido.
- O calendário já possui uso explícito de contexto de briefing nativo e histórico importado. Estender essa entrada para documentos revisados é preferível a outro gerador independente.

Esses achados são leitura de código, não confirmação de exploit ou homologação de uma conta Google real.

## Verificação necessária

- [ ] Testes unitários de seleção de MIME, extração textual limitada, limites e descoberta paginada, ciclos, atalhos e pasta externa.
- [ ] Testes SQL de RLS/permissão, unicidade/idempotência, preservação de revisão e transação dos modelos.
- [ ] Testes de backend com respostas Google simuladas: erro de autorização, revogação, documento maior que limite e mudança de versão.
- [ ] E2E em desktop/tablet/mobile: mesmo briefing nos dois caminhos, revisão de contexto, edição de modelo e navegação até estratégia/calendário/apresentação/produção.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` e build aprovados; limites de mocks explicitados no relatório.
- [ ] Homologação externa de OAuth/pasta/documento real somente quando credenciais e autorização estiverem disponíveis, sem declarar mocks como integração real testada.

## File list

Atualizado nesta tarefa de arquitetura:

- `docs/stories/drive-client-briefing-journey.md`

Arquivos previstos para implementação/revisão (não alterados por esta tarefa):

- `supabase/functions/google-workspace/index.ts` e helpers de descoberta/leitura delimitada.
- Migration CLI de referências/contexto Drive e RPCs transacionais de modelos, com testes SQL correspondentes.
- `src/features/clients/components/ClientBriefingsTab.tsx`.
- `src/features/briefing/BriefingPage.tsx`, hooks, páginas de modelos e componentes de origem/revisão.
- `src/features/editorial/MonthlyEditorialPage.tsx`, helpers de contexto e integração com estratégia.
- Rotas/componentes da jornada e testes de navegação para apresentação e produção, conforme necessidade verificada.

## Evidência desta tarefa

Story criada após leitura dos caminhos atuais de cliente/briefings/modelos, schema nativo, motor editorial e escopo Google central. Nenhum código de aplicação, arquivo remoto, banco, conta Google, deploy ou push foi alterado nesta tarefa.

## Implementação e evidências

- Índice canônico `client_drive_documents`, metadados sincronizados pelo serviço e revisão estruturada por RPC com autorização, versão e autoria. O texto original lido permanece apenas em memória.
- Descoberta de subpastas limitada a 100 pastas/100 consultas/200 documentos, sem atalhos, com estado parcial explícito. Leitura Docs/TXT até 512 KiB; PDF/DOCX exigem leitura e contexto manual.
- Mesmo painel/index na ficha, Briefings e jornada. Calendário e estratégia conferem versão atual antes de aplicar contexto revisado. Nenhuma aprovação automática.
- Modelos usam RPC transacional, cópias identificadas por versão e idempotência. Modelos publicados iniciais preparados em SQL idempotente apenas para a agência atual.
- Cliente preservado em estratégia/apresentação e atalhos de produção; cache de apresentações separado por agência.
- Testes locais do índice/revisão: 8 testes SQL/UI aprovados; backend documentos: 12 testes aprovados. Mocks não comprovam acesso a documentos reais.
- Consulta mínima de produção confirmou existência de conexão central (sem ler credenciais). Não houve leitura real de documento Google nesta homologação.

### Arquivos implementados

- `supabase/migrations/20261012142837_client_drive_document_reviews.sql`
- `supabase/migrations/20261012142843_briefing_template_atomic_save.sql`
- `supabase/functions/google-workspace/documents.ts`, `index.ts`
- `src/features/briefing/driveDocuments.ts`, `DriveBriefingsPanel.tsx`, `BriefingPage.tsx`
- `src/features/briefing/DriveBriefingsPanel.test.tsx`, `driveDocuments.database.test.ts`
- `src/features/briefing/hooks/useBriefings.ts`, `constants/initialTemplates.ts`
- `src/features/briefing/templates/BriefingTemplatesPage.tsx`, `BriefingTemplateEditorPage.tsx`, testes de starter/transação
- `src/features/clients/ClientWorkspacePage.tsx`, componentes `ClientBriefingsTab`, `ClientHubModal`, `ClientPresentationsTab`
- `src/features/editorial/MonthlyEditorialPage.tsx`
- `src/features/strategy/NewStrategyPage.tsx`, teste
- `src/features/presentations/NewPresentationPage.tsx`, `hooks/usePresentations.ts`
- `src/features/production/DepartmentPage.tsx`
- `src/features/integrations/googleDriveDocuments.test.ts`
- `e2e/editorial-profile.spec.ts`

Artefatos de seed locais: `/Users/designer/Documents/Codex/2026-10-12/modelos-briefing-iniciais.sql`, `gerar-modelos-briefing.mjs`.

## Evidências finais de homologação

- 227 testes em 58 arquivos, lint sem erros e build de produção aprovados.
- Seis E2E em desktop/tablet/mobile: revisão do briefing espelhado, mesmo índice na ficha do cliente e contexto aplicado ao calendário; backend simulado.
- Migrações aplicadas: `20261012142837_client_drive_document_reviews.sql` e `20261012142843_briefing_template_atomic_save.sql`; Google Workspace v8 ACTIVE.
- Seis modelos publicados e 59 perguntas confirmados em produção; índice com RLS e RPCs sem execução anon. Advisors preservam avisos anteriores; save_client_drive_review é SECURITY DEFINER autenticado intencional, com autorização e versão verificadas.
- Há conexão central cadastrada, mas leitura real de documentos e OAuth não foram homologados nesta execução. CodeRabbit indisponível.
