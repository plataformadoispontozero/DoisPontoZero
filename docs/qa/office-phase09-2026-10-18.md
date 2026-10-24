# Escritório Digital — Fase 09 — 18/10/2026

## Escopo implementado

- Reutiliza o shell Tauri 2.12.3 existente. O modo bandeja começa desativado e a opção é persistida em um arquivo pequeno na pasta de configuração específica do app. Acesso a esse caminho ocorre apenas no código Rust; nenhuma permissão ampla de filesystem é concedida ao WebView.
- Tray com mostrar, alternar microfone (habilitado só quando a sala de voz está conectada), sair do Escritório, manter na bandeja ao fechar/minimizar e encerrar o app.
- O menu informa presença, conexão LiveKit, estado de microfone e câmera. Esconder a janela preserva a conexão; “Sair do Escritório” encerra a sala, convite ativo e presença; encerrar o app envia um sinal de limpeza e fecha o processo, com timeout de segurança.
- Autostart não foi incluído; era opcional e não foi solicitado explicitamente.
- A versão Web não promete permanência após fechar a última aba. O modo em segundo plano existe apenas no aplicativo desktop.
- A CSP mantém escopo nos serviços Supabase/LiveKit usados. Permissões nativas de câmera/microfone e textos de uso do macOS foram adicionados na Fase 08; notificações seguem o plugin Tauri já instalado. Sem permissões de shell ou filesystem no WebView.

## Verificação

- Tauri encontrado no projeto antes das alterações; versão resolvida: 2.12.3.
- `cargo check --manifest-path src-tauri/Cargo.toml` — aprovado no macOS arm64.
- `npm run typecheck` — aprovado após integração dos eventos nativos.
- `npx vitest run src/features/office src/features/app-install --maxWorkers=2` — 15 arquivos, 56 testes aprovados.
- O executável release e `Dois.Zero.app` foram compilados. `npm run native:build -- --bundles app` gerou `src-tauri/target/release/bundle/macos/Dois.Zero.app` (13.01 MiB). A etapa padrão de DMG falhou em `bundle_dmg.sh`; é um problema do empacotador DMG, não de compilação Rust.
- O uso real do menu tray, minimizar/restaurar, dispositivos e presença após ocultar ainda precisa de checagem visual no aplicativo empacotado.

## Estado

Homologação de compilação macOS concluída; a validação interativa do tray (menu, ocultar/restaurar, mute e saída) continua pendente. O app abriu e fechou normalmente, mas a conta de teste não entrou, então não foi feita chamada nem captura de dispositivos. Sem deploy em produção. A opção de fundo inicia desligada.
