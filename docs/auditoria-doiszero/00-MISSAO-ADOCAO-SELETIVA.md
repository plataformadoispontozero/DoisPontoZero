# MISSÃO DO PROJETO | TRANSPLANTE SELETIVO SEM REGRESSÕES

**Estado:** diretriz de produto aprovada na conversa. **Não representa auditoria concluída nem autoriza implementação.**

## Princípio

> A plataforma **NOVA é a base que deve ser preservada**. A plataforma **ANTIGA é biblioteca de soluções que deram certo e fonte de referência funcional**, não um projeto para substituir o novo.

- **LEGADO:** `https://github.com/midiadoiszero-bit/doispontozero.git` (somente leitura).
- **ATUAL:** `https://github.com/plataformadoispontozero/DoisPontoZero.git` (destino, proteger estrutura existente).
- **Plataforma atual:** `https://doispontozero.renatodesigner.com.br/` (validar com testes autorizados).

A decisão de migrar qualquer parte só poderá ser tomada **depois da auditoria lado a lado e da aprovação por módulo**.

## Cinco decisões possíveis, separadas por funcionalidade

| Decisão | Condição | Consequência |
|---|---|---|
| **MANTER NOVO** | Novo já atende e está melhor | Nenhuma alteração |
| **APROVEITAR LÓGICA ANTIGA** | Regra/algoritmo antigo era útil, mas novo tem arquitetura própria | Portar comportamento no serviço/hook novo, sem trazer dependências antigas |
| **ADAPTAR COMPONENTE** | Componente antigo faz falta, e é seguro integrá-lo | Ajuste cirúrgico de interface e contratos; estilo visual do novo permanece |
| **MIGRAR DADOS** | Dados valiosos existem no legado e ainda não chegaram ao destino | Projeto de migração separado, com backups, dry-run e autorização explícita |
| **DESCARTAR LEGADO** | Recurso antigo era redundante, frágil ou ficou obsoleto | Não portar |

## Os quatro NÃO negociáveis

1. **Não destruir ou substituir** módulos funcionais da nova plataforma para copiar telas do legado.
2. **Não duplicar** fonte canônica, engine de tarefas, autenticação, OAuth Google Drive, tabelas ou integrações.
3. **Não migrar nem modificar dados reais**, schemas, RLS ou infraestrutura sem autorização explícita posterior.
4. **Não presumir que funcionava** apenas por existir código: exigir prova, teste ou qualificar `RELATO/NÃO VALIDADO`.

## Ordem prioritária

1. Social Media: briefing, estratégia, calendários, revisão e Backlog.
2. Aprovação editorial do cliente e sincronização pós-aprovação.
3. Handoff para captação quando necessário, produção e Kanban.
4. Arquivos no Google Drive por cliente e por demanda.
5. Roles, Tráfego, indicadores, SLAs e experiência geral.

**Fluxo-alvo da operação (requisito da reunião, não resultado comprovado):** Briefing → Social → Calendário → Revisão interna/Backlog → Cliente → Conferência operacional → Captação **se necessária** → Enviar para produção → Briefados → Em produção → QA → Aprovação final → Ajustes ou Concluído. O Backlog não é Briefados.

## Fases, com aprovação humana entre elas

**Fase A: auditoria** → leitura de repositórios, inventário e `.md` por aba. Nenhuma alteração no produto.

**Fase B: plano de adoção** → escolher melhorias precisas, dependências, riscos, testes e compatibilidade. Sem implementação.

**Fase C: piloto aprovado** → implementar **uma melhoria pequena** por vez em branch dedicada, com diff mínimo, feature flag se necessário, testes e demonstração; nunca merge ou deploy automático.

**Fase D: expansão** → repetir por módulo, preservando a possibilidade de rollback.

## Critério de encerramento por funcionalidade

- Antes/depois da nova plataforma documentado.
- Nenhuma regressão em clientes, calendários, demands, roles e Drive.
- Contratos de dados preservados ou mudança compatível e versionada.
- Testes de unidade, integração, RLS e fluxo de usuário executados quando viáveis; impedimentos explícitos.
- Novo módulo acessível apenas a papéis autorizados.
- Mudança pequena, reversível e revisável em PR independente.
- Responsável aprovou a adoção antes de mexer no código.
