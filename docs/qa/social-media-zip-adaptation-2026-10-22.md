# Adaptação do pacote Social Media — 22/10/2026

Fonte fornecida pelo responsável: /Users/designer/Downloads/auditoria-social-media.zip. O pacote foi lido sem executar scripts ou copiar funções de backend diretamente.

## Compatibilidade

O pacote contém páginas e Edge Functions de outra aplicação Lovable, com tabelas portuguesas (`perfil_editorial_cliente`, `estrategias_mensais`, `calendarios`, `calendar_approvals`), rotas distintas e dependência de `../_shared/auth.ts` que não está no ZIP. A função de IA depende de LOVABLE_API_KEY e gateway externo. Copiar os arquivos não cria essas dependências nem comprova isolamento por agência/cliente.

| Proposta do pacote | Integração no 2.0 |
| --- | --- |
| Mesa de Social Media por cliente | Usar /social-media e carteira autorizada existente, sem segunda fonte de clientes. |
| Briefing → direção mensal → geração | Aplicado ao fluxo /editorial/new existente; direção vinda do cliente/briefing e regras de geração registradas. |
| Formatos e volumes | Regras do responsável prevalecem: até12 materiais totais, distribuição automática, carrossel5 com revisão até8, Reels30/40/50s. Não copiar limite3–6 do pacote. |
| Histórico e antirrepetição | Motor atual consulta campanhas do mesmo cliente; geração nova evita temas do mês anterior e assinaturas existentes. |
| Fatos e restrições | Campos canônicos adicionados aos seis modelos novos. Fatos não são deduzidos/inventados a partir de texto genérico. |
| Aprovação e liberação | Preservar token e RPCs canônicas do 2.0: aprovação do cliente precede ação humana de gerar demandas. Não criar tabelas/rotas paralelas de aprovação. |
| Avaliação por IA | Não implementada/ativada nesta rodada. Precisa provedor configurado, permissão por cliente, limites de tamanho/custo, timeout e schema validado no servidor. Não apresentar checklist determinístico como nota de IA. |
| Gemini/Lovable fallback | Não ativado sem integração autorizada/configurada. A geração atual é explicitamente por regras; falhas não devem virar sucesso silencioso de IA. |
| Edição após liberação | Preservar histórico/revisão. O pacote sugere mover automaticamente produção já iniciada, mudança que requer contrato transacional próprio e evidência antes de ativação. |
| Pilares30/25/20/15/10 | Referência de planejamento; não substituir automaticamente pilares já aprovados do cliente nem inventar prova social. |

## Pendências de implementação do pacote completo

Provider de IA e avaliação segura, extração por modelo, sazonalidades verificáveis e transação de edição pós-liberação são trabalho adicional. O pacote não é considerado integralmente implantado. Esta revisão complementa as mudanças já realizadas pelos perfis do Agency Agents e não altera permissões ou publica dados do cliente em um provedor externo.


## Integração posterior nesta rodada
Motor opcional Gemini e configuração segura foram implementados e publicados em editorial-ai v1. Consulte platform-operational-upgrade-2026-10-22.md e editorial-ai-backend-2026-10-22.md. Nenhuma chave própria foi cadastrada; geração real permanece pendente.
