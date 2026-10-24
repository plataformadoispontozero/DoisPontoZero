# Readiness — Agency Agents — 22/10/2026

**Parecer: NEEDS WORK.** Revisão estática e testes locais; nenhuma homologação global ou operacional concedida. Perfis usados: Reality Checker e Test Results Analyzer instalados em `.codex/agents/`. Sem alterações de implementação por esta frente.

## Escopo e evidência atual

- Router real: `src/app/router/index.tsx`, 96 declarações `path:` (inclui aliases, parâmetros e filhos; não significa 96 jornadas independentes).
- Inventário local: 146 arquivos unitários; 15 arquivos E2E `.spec.ts` em `e2e/`.
- Não há AGENTS.md encontrado no projeto. Projeto é React/Vite: `index.html`; diretório Laravel `resources/views` ausente.
- Script de captura padronizado do perfil `qa-playwright-capture.sh` e `public/qa-screenshots/test-results.json` ausentes. Existem 45 arquivos de screenshots históricos em `docs/evidence/screenshots`; não foram recapturadas nesta revisão.
- Browser E2E não executado: interação de UI nesta sessão deve usar CUA, conforme instrução superior. Inventário E2E abaixo é leitura de código, não resultado de execução.
- `npm run lint`: exit 0, **483 warnings / 0 errors**. Desses, 294 `no-unused-vars`, 80 `react/purity`, 32 `set-state-in-effect`, 25 `exhaustive-deps`, 15 `only-export-components`, 13 `no-useless-catch`, 11 `react/refs`, 6 `react/immutability`; log `/tmp/dois-qa-lint-20261022.txt`. Exit 0 não comprova ausência de dívida técnica.
- `npm test` padrão iniciado e interrompido após falhas em 17 casos PGlite e lentidão. Não houve resumo final; não é resultado de regressão concluída. Arquivos observados: showcase.database (3), taskDrive.database (4), member-profile.database (5), office-data.database (5). Concorrência com outras execuções locais foi identificada; falhas não classificadas como defeito funcional sem repetição isolada.
- Reteste integral `npm test -- --maxWorkers=2` interrompido (exit 130) após aproximadamente dois minutos sem produzir resultado por arquivo. Diagnóstico isolado `npm test -- src/features/presentations/showcase.database.test.ts --maxWorkers=1`: **3/3 aprovados em 5,03s**, um arquivo. As três falhas iniciais desse arquivo não se reproduziram isoladas. Nenhum resultado integral aprovado foi obtido nesta rodada. Sem porcentagem de cobertura de linhas: nenhum relatório coverage foi produzido.

## Matriz de módulos

| Área | Estado sustentado pela evidência | Evidência | Lacuna para concluir |
|---|---|---|---|
| Shell, navegação, dashboard | Implementado; smoke local e histórico | router.test.tsx (12 componentes), audit-routes.spec.ts (14 rotas), screenshots históricas | Router unitário recria árvore própria e não exercita guards/rotas reais completas; novo smoke CUA no SHA final |
| Auth, agência, acessos | Testes controlados presentes | agency-access.spec.ts, platform-readiness.spec.ts; 4 arquivos unitários auth | SMTP/cadastro/aprovação de dois membros reais; RLS remoto não é provado por mocks |
| Clientes e briefings | Fluxos e testes presentes | 6 testes arquivos clientes, 9 briefing; native-briefing-pilot e aurora-workflow | Edição/refresh e vínculos reais Drive; completude dos dados legados com equipe |
| Projetos, tarefas e produção | Implementado com testes de domínio | 6 arquivos projetos, 4 tarefas, 4 produção; critical-flows/aurora/demand-drive-files | Regressão de upload/importação e reenvio à produção real controlado com rollback; reconciliar schema remoto |
| Estratégia, editorial, Social Media | Implementado, controle de contexto testado | 7 arquivos estratégia, 5 editorial, 1 social; editorial-profile.spec.ts | Campanha real percorrendo briefing→copy→aprovação→produção; aceite editorial humano |
| Apresentações e aprovação | Implementado e em correção ativa | 20 arquivos unitários; relatórios QA de 20/10 | E2E antigo contradiz grade atual e Solicitar ajuste; capturar Post/Reels/Carrossel e ampliação no candidato final |
| Drive, integrações e tráfego | Protocolos locais testados | 4 arquivos Drive, 11 integrações; demand-drive-files.spec.ts | Conta Google real, upload/preview/cache e Meta ads_read com cliente real; mídia privada expirada/revogação |
| Escritório voz/chamadas/mídia | Fase05 aceita historicamente; 06/07 parciais; 08 sem captura real | office-phase05 (aceite final), phase07 (limite duas contas), phase08 (dispositivos desligados); 12 arquivos unitários | Conversa real de duas contas, continuidade na navegação, câmera/tela/dispositivos nas plataformas alvo |
| Desktop/Tauri | Build macOS registrado, não validação interativa | office-phase09-2026-10-18.md; 3 arquivos app-install | Tray ocultar/restaurar/mute/saída com sessão conectada; empacotamento DMG e assinatura |
| Configurações, reuniões, agenda, notificações | Implementado com testes parciais | 12 settings, 4 meetings, 1 calendar, 5 notifications | Teste operacional de preferências, convites, destinatários e persistência real |
| Segurança e release | Auditoria anterior NO-GO para novo candidato | cloudflare-security-readiness-2026-10-20.md | Reconciliar migrations/código remoto, proteção cadastro, CI/variáveis, isolamento de staging, restore Supabase real |

## Contradições verificáveis

1. `e2e/platform-readiness.spec.ts:129-130` tenta clicar “Próxima imagem” em fixture de seção `gallery` sem `media_layout`. O preview atual usa grade como padrão; isso torna o cenário desatualizado por inspeção, ainda não falha E2E reproduzida nesta sessão.
2. `e2e/presentation-preview.spec.ts:17` exige `Solicitar ajuste` ausente e “Imagem anterior” em materiais sem modo slideshow; implementação atual oferece ajuste e grade. Atualizar cenários para contratos de Post / Reels / Carrossel explícitos. O agente frontend corrigiu estaticamente o caso platform-readiness durante esta rodada; essa correção não foi executada no navegador aqui.
3. `e2e/audit-routes.spec.ts` conserva expectativa de “Salvar Matriz” desabilitado / “RLS não homologada”, embora a gravação segura já seja declarada em `docs/RELEASE_STATUS.json`. Revisar teste contra comportamento desejado atual; não enfraquecer autorização para satisfazê-lo.
4. Manifestos misturam snapshots: `PLATFORM_HOMOLOGATION_STATUS.json` mantém `office_phase_05` pendente, enquanto `office-phase05-2026-10-14.md` registra aceite explícito. Reconciliar por fase e data com evidência, sem homologar 06–09 por herança do aceite05.
5. Auditoria Cloudflare é do SHA ba85aaa; houve integração posterior. Seus achados remotos são históricos até nova conferência, mas os gates não podem ser considerados resolvidos por deploy.

## Cinco prioridades

1. Concluir candidato atual de apresentações, incluindo seletor limpo, carrossel, teclado/arraste e retorno; validar CUA desktop/mobile com evidência e atualizar E2E estáticos obsoletos.
2. Obter regressão unitária estável com limite de concorrência, typecheck/build serializados e lint bloqueante para erros. Fixar evidência no SHA; nenhuma aprovação baseada em logs temporários antigos.
3. Reconciliar migrações/funções remotas e endurecer cadastro público antes de nova certificação de release; staging Worker compartilha banco de produção e não é isolamento de dados.
4. Executar jornada autenticada completa por perfil/cliente (cadastro→briefing→editorial→produção/Drive→apresentação→ajuste→nova aprovação), incluindo negação de acesso entre agências e recuperação de falhas.
5. Fechar integrações operacionais: SMTP, Google/Meta, voz/vídeo/tela duas contas, desktop tray e restore real. Registrar aceite somente dos critérios comprovados e atualizar manifestos sem porcentagens estimadas.

## Limites

Nenhuma captura nova de dispositivo, chamada, envio externo, escrita em produção ou restore real foi realizado nesta frente. Não atribuo nota nem percentual de conclusão: escopo operacional e cobertura executada não sustentam esse cálculo. Sem prova visual atual e jornada real completa, o sistema permanece **NEEDS WORK**.

## Tentativa serial final

Após todos os demais agentes encerrarem os testes, `npm test -- --maxWorkers=1` foi iniciado sem build concorrente e permaneceu aproximadamente dois minutos somente em RUN/warnings de localStorage, sem resultado de arquivo. Interrompido por orientação do coordenador (exit 130); log `/tmp/dois-qa-unit-serial-20261022.log`. A regressão integral permanece **inconclusiva**, não aprovada nem caracterizada como defeito funcional. O teste isolado PGlite 3/3 acima permanece a evidência reproduzível desta frente. Nenhum processo de teste desta frente continua executando.
