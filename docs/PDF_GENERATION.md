# DOIS.ZERO — PDF STUDIO & EDITORIAL GENERATION (FASE 06)

## 1. Visão Geral

O **PDF Studio** do Dois.Zero é um motor de geração nativa de documentos PDF editoriais desenvolvido com `@react-pdf/renderer`. 

Diferente de abordagens baseadas em captura de tela (HTML-to-canvas / screenshot), o PDF Studio produz documentos vetoriais reais em conformidade com as normas gráficas de diagramação editorial para agências criativas.

---

## 2. Padrões de Diagramação Editorial

| Parâmetro | Especificação Implementada |
| :--- | :--- |
| **Formato** | A4 Vertical (`size="A4"`) |
| **Margem Superior** | 25mm (~70pt) para respiro do cabeçalho corrido |
| **Margem Inferior** | 20mm (~56pt) para respiro da numeração de páginas |
| **Margens Laterais** | 20mm (~56pt) esquerda e direita |
| **Tipografia** | Helvetica / Sans editorial com suporte a caracteres em português |
| **Cores** | Cores primárias dinâmicas da agência (White Label) |

---

## 3. Identidade Visual da Agência & White Label

### 3.1 Cabeçalho
- Posicionado no topo de todas as páginas de conteúdo (`fixed`).
- Logotipo oficial da agência centralizado horizontalmente com `objectFit: 'contain'` preservando as proporções originais do arquivo.
- Caso a agência não possua logotipo em imagem, exibe o nome institucional em tipografia sóbria com kerning expandido.

### 3.2 Marca-d'Água Centralizada
- Renderizada em segundo plano (`zIndex: -1`) em **todas as páginas do documento** (inclusive capa e páginas subsequentes).
- Utiliza o símbolo/monograma da agência.
- Aplicada com **5% de opacidade** (dentro da faixa exigida de 4% a 8%), garantindo proteção visual sem comprometer a legibilidade dos textos.

### 3.3 Capa Editorial
- Logotipo da agência centralizado no terço superior.
- Badge com categoria criativa da demanda.
- Título do briefing em destaque (26pt negrito).
- Nome e dados da conta do cliente.
- Bloco inferior com data formal em português, identificador do documento (`BRF-XXXXXXXX-VX`) e versão.

### 3.4 Rodapé Corrido
- Nome da agência e identificador do documento à esquerda.
- Paginação dinâmica à direita no padrão: `Página X de Y` (via hook de renderização do `@react-pdf/renderer`).

---

## 4. Arquitetura de Componentes Modulares

Os componentes foram desacoplados em conformidade com o Requisito 14:

```
src/features/briefing/pdf/
├── types.ts                        # Modelos e contratos de tipagem do documento
├── transformBriefingToPdfModel.ts  # Transformação e validação de dados em BriefingPdfModel
├── BriefingPdfCover.tsx            # Página de capa A4
├── BriefingPdfHeader.tsx           # Cabeçalho corrido
├── BriefingPdfWatermark.tsx        # Marca-d'água centralizada com 5% de opacidade
├── BriefingPdfSection.tsx          # Bloco de seção com barra de destaque colorida
├── BriefingPdfQuestion.tsx         # Bloco de pergunta e resposta com proteção contra quebra órfã
├── BriefingPdfFooter.tsx           # Rodapé corrido com paginação dinâmica
├── BriefingPdfDocument.tsx         # Documento raiz montado
└── generateBriefingPdf.ts          # Pipeline de geração para Blob, prévia e download
```

---

## 5. Pipeline de Execução & Auditoria

1. **Transformação:** A função `transformBriefingToPdfModel()` recebe o briefing do banco de dados e sanitiza respostas vazias (substituindo por `— Não informado —`), opções de múltipla escolha e datas.
2. **Validação:** Valida a presença de títulos e integridade antes do início da renderização.
3. **Geração:** `generateBriefingPdfBlob()` gera o arquivo binário em memória (`Blob`) sem poluir o DOM.
4. **Download & Auditoria:** `downloadBriefingPdf()` dispara o download no navegador e, quando conectado ao Supabase, grava o evento em `briefing_exports` e na trilha de auditoria `briefing_activity`.
