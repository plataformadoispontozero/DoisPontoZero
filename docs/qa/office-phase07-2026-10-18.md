# Escritório Digital — Fase 07 — 18/10/2026

## Escopo

Convites de voz privados entre membros autorizados do mesmo tenant, usando as salas LiveKit e notificações existentes. Aceitar/recusar, cancelar, expirar, estado ocupado/Não perturbe e retorno à sala anterior. Microfone continua desligado; câmeras não fazem parte desta fase.

## Verificações técnicas

- `office-invitations.database.test.ts`: 4 testes; cobre aceitar, tenant e acesso à sala, recusar, cancelar, expiração, aviso de chamada perdida, busy, Não perturbe, limite, RLS e anônimo.
- Suíte: `npm test -- --maxWorkers=2` — 132 arquivos, 488 testes aprovados.
- `npm run typecheck` — aprovado.
- `npm run lint` — exit 0; avisos existentes no repositório.
- Build de produção com flags de homologação ativadas — aprovado.
- Teste no worker autenticado: convite ao membro online apareceu em “Chamando”; cancelamento removeu o convite e restaurou a presença para “Disponível”. Não houve publicação de áudio.
- Dois usuários reais não foram conectados simultaneamente nesta sessão; aceitação real e conversa de voz continuam sem verificação humana observada.

## Supabase e publicação

- Migração `20261018230000_office_phase07_voice_invitations.sql` aplicada no projeto Supabase `doispontozero` (branch `main`, compartilhado pelos workers) e verificada: tabela existe, `authenticated` tem leitura condicionada por RLS, `anon` não tem SELECT. O ciclo de convite/cancelamento no worker confirmou RPCs.
- Versão inicial do worker: `a33c0e0a-b12e-4b18-84c6-1db0ef4fb7ec`; versão com painel atualizado: `c07dc8fb-bda4-4ba7-92e6-bc0b2140741d`.
- URL de revisão: https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev/office
- Produção não recebeu deploy e a flag `VITE_ENABLE_OFFICE_CALLS` permanece desligada no build de produção.

## Homologação

Homologação técnica do worker e do fluxo de envio/cancelamento concluída. O responsável autorizou homologar as fases; permanece registrada a limitação de que não observamos uma conversa de áudio entre duas contas reais. Testes automatizados cobrem aceite/recusa/expiração e autorização da sala.
