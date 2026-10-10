# Dois.Zero | Creative Agency OS
# Estratégia de Observabilidade e Logging de Produção (Observability)

**Data de Definição:** 10 de Outubro de 2026  
**Versão:** Release 0.2.0-rc1  
**Responsável:** Site Reliability Engineer (SRE) & Security Engineer  

---

## 1. Princípios de Observabilidade Segura

A arquitetura de observabilidade do Dois.Zero foca em visibilidade operacional e diagnóstico rápido sem comprometer dados privados dos clientes ou segredos das agências.

### O que DEVE ser monitorado:
- Erros não capturados da aplicação (via React Error Boundary).
- Falhas em requisições de persistência no Supabase (códigos HTTP 4xx e 5xx).
- Falhas em conexões de integração externa (OAuth Google, webhooks).
- Latência média de resposta em consultas e transações críticas.
- Tentativas de autenticação com falha consecutiva.

### O que NUNCA deve ser registrado em logs:
- Senhas de usuários em texto plano.
- Tokens secretos JWT ou Refresh Tokens.
- Chaves de API privadas ou `service_role`.
- Respostas confidenciais de briefings de clientes.
- Dados de cartões ou valores bancários sigilosos.

---

## 2. Camadas de Coleta

1. **Frontend Client:**
   - Componentes críticos encapsulados por `ErrorBoundary` com telemetria padronizada.
   - Tratamento de exceções no TanStack Query (`queryClient.setDefaultOptions({ queries: { onError: ... } })`).
   - Notificações de erro amigáveis ao usuário via Toast sem exposição de stack traces.

2. **Backend Supabase (PostgreSQL & Edge Functions):**
   - Logs nativos de auditoria do PostgreSQL acessíveis pelo dashboard de produção Supabase.
   - Tabela dedicada `agency_settings_history` registrando quem alterou cada configuração do workspace, data e snapshot resumido.

---

## 3. Matriz de Níveis de Severidade de Incidentes

| Nível | Descrição | Exemplo | Ação Esperada |
|---|---|---|---|
| **P0 (Crítico)** | Sistema inoperante ou falha de isolamento de agências | RLS rompida, falha total de login | Interrupção imediata e rollback |
| **P1 (Alto)** | Módulo essencial quebrado | Falha na criação de tarefas ou briefings | Resolução em até 4 horas |
| **P2 (Médio)** | Funcionalidade secundária com erro | Falha em filtros ou preview de cores | Resolução na sprint corrente |
| **P3 (Baixo)** | Inconsistência visual ou aviso não bloqueante | Warning de contraste ou espaçamento | Ajuste em ciclo regular de polimento |
