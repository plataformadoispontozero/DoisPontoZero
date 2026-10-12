# Arquivos de produção no Drive por demanda

Status: Ready for Review

## Resultado esperado
A equipe trabalha nos arquivos da demanda dentro do Dois.Zero, usando a conexão Google central, as pastas reais do cliente e o upload resumable existentes. Originais e previews permanecem no Drive; o banco guarda referências e metadados.

## Critérios de aceite
- [x] Modal/detalhe da demanda possui área Arquivos da produção, compartilhada por Design, Vídeo e Tráfego.
- [x] Backend resolve demanda → projeto/cliente → raiz autorizada, com autenticação e permissões operacionais, sem confiar em client_id/folder_id enviados pelo navegador.
- [x] Lista pastas reais e permite navegação interna, seleção e troca de destino, com referência da pasta salva na demanda e revalidada ao reabrir.
- [x] Sugere mês/ano a partir da campanha ou prazo da demanda, respeitando convenção existente; abertura/navegação nunca criam pastas.
- [x] Criação de pasta exige ação explícita, nome editável e confirmação; sucesso atualiza/seleciona pasta sem reload geral.
- [x] Integração e credenciais existentes são reutilizadas. Picker somente para autorização quando necessária; tokens centrais permanecem no servidor para usuários de produção.
- [x] Upload individual/múltiplo envia diretamente do navegador ao Google por sessão resumable, com progresso e erro/retry individual, sem original/base64 no banco ou proxy de arquivo inteiro pela Edge Function.
- [x] MIME/tamanho aceitos são declarados e validados no servidor; formatos não suportados têm mensagem explícita.
- [x] Metadados vinculam arquivo, pasta, cliente, demanda e usuário. Backend confirma arquivo final no Drive e pertencimento antes de gravar.
- [x] Preview leve WebP de imagem/poster de vídeo é referência do Drive; falha de preview preserva original enviado e tem fallback honesto.
- [x] Galeria abre preview na plataforma; Abrir no Drive é ação secundária. Kanban mostra contagem/preview leve sem carregar originais.
- [x] Pasta/arquivo de outro cliente, demanda sem acesso e membro inativo são bloqueados; reconexão/limite/pasta ausente têm mensagens úteis.
- [x] Aprovação editorial, status, Backlog/Briefados, ranking, SLA e atribuições não mudam nesta tarefa.

## Plano de QA
1. Testes SQL/RLS e handlers: isolamento agency/client/demand, referência de pasta, metadados sem binários, usuário atribuído/gestão, MIME/tamanho, arquivo final inválido e ausência de criação automática.
2. Testes de helpers: sugestão mensal/convenção, preview imagem/vídeo, fila com erro individual e retry.
3. E2E com APIs simuladas em desktop/tablet/mobile: abrir demanda, listar/navegar/selecionar pasta, criação explícita, multiupload e galeria; conferir requisições com demanda/pasta corretas e ausência de mutações ao abrir.
4. Gates finais: typecheck, lint, testes adequados e build; migração revisada, ACL/metadata e advisors após aplicar; push/deploy e bundle do domínio confirmados.
5. Teste real de upload requer sessão legitimamente disponibilizada e acesso ao Drive do cliente. Sem isso, registrar somente evidência automatizada/mocks e não afirmar envio real. Nenhuma credencial ou resposta privada será exposta.

## Limites e autorização
Usuário autoriza implementar e publicar a funcionalidade; pastas apenas por confirmação explícita. Sem novo OAuth, sem escrita no banco original e sem criação silenciosa. Importações históricas não fazem parte deste escopo. Testes não devem enviar arquivos a clientes reais sem destinatário/demanda definidos para homologação.

## Evidências
A preencher após implementação e verificação, distinguindo testes simulados de operações reais.

## Backend entregue
- [x] Cliente resolvido por `tasks.project_id → projects.client_id`, com agência e atribuição verificadas por RPC.
- [x] Pasta escolhida validada dentro da raiz real do cliente e da agência; atalhos recusados.
- [x] Pastas reais paginadas e destino memorizado sem criação automática; criação exige confirmação explícita.
- [x] Sessão resumable retorna apenas capability URL, sem token OAuth a profissionais.
- [x] `upload-finish` compara metadata real do Google com agência, cliente, tarefa, uploader, sessão, MIME, tamanho, nome, versão e pasta.
- [x] `task_attachments` reutilizada, com `storage_path=drive:<fileid>`; previews no mesmo registro.
- [x] Sessões ficam privadas e são acessíveis somente por RPC `service_role`; finalização idempotente e transacional.
- [x] Thumbnail/preview limitado a 2 MiB, assinatura de imagem validada; nunca baixa original de vídeo para um card.
- [x] Remover referência conserva original no Drive.
- [x] Mês editorial vindo da campanha real associada ao projeto; pasta salva removida retorna aviso e navegação na raiz.
- [x] 21 testes focados passaram: SQL/RLS, isolamento, metadata forjada, handler real, thumbnail e autorização central.

Arquivos backend: `supabase/migrations/20261012153834_task_drive_files.sql`, `supabase/functions/google-workspace/index.ts`, `taskDrive.ts`, `taskDriveHelpers.ts`, `src/features/drive/taskDrive.database.test.ts`, `taskDriveSecurity.test.ts`, `taskDriveHandler.test.ts`, `googleCentralAuthorization.test.ts`.

Sem teste de envio a uma conta Google real nesta etapa. Docs atuais Google Drive upload/metadata e Supabase RLS conferidas. Aplicação da migration e deploy coordenados por DevOps.

## Evidências finais
- 278 testes em 68 arquivos passaram, lint e build aprovados. Três E2E desktop/tablet/mobile passaram com APIs simuladas: abrir demanda sem criar pasta, confirmação explícita, dois PNG por upload direto e metadados da pasta correta.
- Migração `20261012153834_task_drive_files.sql` aplicada; Google Workspace v9 ACTIVE. Sessões privadas com RLS, contexto negado a anon e finalização negada a authenticated. Conexão central existente preservada.
- Advisors sem novos WARN; uma INFO adicional da tabela privada sem políticas é bloqueio por padrão intencional.
- Preview indisponível usa mensagem e preserva original. Formatos declarados incluem imagens/vídeos suportados, PDF, PSD, AI e ZIP; arquivos até 500 MiB, previews até 2 MiB.
- Testes reais de Designer/Videomaker, envio de PNG/MP4 e destino Google permanecem pendentes porque não foi disponibilizada sessão legítima de usuário. Nenhum arquivo/pasta foi enviado/criado em cliente real. CodeRabbit indisponível.
- Relatório detalhado: docs/DEMAND_DRIVE_IMPLEMENTATION.md.
