# DOIS.ZERO — Presentation Studio Documentation

O **Presentation Studio** é o módulo do Dois.Zero para criação, organização e apresentação de relatórios de entregas criativas, apresentações de marca, peças de redes sociais e mídias de vídeo para clientes.

---

## 1. Funcionalidades Principais

- **Templates Editoriais**:
  - *Social Media Monthly Showcase*: Focado em entregas de feed, reels, carrosséis e métricas operacionais.
  - *Creative Deliverables & Branding*: Focado em manual de marca, paleta de cores, tipografia e aplicações visuais.
- **Wizard de Criação (4 Passos)**:
  1. Seleção do Cliente.
  2. Definição do Período de Referência (Mês/Ano).
  3. Título e Descrição da Apresentação.
  4. Escolha do Template Inicial de Seções.
- **Workspace Editorial (4 Abas)**:
  - **Builder de Seções**: Adicionar, editar, reordenar seções (Capa, Visão Geral, Objetivos, Entregáveis, Galeria, Vídeos, Resultados, Insights, Próximos Passos).
  - **Preview Interativo**: Visualização responsiva em modos Desktop, Tablet e Mobile.
  - **Publicação & Tokens**: Controle de rascunho vs. publicado, geração de links públicos tokenizados com data de expiração opcional.
  - **Histórico de Versões**: Registro de snapshots imutáveis das versões aprovadas pelo cliente.
- **Geração de PDF Editorial**:
  - Exportação usando `@react-pdf/renderer` com capa personalizada, marca d'água da agência e layout profissional.

---

## 2. Rotas Registradas

- `/presentations`: Painel principal do Presentation Studio.
- `/presentations/new`: Wizard de criação de apresentações em 4 passos.
- `/presentations/:presentationId`: Workspace completo da apresentação.
- `/presentations/:presentationId/export`: Tela de exportação de PDF editorial.
- `/showcase/:publicToken`: Visualização pública interativa e independente (para clientes finalizarem sem login na plataforma).

---

## 3. Integração com Google Drive

Peças e materiais armazenados e organizados nas pastas do Google Drive podem ser vinculados diretamente às seções da apresentação sem upload redundante. Os links públicos e thumbnails são renderizados de forma limpa.
