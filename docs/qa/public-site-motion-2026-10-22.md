# Site público — controles de imagens e movimento

## Implementação

- Configuração existente `agency_public_sites.content` recebe campos opcionais de movimento; registros anteriores têm defaults compatíveis. Nenhuma migração é necessária.
- Hero: loop ou estática, duração de 15 a 180 segundos, enquadramento inteiro ou preenchimento; opacidade existente preservada.
- Logos: loop automático, sentido normal/inverso ou estático, duração de 10 a 120 segundos. Sem botão Play. Movimento pausa em hover/foco; o visitante pode desligá-lo com a opção Movimento.
- Equipe: preto e branco inicialmente; cor por hover, foco e alternância por toque/clique.
- Editor: prévia maior de imagem, ordem de peças e materiais por setas, identificação Hero/Portfólio e prévia usando o rascunho atual.
- Movimento reduzido do sistema prevalece sobre animação configurada.

## Evidência e limites

- `npm run typecheck` concluído sem erros.
- `git diff --check -- src/features/public-site` sem problemas.
- Nenhum teste ou build executado nesta frente. Validação visual em navegador, persistência real e publicação ficam para integração.
- Nenhuma imagem, logo ou conteúdo real foi alterado. Upload continua PNG/JPG/WebP de até 2 MB, conforme limite existente do bucket; até 12 peças e 20 materiais por peça. Ordem é aplicada à lista existente, sem criar material fictício.

## Integração em 23/10

Build integrado aprovado. Configurações publicadas exibem efeito e duração das logos, com as logos reais preservadas; evidência /private/tmp/public-site-logo-controls.png. Nenhuma velocidade/imagem/conteúdo real foi sobrescrito na conferência. Persistência dos novos controles usa o JSON existente, mas não houve salvamento de novo valor de velocidade durante esta conferência. Ajustadas cores das abas ativas para o destaque da agência e contraste no modo claro.
