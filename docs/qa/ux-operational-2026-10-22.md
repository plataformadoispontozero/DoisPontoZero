# UX operacional — painel, briefings, clientes e equipe — 22/10/2026

## Implementação

### Visão geral

- Removido card Status do Workspace, marca ativa, conectividade técnica e progresso de desenvolvimento. Esses assuntos continuam no diagnóstico técnico.
- Carga por setor usa tarefas reais autorizadas da agência e os prefixos canônicos já usados pela produção: Design, Videomaker, Social Media e Tráfego Pago.
- Exibe fila pendente, produção, atraso e ausência de responsável. Alertas são fatos de prazo/distribuição; não inferem capacidade humana nem produtividade individual sem uma configuração real.
- Consulta limitada; ao atingir1.000 tarefas informa o limite e orienta conferir a fila do setor. A ordem da amostra não é um ranking de membros.
- Tarefas/projetos arquivados não contam nos indicadores correspondentes. Progresso de projeto vem das tarefas concluídas, não é mais sempre0. Status exibido em português e campos ausentes recebem rótulo claro.

### Briefings

- Catálogo de criação possui exatamente seis serviços canônicos: Branding, Social Media, Motion, Audiovisual/Vídeo, Campanha e Tráfego Pago.
- Seleciona no máximo um registro salvo por serviço, priorizando publicado/versão recente. Exclui modelos de teste e históricos migrados do catálogo e do seletor de novo briefing. Não remove registros do banco nem altera respostas existentes.
- Starters continuam editáveis e podem ser salvos pelo builder existente. Modelos antigos salvos não são atualizados automaticamente; precisam de nova versão para incorporar perguntas adicionais.
- Seis starters incluem fatos_aprovados, termos_proibidos, temas_evitar e direcao_visual. Perguntas opcionais com orientação para fatos confirmados; sem invenção de dados.
- Listagem de briefings preserva grupos por cliente, busca, status e links de respostas/PDF. Área Drive fica recolhida para reduzir competição visual com o fluxo principal.

### Clientes e equipe

- Ficha do cliente inicia com resumo de objetivo, público, posicionamento e tom; ficha completa fica em Dados e links. Removida duplicação visual dos indicadores de ticket/plano no resumo.
- Equipe exibida em grade responsiva de cartões, com avatar, nome, função, vínculo e papel. Links e permissões existentes preservados.

## Evidências

- 16 testes direcionados/6 arquivos aprovados em 2,97s: DashboardPage, workload, officialCatalog, BriefingTemplateStarter, NewBriefingPage e clients.
- Cobertura de ausência de status técnico, setores corretos, exclusão de concluídas/arquivadas, atraso/sem responsável, limite de amostra, catálogo sem histórico/testes e perguntas canônicas sem duplicação.
- Typecheck e diff-check registrados pelo coordenador antes de publicar o candidato integrado.

## Limites

Sem mutação remota, exclusão de modelos salvos, build, deploy ou commit nesta frente. Sem homologação visual do candidato publicado, medição de sobrecarga humana, validação operacional por todos os membros ou teste de dispositivos. O alerta de prazo usa a mesma data local de calendário aplicada pela produção no navegador.
