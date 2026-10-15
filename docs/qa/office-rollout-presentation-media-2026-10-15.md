# Escritório Digital em produção e recuperação de imagens — 2026-10-15

Solicitação: substituir a entrada Chat pelo Escritório Digital e corrigir imagens desaparecendo em apresentações publicadas.

## Implementação

Produção habilita o Escritório Digital por padrão, respeitando configuração explícita false. /chat redireciona para /office; /chat/messages e conversas existentes permanecem disponíveis. A publicação foi solicitada pelo usuário; não equivale ao aceite formal da Fase 05. Fase 06 não iniciada.

O Drive fornece thumbnailLink temporário. A mídia passa por autorização de sessão/permissão ou link público válido, com validação de apresentação, agência, arquivo e pasta. O servidor renova a autorização Google e retorna bytes da imagem. URLs e credenciais Google não são expostas. Limites de tamanho, tempo, domínio e formato são aplicados. Editor, apresentação pública e preparação do PDF usam a mesma leitura. Nenhum arquivo foi tornado público e nenhum dado real foi alterado.

## Evidências

- 478 testes de regressão aprovados em 130 arquivos.
- Typecheck e lint aprovados (avisos preexistentes).
- 7 testes específicos do contrato de mídia e autorização aprovados.
- 3 cenários de navegador aprovados: presença com duas sessões controladas, navegação Chat/Escritório e imagem com miniatura expirada após recarregar.
- Deno check e teste de protocolo aprovados.
- google-workspace v13 publicada; dez arquivos remotos conferidos byte a byte.
- Link público fornecido pelo usuário: apresentação mensal da Ambience, outubro/2026. Todos os seis materiais reais retornaram HTTP 200, image/png, entre 6.492.292 e 10.645.250 bytes, com acesso renovado ao Drive.
- Testes controlados não substituem aceite humano. Voz e presença com Safari/Chrome foram confirmadas pelo usuário anteriormente; aceite formal da Fase 05 continua pendente.

Referência técnica: https://developers.google.com/workspace/drive/api/reference/rest/v3/files (thumbnailLink temporário, acesso autenticado e uso por proxy).

Publicação frontend e verificação visual final registradas no recibo complementar desta entrega.

## Publicação e conferência final

Produção: versão Cloudflare `7e140b3f-7ffb-4053-ab38-75270e70cd78`. Homologação: `370e47d3-95f0-4d4d-905c-f7c91536f2fa`. HTML, chunks de navegação/diagnósticos/voz e políticas dos dois ambientes conferidos byte a byte contra builds isolados com configuração pública real.

No link público da Ambience, as seis imagens carregaram no Chrome em resolução 2880 × 3840, inclusive após recarregar a página. Foram doze respostas HTTP 200 para mídia em duas passagens, sem erros JavaScript. Nenhuma decisão de aprovação ou dado da apresentação foi alterado durante a conferência.
