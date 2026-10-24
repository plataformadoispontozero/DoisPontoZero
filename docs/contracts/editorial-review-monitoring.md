# Monitoramento de revisão editorial

## RPCs

Todos os timestamps são ISO timestamptz do servidor. As funções internas exigem usuário autenticado e permissão da agência.

- `get_editorial_review_monitor(p_campaign uuid)`: exige `strategy.view`; retorna `generatedAt`, `sentAt`, `firstViewAt`, `lastSeenAt`, `online`, `expiresAt`, `revoked`, `total`, `approved`, `adjust`, `reviewed`, `trackingLabel`, `archivedAt`.
- `mark_editorial_review_sent(p_campaign uuid)`: exige `strategy.edit`; marca primeiro envio do link atual apenas após ação explícita. Não envia mensagem, não comprova entrega e não altera o primeiro timestamp em cliques repetidos.
- `set_editorial_campaign_archived(p_campaign uuid,p_archived boolean)`: exige `strategy.edit`; arquiva/restaura sem excluir conteúdo, revoga links, registra auditoria; restaura como rascunho. Bloqueia campanhas com projeto de produção. Links anteriores continuam revogados após restaurar.
- `touch_public_editorial_review(p_token text)`: retorna boolean, token válido e versão corrente; chamada a cada 30 segundos somente enquanto a página estiver visível. Escritas limitadas a uma por 15 segundos por link. Não registrar navegação de membros autenticados ativos da agência como cliente. Página anônima não permite diferenciar pessoas que compartilham o mesmo link.

## Semântica

- `generatedAt` vem de `monthly_editorial_shares.created_at`; gerar/copiar um link não marca envio.
- `firstViewAt` é o primeiro heartbeat externo; `lastSeenAt` é o mais recente. Não se infere leitura completa ou identidade nominal.
- `online` é presença agregada no link nos últimos 75 segundos e exige link ativo, não expirado e campanha não arquivada. Não representa número de pessoas ou confirmação de que estão olhando a tela.
- Resumo usa a última revisão de cada índice no link não revogado da versão atual. `reviewed` significa materiais respondidos/avaliados (aprovar ou ajustar), não visualizações de cada material. Após restaurar, links anteriores revogados não aparecem como link atual nem fornecem contagens. Aprovação global legada preenche todos os itens quando status está `approved`/`production`.
- `trackingLabel`: `Sem link`, `Link gerado`, `Em revisão`, `Aprovado`. Envios e visualizações têm timestamps separados; link expirado/revogado deve ter aviso específico na interface.
- Links gerados antes da implantação não recebem data de envio nem visualização retroativa inventada.
- Histórico de feedback e notificações existentes permanece intacto. O trigger `private.notify_calendar_transition` já emite `calendar_approved` ao entrar no estado aprovado; esta migração amplia o mesmo trigger, sem notificações duplicadas. Além de gestores e responsável pelo briefing, inclui o autor da primeira versão da campanha e o último membro que marcou envio explicitamente, desde que ainda sejam membros ativos com `strategy.view` na agência. Histórico sem autor identificável não recebe destinatário inventado.
- Acesso de heartbeat não coleta IP, fingerprint, nome, sessão individual ou dados do dispositivo.

## Implantação e limitações

Migração: `20261023112318_editorial_review_monitoring_archive.sql`. Não houve alteração de dados reais na implementação. As colunas são adicionais e nulas por padrão. Nenhum teste foi adicionado ou executado; revisão e aplicação remota ficam com o integrador.
