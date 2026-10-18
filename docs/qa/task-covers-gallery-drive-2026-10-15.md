# Capas, apresentação, rotas e escrita no Drive — 15/10/2026

## Solicitações

Preview do post no card e seleção da capa do carrossel; apresentação navegável por setas/arraste, somente Aprovar/Reprovar com motivo; Kanban por clientes, retirada do quadro antigo acessível via Social Media; corrigir bloqueio para criar pastas e enviar arquivos.

## Implementação e limites

Reutiliza ClientKanbanBoard (clientes recolhidos por etapa), anexos de produção, task-drive-preview e autorização por demanda. RPC de capas em lote retorna somente anexo autorizado: primeira imagem como padrão ou escolha persistida pela equipe. Tabela nova guarda referências, sem bytes ou permissões amplas. Atualizar capa exige tasks.edit e acesso à demanda; frontend não escreve diretamente na tabela. Seleção ocorre em Arquivos → Usar como capa do card. Preview aparece no card expandido e no detalhe da demanda. Upload dos originais permanece no Drive.

Galeria por seção mostra uma imagem por vez com setas, teclado e gesto horizontal. Cada material mantém aprovação, reprovação e observação próprias. Retornos antigos changes_requested continuam no histórico, sem botão novo para solicitá-los. A reprovação exige motivo. Nenhuma avaliação real foi enviada nos testes.

As rotas do quadro antigo não carregam mais ProjectWorkspacePage. URLs legadas redirecionam a gestão ao Kanban agrupado e outros membros às Tarefas, sujeitos às permissões existentes. Social Media mantém calendário e demandas por cliente; link para quadro antigo removido. Nenhum projeto foi excluído.

Criação e envio agora abrem Google Picker quando necessário e reconsultam o destino antes de continuar. Conta sem canAddChildren recebe orientação de acesso Editor. Não foram ampliados escopos OAuth nem removidas validações isAppAuthorized/ancestralidade. Projeto do Picker divergente do cliente OAuth é recusado. O erro 403 deixa de apagar a explicação específica do servidor.

Os screenshots comprovam bloqueio de autorização de escrita, mas não identificam isoladamente se falta seleção no Picker ou acesso Editor da conta. Essa confirmação depende da sessão real do responsável. Não declarar upload real aprovado sem esse teste.

## Validações

- Migração aditiva 20261015152642_task_card_covers.sql aplicada; RLS ativa. Anônimo sem leitura/execução; authenticated sem escrita direta. Funções públicas SECURITY INVOKER delegam a funções privadas com validação.
- Teste local PGlite: imagem da própria demanda, seleção persistida, fallback, bloqueio de anexo externo, usuário sem edição, outro usuário e anônimo.
- 488 testes do conjunto completo verificados após repetição isolada das suítes de banco afetadas por timeout; zero casos restantes com falha. Um teste adicional de preview/ciclo de vida de capa aprovado (489 casos no total).
- Tipos e lint aprovados (avisos preexistentes). Deno check aprovado.
- google-workspace v14 publicada; dez arquivos remotos conferidos byte a byte. Alteração funcional em taskDrive.ts; restante preservado, com ajuste prévio de whitespace em presentationMediaContext.ts.
- Fluxo de autorização testado com Picker simulado e escrita revalidada. Conta somente leitura não tenta criar pasta. Fila de upload preserva originais e continua após falha individual.
- Testes de navegador e verificação da apresentação real registrados no recibo final desta entrega.

Referências: https://developers.google.com/workspace/drive/api/guides/api-specific-auth e https://developers.google.com/workspace/drive/api/reference/rest/v3/files .

## Teste operacional necessário

Abra a demanda, aba Arquivos. Para criar pasta, confirme o nome e selecione a pasta exata no Google quando solicitado. Para upload, selecione os arquivos; conclua autorização se solicitada. Caso a conta central tenha leitura apenas, conceda acesso Editor a essa conta ou escolha outro destino. Depois de enviar, marque o arquivo como capa e confira o card. Não enviar senhas ou tokens.

Fase 06 do Escritório Digital continua em homologação por solicitação do responsável; Fase 07 não iniciada.

## Navegador

12 cenários aprovados (desktop/celular): imagem com miniatura expirada após reload, URL antiga para quadro agrupado, Social Media sem link antigo, avaliações por material persistidas após reload, ampliação e navegação por setas/arraste.
