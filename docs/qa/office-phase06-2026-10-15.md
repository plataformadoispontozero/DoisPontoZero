# Escritório Digital — Fase 06 — 15/10/2026

Fase 05 aceita explicitamente: “FASE 5 ACEITA , VAMOS PARA A FASE 6”.

## Escopo e reutilização

COMMAND 06: controles globais da conexão de voz já existente. OfficeMiniBar na AppLayout autenticada consome OfficeVoiceContext; não cria salas, sockets, dispositivos ou renderizadores de áudio. OfficeVoiceProvider e sua autorização de sessão/agência/permissão continuam os mesmos. Sem migrações, dependências novas ou alterações nas notificações.

Barra com sala, estado real, participantes, fala, ligar/desligar microfone, sair e atalho para /office. Áudio bloqueado mostra ação explícita; erro mostra retorno às salas. Reconexão desativa microfone e não mostra falantes antigos como ativos. Layout fixa controles acima da navegação móvel, respeita largura da sidebar e reserva espaço no conteúdo. Sobreposições da aplicação usam z-index superior.

A flag VITE_ENABLE_OFFICE_CONTROLS exige true e Escritório habilitado. Fase 06 ativa somente em homologação; produção continua com a flag desligada.

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

Builds reais aprovados. Homologação publicada com VITE_ENABLE_OFFICE_CONTROLS=true: versão 5d8c708c-25bd-418c-b175-6cae5f98ae57. Produção com VITE_ENABLE_OFFICE_CONTROLS=false: versão a43b1817-a25e-4b45-a1f1-4dc89ddd900f. Produção continua sem ativar os controles globais.

## Atualização de 18/10/2026

Typecheck, lint, build e 488 testes passaram nesta rodada. O teste humano de áudio contínuo entre duas contas não foi observado por esta sessão; o aceite do responsável está registrado separadamente e não é apresentado como validação de áudio.
