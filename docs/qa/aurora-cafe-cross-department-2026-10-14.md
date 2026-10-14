# Aurora Café — teste operacional em 14/10/2026

## Escopo e autorização
O usuário autorizou criar e manter o cenário fictício, publicar seus materiais, corrigir a sincronização de status das tarefas e implementar pop-up central, visão geral Social Media e Kanban por cliente. Autorizou também reunião, apresentação, proposta e aviso no chat da equipe.

Origem Lovable não alterada. Dados existentes de clientes reais não modificados. Nenhum e-mail, anúncio ou gasto externo efetuado. O aviso final solicitado é interno ao canal Dois.Zero.

## Registros mantidos
- Cliente: `d80253af-69ea-4d74-9224-24f39d8b2d61` — Aurora Café — TESTE FICTÍCIO.
- Briefing: `2019c9ee-4bcf-468d-9ad2-acb5229c9c9a`; sete respostas estruturadas; modelo dedicado de teste.
- Estratégia: `08004863-2b04-4a9f-9c3d-bf01f058b611`; novembro/2026, rascunho.
- Calendário: `665dc70a-c716-4f3c-99f3-d8ce05d4c133`; 2 posts e 1 carrossel com 5 lâminas.
- Projeto: `f1f42f39-2e8a-419f-aff2-765b4f691e41`; 3 demandas Design, 1 roteiro Videomaker e 1 plano Tráfego. As duas últimas são demandas manuais adicionais e não alteram a quantidade do calendário.
- Apresentação: `0a912e78-2285-4e2c-9928-e80214f18dc6`; 6 seções, 7 ilustrações demonstrativas, copies e direção visual; rascunho.
- Proposta: `200f14ac-b748-4f66-a8e0-855b81b5bc9f`; 4 seções e 3 itens; valores fictícios. R$1.200 recorrente + R$300 pontual; R$200 opcional excluído do total principal de R$1.500. Não é contratação nem cobrança.
- Reunião: `19d717ba-9c65-4319-a843-a62898bce73f`; 15/10/2026, 14h–14h30 Europe/Paris, três pautas; sem convite externo ou link Meet inventado.
- Demandas: 5 responsáveis vinculados ao projeto, 5 links, 5 comentários de teste e 5 checklists com 20 itens.

## Execução real no backend
Operações de criação e fluxo foram executadas no Supabase com contexto de administrador e role authenticated nas transações de teste. Aprovação/ajuste utilizaram a função pública e role anon. Isto não constitui validação de uma sessão real do navegador nem homologação dos papéis de todos os profissionais.

1. Gerado pelo motor atual com versão do repertório vigente 2. O erro inicial de versão 0 ocorreu na preparação do teste e foi resolvido usando o repertório real; não foi tratado como defeito do frontend, que já carrega essa versão.
2. Salvo rascunho com briefing e estratégia vinculados.
3. Confirmado bloqueio de produção antes da aprovação.
4. Simulado pedido de ajuste; revisão humana de títulos, legendas, cinco lâminas e direções distintas.
5. Salva nova versão e confirmada revogação do link antigo.
6. Simulada aprovação, depois acionada a produção canônica.
7. Confirmada idempotência: repetição da liberação não criou outro projeto ou outras três demandas Design.
8. Confirmada igualdade de copy entre calendário e descrição das demandas Design.
9. Responsável primeiro incluído no projeto, depois atribuído às tarefas; RLS corretamente recusou atribuição sem esse vínculo. Não se ampliaram permissões.
10. Encontrado bug: move_task alterava a coluna mas mantinha status open. Correção preserva os checks de permissão/mesmo quadro e histórico; não realiza backfill de tarefas reais.
11. Cinco demandas passaram por in_progress, review e done; completed_at conferido. Reabertura validada. Estado final demonstrativo: 1 concluída, 1 em produção, 3 em revisão, deixando a revisão final humana pendente nos checklists correspondentes.
12. Confirmado bloqueio de novo feedback depois da produção.

## Interface e arte
- Demandas abrem no diálogo central compartilhado, inclusive a partir de Social Media.
- Social Media inicia com todos os meses e mostra demandas de todos os clientes autorizados, agrupadas por ID de cliente; filtro opcional mantém os dados do cliente selecionado.
- As filas Design/Vídeo/Tráfego agrupam cards por cliente. Clientes com nomes iguais não são fundidos. Projetos sem cliente ficam identificados separadamente.
- Consultas de tarefas incluem a relação canônica projeto→cliente; sem segunda fonte de verdade.
- Apresentação pode renderizar URLs HTTPS de ilustrações de seção, sem criar referências falsas do Drive. URLs inválidas são descartadas e binários não são gravados no banco.
- Sete SVGs originais com textos, paleta creme/terracota e ilustração vetorial; página responsiva em `/testes/aurora-cafe/` com download e links para os registros.

## Verificação
- Versão candidata isolada: 355 testes passaram em 91 arquivos, com um worker. Verificações adicionais das últimas alterações passaram (12 testes focados e 7 testes de apresentação, sem somar duplicados ao total); typecheck passou após ajuste de tipagem do teste SQL.
- Teste SQL local da migration: status, conclusão/reabertura, mesmo quadro, permissão negada e histórico atômico.
- 8 testes Playwright passaram com API controlada: Social Media, Design, Vídeo e Tráfego em desktop/mobile. Não equivalem a login e escrita reais no navegador integrado.
- Artes: desktop 1440px e mobile390px; 7 imagens carregadas, sem overflow horizontal da página; inspeção visual da captura mobile.
- A suíte no checkout compartilhado teve uma falha no texto de Diagnóstico, ligada ao trabalho anterior não publicado. A versão isolada exclui essas alterações e passou integralmente.

## Limites
Upload real no Google Drive, métricas/veiculação Meta, captação/renderização real de vídeo e aprovação final por um cliente externo NÃO TESTADOS. Não se inventaram pastas, IDs Google, vídeos ou contas de anúncio. As ilustrações fictícias ficam no site; o banco guarda textos e URLs leves. A apresentação é uma revisão interna em rascunho; ilustrações de seção não são materiais Drive com aprovação individual.

## Publicação
Migration aplicada no Supabase: `20261014011725_synchronize_task_status_on_move.sql`. A versão foi gerada pelo MCP e espelhada no repositório; CLI local indisponível. Push/deploy concluídos.
- Commit funcional: `6013992`, branch `codex/master-audit-15-1`.
- Cloudflare Worker: `fc662efd-d71c-40b5-a559-95feb4a1d2b4`.
- Domínio entregou `/assets/index-BMnt2IaB.js`; HTML da galeria e SVG conferidos byte a byte contra o build.
- Aviso final enviado no canal Dois.Zero: mensagem `a3707896-5788-49c6-b862-8d540f12e6f3`, em 14/10/2026, 03h41 Europe/Paris.
- Checks finais: 7 respostas, 3 conteúdos, 5 demandas, 5 links, 5 checklists/20 itens, 2 retornos simulados e 3 pautas de reunião; todos os status das tarefas de teste correspondem à coluna.
- As alterações anteriores de outros módulos foram preservadas e excluídas do build. Nenhuma outra migration pendente foi aplicada nesta publicação.
