# Drive e Meta na operação de produção

Status: Ready for Review. Homologação externa pendente de credenciais e autorização.

## Escopo aprovado
Conectar Google e Meta na central de integrações. Enviar imagens/vídeos de produção diretamente para pasta do cliente. Administrador configura as credenciais pelo formulário da plataforma; segredos nunca são devolvidos ao navegador.

## Critérios
- [x] Backend Drive lê cliente via RLS e valida pasta autorizada, sem tornar arquivos públicos.
- [x] Sessão de upload resumível, tipos de mídia limitados, limite 500 MB; associação agency/client em appProperties.
- [x] Painel de materiais por cliente, progresso e cancelamento, listagem paginada e estados de erro.
- [x] Formulário seguro de credenciais por agência e provider, criptografia AES-GCM e RPC service-only.
- [x] OAuth Meta com estado hashed, uso único e 10 minutos; ads_read somente; nenhum acesso inventado.
- [x] Métricas Meta validam agência/cliente e conta de anúncios acessível.
- [ ] Homologar OAuth real depois que administrador informar credenciais e providers aceitarem os callbacks.
- [ ] Homologar pasta autorizada drive.file, upload real e aprovação protegida junto ao módulo de revisão.

## Arquivos
- supabase/functions/google-workspace/index.ts, drive.ts
- supabase/functions/_shared/googleWorkspace.ts, providerConfig.ts
- supabase/functions/connection-config/index.ts
- supabase/functions/meta-workspace/index.ts
- src/features/integrations/ClientDrivePanel.tsx, ProviderCredentialsForm.tsx, googleDrive.test.ts
- src/features/settings/GoogleWorkspacePage.tsx, MetaWorkspacePage.tsx, IntegrationsCenterPage.tsx
- Migration integration_provider_credentials aplicada em 20261012130848.

## Evidência e limites
Google documentos oficiais de scopes/drive.file e uploads resumíveis consultados. Meta manual OAuth docs indisponíveis no fetch, API versão confirmada no SDK oficial facebook/facebook-nodejs-business-sdk v26.0. Credenciais pendentes, logo nenhuma conexão externa é declarada validada. Sem alteração de OAuth escopo drive.file para acesso irrestrito ao Drive. Pastas legadas podem precisar ser autorizadas pelo Google Picker antes da leitura. Upload permite sessão privada de envio, jamais token OAuth persistido no navegador. Backend publicado pelo agente DevOps; frontend em publicação.

## Recuperação final — 12/10/2026
- [x] Credenciais configuráveis na plataforma; chave técnica gerada e armazenada somente no backend.
- [x] Arquivos do Drive enviados diretamente do navegador à sessão de upload Google; nenhum binário no banco.
- [x] Criação de pasta autorizada por cliente sem alterar pastas já vinculadas.
- [x] Materiais em Design/Vídeo e resultados Meta em Tráfego Pago com seleção real de cliente.
- [x] Revisão pública com token aleatório hashed, validade de 14 dias, arquivos privados e verificação de versão antes da aprovação.
- [x] Cinco migrations aplicadas; funções Google, Meta, configuração e revisão implantadas com autenticação própria.
- [x] Notificação de resposta implantada (20261012131204) e publicação frontend final.
- [ ] Homologação externa após configuração e autorização das contas pelo administrador.

Arquivos adicionais: src/features/integrations/ClientMetaPanel.tsx, MaterialReviewPage.tsx, materialApproval.database.test.ts; src/features/production/DepartmentPage.tsx; src/app/router/index.tsx; supabase/functions/drive-material-approval/index.ts; migrations drive_material_approval e drive_approval_notification; supabase/config.toml.
Limites: arquivos continuam privados no Drive; vídeos grandes precisam de teste real conforme limites de execução do plano Supabase. A prévia atual carrega o arquivo sob demanda no navegador. Nenhum arquivo foi enviado a uma conta real durante testes.

Gates locais finais: 184 testes em 48 arquivos, lint sem erros, typecheck e build aprovados. Revisão pública com resposta simulada e proteção de Meta/Design/Vídeo homologadas em desktop, tablet e celular, sem overflow. Nenhuma conta externa, upload ou mensagem real usados nos testes. Key server-only gerada; OAuth app credentials continuam pendentes. RPCs de segredos recusam anon/authenticated e aceitam somente service_role. Funções sem autenticação retornam 401 e preflight 204.

## Complemento: Google Picker
- [x] Autorizar a pasta legada vinculada ao cliente sem ampliar o escopo drive.file.
- [x] Formulário Google inclui API Key pública restrita ao Picker e número do projeto Cloud.
- [x] Sessão retorna access token do próprio usuário apenas em memória para a API oficial Picker, nunca refresh token/secret.
- [x] Seletor rejeita outro ID de pasta; perfil do cliente não é alterado pela seleção.
- [x] CSP permite somente hosts oficiais específicos para SDK/frame/conexão Picker.
- [x] Typecheck e cinco testes unitários (Drive e Picker) passaram.
- [ ] Seleção real pendente da configuração OAuth/API Key e habilitação Google Picker API.

Arquivos adicionais: src/features/integrations/googlePicker.ts; googlePicker.test.ts; public/_headers.

Google Picker preparado para autorizar pastas legadas com escopo drive.file; exige chave pública restrita e número do projeto Google no formulário. Token OAuth curto é usado somente em memória pelo seletor, sem refresh token ou Client Secret devolvido. Seletor e API recebem o cliente/agência autenticados; Design/Vídeo/Tráfego usam agencyId válido e sem seletores duplicados.
Gates do complemento: lint sem erros, typecheck/build e 186 testes em 49 arquivos; testes do seletor e da validação da pasta. Produção autenticada simulada em três viewports verifica query clients por agência UUID e consultas Drive/Meta com clientId/agencyId. Homologação real de Picker/OAuth continua pendente de credenciais e autorização. CodeRabbit indisponível.

Publicação final verificada em 12/10/2026: funcional 3f96a87; Cloudflare ae4dcac2-8e57-473d-b3e9-5d231a2a4185; bundle index-DhD6KgTg.js no domínio oficial e Workers. Google-workspace v6, connection-config v2, Meta v1, Drive review v3. CSP do Picker e upload confirmada em produção. Testes com sessão e dados simulados em produção passaram nos três tamanhos: clientes consultados por agência UUID, cliente selecionado enviado nas chamadas Drive/Meta, sem acessos reais às contas. API Cloudflare respondeu de forma transitória malformada na primeira tentativa; única repetição concluiu e a propagação foi verificada.
