# Fechamento por fases da plataforma web — 14/10/2026

Cliente de referência: **Aurora Café — TESTE FICTÍCIO**. Escopo das salas confirmado pelo usuário: chat, presença da equipe e acesso às reuniões. Apps nativos assinados e chamadas de áudio/vídeo nas salas ficam fora desta entrega web.

## Entregas deste pacote

- Permission Studio grava alterações por transação; OWNER protegido e rejeição atômica de papéis/células inválidas. Cache/draft isolados por agência e usuário.
- Configurações institucionais aguardam os dados reais. Contato, telefone, site e horário deixam de ser exemplos sem persistência. Identidade e preferências são salvas juntas; falhas desfazem o conjunto.
- Preferências e branding de documentos estavam sem registros na agência. Defaults foram inseridos apenas para registros ausentes, sem sobrescrever dados salvos.
- Reuniões gravam pauta, ata, decisões e ações em transação, verificam concorrência e protegem atas finalizadas. Conversão de ação cria uma tarefa apenas uma vez, com responsável real. A sobrecarga antiga de quatro parâmetros foi retirada do acesso público.
- Salas permitem presença, mensagens, acesso às reuniões e seleção de material do Drive central por cliente/pasta. Mensagem e metadados são gravados juntos após validação Google; nenhum binário é salvo no banco.
- Eventos de aprovação/ajuste/produção de calendário, cadastro de cliente e início de produção geram notificações persistentes para destinatários autorizados. Sons usam apenas notificações da agência e usuário atuais.
- Aniversários têm rotina privada agendada por hora. O fuso vem da agência; a chave anual evita avisos repetidos. Há execuções automáticas `succeeded` confirmadas no `cron.job_run_details`.
- Controles de acesso consultam agência ativa, vínculo ativo e papel da mesma agência. Revogação de Chat e Estratégia também vale no banco. Policies restritivas protegem leitura e escrita direta de Estratégia, preservando as policies existentes.
- Ranking, snapshot de desempenho e progresso de projeto tiveram funções antigas protegidas por permissões e escopo. Acesso anônimo a operações internas foi retirado.
- O módulo de Propostas permanece removido. RPCs antigas de leitura pública, feedback, criação e edição foram desativadas; os registros históricos permanecem no banco.
- Logout só confirma sucesso após resposta apropriada. O SDK atual remove a sessão local mesmo quando a revogação remota falha; nesse caso o login mostra que o servidor não confirmou a revogação.
- Diagnósticos distinguem entregas publicadas, testes controlados, verificações reais delimitadas e aceite operacional. Pendências de uma fase não são descartadas ao acrescentar uma entrega.

## Verificação e limites

Regressão final: **404 testes em 110 arquivos**; typecheck e lint sem erros (avisos legados mantidos). Build de produção registrado após o gate de publicação. Navegador: **76 cenários únicos** em desktop e celular; **18 páginas de Configurações** abertas e recarregadas em cada viewport. As APIs desses cenários são controladas e não comprovam OAuth, SMTP, Meta nem dois usuários humanos simultâneos.

Banco remoto, com contexto `authenticated` e transações com rollback:

- Alteração da matriz de um papel não OWNER persistiu e foi desfeita.
- Agência correta permitida; agência estrangeira negada.
- Criação de reunião, gravação de ata, criação de ação e conversão idempotente em tarefa passaram.
- Identidade/telefone/preferências persistiram e foram desfeitos.
- Movimento de tarefa manteve o status correto após endurecimento das ACLs.
- Revogação de permissões mudou Chat e Estratégia de permitido para negado; SELECT/RPC de diretório retornaram dados ocultos com o papel sem permissões.
- Propostas antigas não podem ser chamadas por `anon`/`authenticated`.

As fixtures persistentes Aurora existentes foram mantidas. Testes adicionais de matriz, reuniões e configurações usaram rollback. Nenhum anúncio foi criado, nenhum material foi publicado em rede social e nenhum aviso adicional foi enviado manualmente ao chat da equipe.

Google Workspace: Edge Function **versão 11, ACTIVE**; dependências publicadas comparadas com a versão anterior. Todos os arquivos preexistentes são iguais, exceto o entrypoint que inclui as ações novas de chat. Mantido `verify_jwt=false` da versão anterior para callback OAuth; POST valida usuário com `auth.getUser()` e permissões atuais antes de acessar Google.

## Segurança

Os avisos de `function_search_path_mutable` foram eliminados. Operações internas não têm EXECUTE anônimo. Restam endpoints públicos intencionais de briefing/branding/editorial/apresentações, funções autenticadas com guardas e tabelas privadas sem policies para negar acesso direto; a ausência de policies nessas tabelas não é motivo para abri-las.

O advisor aponta **proteção de senhas vazadas desativada no Auth**. Essa configuração não é alterável pelas ferramentas de gestão disponíveis nesta sessão. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Pendências de aceite

1. Aurora foi escolhido para Meta; nenhum cliente possui conta de anúncios vinculada. Autorizar leitura Meta e vincular uma conta real antes de validar campanhas reais.
2. Conector central Google cadastrado, mas envio/leitura de arquivo privado real entre dois membros ainda requer sessão autorizada e pasta do cliente.
3. SMTP, recuperação e cadastro/aprovação/login de dois membros com recebimento real de e-mail.
4. Aceite diário da equipe para Kanban, editorial, notificações e reuniões; testes controlados não substituem uso real.
5. Ativar proteção de senhas vazadas do Supabase; verificar backup/restauração e desempenho sob carga real em ambiente isolado.

Não há evidência para declarar `production_ready=true` ou toda a plataforma 100% homologada.
