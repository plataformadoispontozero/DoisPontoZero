# Escritório Digital — Fase 06 — 15/10/2026

Fase 05 aceita explicitamente: “FASE 5 ACEITA , VAMOS PARA A FASE 6”.

## Escopo e reutilização

COMMAND 06: controles globais da conexão de voz já existente. OfficeMiniBar na AppLayout autenticada consome OfficeVoiceContext; não cria salas, sockets, dispositivos ou renderizadores de áudio. OfficeVoiceProvider e sua autorização de sessão/agência/permissão continuam os mesmos. Sem migrações, dependências novas ou alterações nas notificações.

Barra com sala, estado real, participantes, fala, ligar/desligar microfone, sair e atalho para /office. Áudio bloqueado mostra ação explícita; erro mostra retorno às salas. Reconexão desativa microfone e não mostra falantes antigos como ativos. Layout fixa controles acima da navegação móvel, respeita largura da sidebar e reserva espaço no conteúdo. Sobreposições da aplicação usam z-index superior.

A flag VITE_ENABLE_OFFICE_CONTROLS exige true e Escritório habilitado. Na primeira homologação, a flag ficou desligada em produção; o rollout parcial da Fase 06 foi feito em 19/10/2026 e está registrado abaixo.

## Verificação

Resultados finais e recibo de deploy serão registrados nesta entrega. Testes de unidade/integração usam o controlador real com transporte LiveKit simulado; navegação cobre dez transições mais histórico, sem reconectar nem duplicar renderizador. Testes de interface no navegador usam uma fixture identificada com estado controlado, não áudio real. Troca malsucedida volta ao lobby; nova sessão não entra automaticamente; logout e revogação já encerram a conexão.

## Aceite do responsável e limite da validação humana

1. Dois membros entram na mesma sala em Safari/Chrome. Microfone desligado na entrada; ligar explicitamente.
2. Manter conversa e navegar por dez páginas entre Dashboard, Projetos, Tarefas, Agenda e Configurações. Conferir barra e voz contínuas, sem eco/duplicação.
3. Usar voltar/avançar, controlar microfone e sair pela barra fora do Escritório.
4. Recarregar: retorna ao lobby sem ligar microfone. Entrar explicitamente novamente.
5. Testar viewport estreito, menu/diálogos, falha de rede e recuperação; sair da conta encerra áudio e presença.
6. Em 18/10/2026, o responsável aceitou explicitamente a Fase 06 e autorizou continuar as fases seguintes.

Fechar navegador, suspender sistema ou recarregar encerra a sessão de mídia; a barra não promete conexão após esses eventos. Sem teste humano de continuidade, manter homologação pendente.

## Resultados técnicos

- 484 testes de regressão aprovados com dois workers em 18/10; zero falhas. Execução inicial em paralelo excessivo esgotou recursos de inicialização PGlite; repetição limitada passou integralmente.
- Typecheck e lint aprovados (avisos preexistentes).
- Layout desktop e celular aprovados; repetição isolada de celular passou em 14,3 s após timeout de abertura do navegador durante a execução pesada inicial.
- Capturas revisadas: barra acima da navegação inferior e controles de toque acessíveis. Fixture de UI identificada; sem declaração de teste humano de áudio.

## Publicação

Builds reais aprovados. Homologação publicada com VITE_ENABLE_OFFICE_CONTROLS=true: versão 5d8c708c-25bd-418c-b175-6cae5f98ae57. A versão de produção inicial usava VITE_ENABLE_OFFICE_CONTROLS=false (versão a43b1817-a25e-4b45-a1f1-4dc89ddd900f); rollout parcial posterior registrado abaixo.

## Atualização de 18/10/2026

Typecheck, lint, build e 488 testes passaram nesta rodada. O teste humano de áudio contínuo entre duas contas não foi observado por esta sessão; o aceite do responsável está registrado separadamente e não é apresentado como validação de áudio.

## Atualização de produção — 19/10/2026

Após o responsável mostrar que a plataforma pública ainda exibia a Fase 05, foi publicado o Worker `doispontozero` com `VITE_ENABLE_OFFICE_CONTROLS=true`, mantendo `VITE_ENABLE_OFFICE_CALLS=false` e `VITE_ENABLE_OFFICE_MEDIA=false`. Versão Cloudflare inicial `c6e43e38-8de7-45b8-8719-2fe835ddc72a`. A publicação seguinte atualizou o rótulo conjunto das Fases 06 e 07; versão atual `551c94e2-140d-4bc8-831e-0a43590ca925`. Verificação em `https://doispontozero.renatodesigner.com.br/office` confirmou “FASES 06 E 07 · EM HOMOLOGAÇÃO”. Convites privados e controles de mídia continuam desligados na interface pública.
