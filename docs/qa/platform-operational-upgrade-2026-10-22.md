# Plataforma 2.0 — integração operacional — 22/10/2026

## Entrega integrada

Trabalho dividido com Agency Agents: interface do escritório, backend editorial, configuração de IA, automação editorial, operação e documentos/importação. Perfis locais preservados fora do commit.

- Escritório ocupa a largura disponível; compartilhamento fixado sem recorte, câmeras menores ao lado/abaixo, escolha entre telas simultâneas. Navegação interna recolhida durante chamada e reaberta por botão. Áudio, vídeo e continuidade confirmados pelo responsável; novo layout ainda requer conferência física.
- Painel sem matriz/status técnico, com carga por setor calculada pelas demandas. Projeto fictício “teste” 560ee08a-0cf6-4e93-a9fe-21bec7fe2613 e sua demanda arquivados reversivelmente, sem apagar dados reais.
- Estratégia/calendário reunidos na navegação; organização do menu pelo gestor é preferência deste navegador, não uma configuração compartilhada da agência.
- Seis modelos oficiais na criação de briefing; históricos migrados preservados. Ficha de cliente resumida e equipe em cartões.
- Planejamento automático até 12 materiais, com Post/Carrossel/Reels; carrossel padrão 5 lâminas, revisão até 8, Reels 30/40/50 segundos. Contexto editorial e histórico alimentam a geração; revisão humana e aprovação permanecem obrigatórias.
- Temas claro/escuro/sistema implementados. Configuração de PDF usa o gerador real, branding oficial e marca d’água. Importação JSON/CSV conserva revisão/mapeamento antes de gravar. Atividades com filtros, atualização e erros explícitos; não equivale a gravar cada navegação ou movimento do mouse.
- Gemini opcional com configuração cifrada e consentimento; Ollama preparado sem conexão local ativa. Nenhuma chave do Lovable copiada. Sem chave própria, geração Gemini não foi homologada. Cota gratuita depende da conta Google e não é garantia de custo zero.

## Evidências

- Regressão completa: 655 testes em 174 arquivos aprovados (170,24 s), /tmp/dois-final-upgrade-tests.log.
- Depois do refinamento do escritório e import SQL raw: 15 testes direcionados em quatro arquivos aprovados, /tmp/dois-office-final-tests.log. Inclui novo caso de recolher/reabrir navegação.
- Build com flags de voz, chamadas e mídia ativas: aprovado, /tmp/dois-upgrade-build.log.
- Migração editorial_ai_connections aplicada; RPC sem EXECUTE para anon/authenticated e permitida para service_role.
- Edge Function editorial-ai v1 ACTIVE; chamada sem sessão retornou 401 authentication_required. Nenhuma geração real ou envio de briefing ao Google nesta verificação.
- Worker produção publicado: a22cf069-6a26-4aa2-adba-c0249cb55489.

## Limites de aceite

A publicação não homologa integralmente todas as áreas da agência. Permanecem validação física do novo compartilhamento, credencial/geração real Gemini, Meta, cadastro/e-mail/segurança e os critérios operacionais ainda listados em Diagnósticos. Temas e PDF têm testes de componentes/contrato; conferência visual física complementar deve ser registrada separadamente.
