# Criação guiada do calendário editorial

## Pedido
Encurtar o formulário de criação e carregar automaticamente dados do cliente e briefing, mantendo quantidades de posts, reels, carrosséis, slides e cenas ajustáveis pela social media.

## Critérios e implementação
- [x] Quatro etapas navegáveis: cliente/briefing, direção, formatos/volume, revisão/geração.
- [x] Cliente selecionado carrega cadastro e briefing nativo mais recente.
- [x] Campos editados pela equipe sobrevivem à chegada tardia ou atualização automática do briefing.
- [x] Troca de cliente limpa direção anterior e vínculo de briefing.
- [x] Revisão mostra cliente, mês, objetivo, contagens, slides, cenas e duração.
- [x] Criação mantém motor, histórico, repertório e RPC de gravação existentes.
- [x] Campanhas salvas e botão duplicado removidos do formulário novo; workspace existente preservado.
- [x] Navegação, preenchimento automático, volumes e resposta tardia cobertos por testes.
- [ ] Gates completos e conferência visual final pela integração.

## Arquivos
- `src/features/editorial/MonthlyEditorialPage.tsx`
- `src/features/editorial/MonthlyEditorialPage.test.tsx`
- `docs/stories/editorial-guided-creation.md`

## Limites de validação
Os testes de interface usam respostas simuladas e não representam geração em sessão real de produção. A infraestrutura e as regras existentes de geração não foram substituídas.

## Publicação
Push/deploy concluídos: commit `7d11ad7`, Cloudflare `eb1f3cce-8a57-4363-988b-7a7b03665100`, bundle público `index-DkveCMNt.js` confirmado. Validação documentada em `docs/qa/strategy-editorial-work-rooms-2026-10-13.md`.
