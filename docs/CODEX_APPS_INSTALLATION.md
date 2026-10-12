# Apps e notificações Dois.Zero

Esta alteração é fonte local para revisão. Nenhum deploy, distribuição ou alteração de produção foi realizado.

## App web instalável

Manifesto, ícones derivados do símbolo laranja oficial e service worker sem cache. Windows/Android com Chrome/Edge podem oferecer instalação; macOS Safari oferece Adicionar ao Dock e iOS Safari Adicionar à Tela de Início. A página `/settings/apps` dá instruções quando o evento de instalação não existe. Não há offline: dados privados e sessões nunca são armazenados pelo service worker.

Avisos do dispositivo têm título, mensagem, símbolo e badge. São novos registros reais em `notifications`, filtrados por agência e destinatário; primeira leitura é somente baseline, sem disparar histórico. Permissão é pedida por ação explícita. Preferência por conta/agência/dispositivo. Sistemas operacionais podem ocultar imagem, badge, sons ou mensagens por suas próprias regras. O teste é identificado como teste e não cria dados no servidor.

O polling funciona enquanto a plataforma está aberta. Entrega com app fechado NÃO está implementada: exige serviço Web Push (VAPID e assinaturas por usuário/dispositivo) ou APNs/FCM nativos, configuração externa e consentimento. O worker não recebe push fictício.

## Fonte nativa Tauri 2

`src-tauri` empacota o frontend com WebView do sistema e plugin de notificações, sem permissões de shell/filesystem. `npm run native:build` produz pacote conforme a plataforma; workflow manual gera artefatos de desenvolvimento, sem publicação e sem assinatura. Antes de executar, configurar variáveis públicas Supabase para apontar ao ambiente autorizado. Nenhuma service-role key pode ir no bundle.

Windows: Rust, Microsoft C++ Build Tools e WebView2. macOS: Rust e ferramentas Xcode; distribuição confiável exige assinatura Developer ID e notarização. Android: Android Studio/SDK/NDK e JDK. iOS: Xcode completo, targets Rust e equipe Apple para assinatura em dispositivo/distribuição. O ambiente local possui apenas Command Line Tools, não Xcode completo. Comandos de inicialização mobile geram projetos locais depois desses pré-requisitos: `npm run native:android:init` e `npm run native:ios:init`.

Sem contas de assinatura/distribuição informadas, não há instaladores de produção, App Store, Play Store, Microsoft Store ou atualização automática. Não instalar ferramentas de sistema nem contornar avisos de segurança. Instalação PWA e pacote Tauri são produtos distintos.

Fontes oficiais: [instalação PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt), [notificações](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification), [pré-requisitos Tauri](https://v2.tauri.app/start/prerequisites/), [distribuição Tauri](https://v2.tauri.app/distribute/).

## Validação local desta rodada

- 7 testes unitários de instalação/notificações: destinatário/agência, ausência de avisos antigos, opt-out, payload, worker sem cache/fetch/push, destino seguro e bridge nativa.
- Typecheck global passou após integração dos arquivos da rodada; lint dos arquivos app-install sem avisos.
- Tauri 2 release compilado localmente para **macOS Apple Silicon (arm64)**. Instalador DMG de desenvolvimento: `src-tauri/target/release/bundle/dmg/Dois.Zero_0.1.0_aarch64.dmg`, 4,55 MiB. `hdiutil verify` confirmou integridade. SHA-256: `283ab3baf9f39e77e86b90fae18588dac14e89161d17569185d3aece4bac06c3`.
- Pacote não assinado com Developer ID e não notarizado. Verificação de assinatura não confirma um app distribuível. Não foi instalado/executado em conta de equipe, nem testado login real ou notificações de sistema em aplicativo nativo instalado. Não foi publicado nem colocado no link público da plataforma.
- Windows, Mac Intel, Android e iOS não compilados nesta máquina. Workflow manual e estrutura mobile ficam preparados, com os pré-requisitos descritos acima.
- Recuperação de senha e autorização Google precisam retornar pelo site HTTPS oficial; esta versão não implementa deep links para retomar o app nativo. OAuth Google deve usar navegador externo, não o WebView embutido.

### Empacotamento Mac final

O frontend e o binário foram reconstruídos após as últimas correções de importação CSV. O script de decoração Finder do bundler Tauri falhou nesta reconstrução e deixou uma imagem temporária própria montada; ela foi desmontada. O instalador final foi recriado com `bash scripts/native/package-macos-development.sh`, usando o `.app` atualizado e um atalho para Applications. Essa alternativa remove somente a decoração Finder/AppleScript; não altera assinatura, notarização ou proteção Gatekeeper. Build nativo e integridade do DMG passaram.
