# Fechamento frontend — apresentação ampliada — 22/10/2026

## Falha constatada no código

`PresentationMedia` abria um diálogo isolado para cada arte, sem conhecer os demais materiais. Setas e arraste navegavam apenas na galeria subjacente; dentro da imagem ampliada não havia navegação.

## Correção

- Galeria compartilhada de imagens ampliadas nos layouts Post, Carrossel e slideshow.
- Botões anterior/próximo, setas do teclado e gesto horizontal com mouse/toque, com retorno circular.
- Carrossel preserva ordenação numérica natural dos nomes.
- Gestos verticais e cancelados não mudam a imagem; setas da ampliação não propagam para o carrossel externo.
- Reels e pastas ficam fora da sequência de imagens. Seus componentes existentes são preservados.
- Imagem original é solicitada apenas ao ampliar; preview existente serve de fallback enquanto carrega. Usa o contrato de autorização e cache já existente.
- Aprovações continuam vinculadas aos cards e IDs originais; a navegação não grava decisões.

## Evidência automatizada

- `npm test -- src/features/presentations/PresentationPreview.test.tsx --maxWorkers=1`: 16 testes aprovados.
- `npx tsc -b --pretty false`: aprovado, sem saída de erros.
- `git diff --check`: aprovado.

## Limites

Sem build, deploy ou commit nesta frente. Sem leitura/upload real no Drive, teste físico de toque, avaliação de leitor de tela ou medição de desempenho. A validação automatizada não equivale à homologação desses itens.
