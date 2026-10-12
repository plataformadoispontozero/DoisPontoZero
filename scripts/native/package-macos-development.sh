#!/usr/bin/env bash
# Package an already-built .app without Finder automation or production signing.
set -euo pipefail
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo 'Este empacotamento requer macOS.' >&2
  exit 1
fi
task_root="$(cd "$(dirname "$0")/../.." && pwd)"
task_app="$task_root/src-tauri/target/release/bundle/macos/Dois.Zero.app"
if [[ ! -d "$task_app" ]]; then
  echo 'Compile antes: VITE_PUBLIC_SITE_PREVIEW=false npm run native:build -- --bundles app' >&2
  exit 1
fi
task_version="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).version)' "$task_root/src-tauri/tauri.conf.json")"
task_arch="$(uname -m)"
if [[ "$task_arch" == 'arm64' ]]; then task_arch='aarch64'; fi
task_stage="$(mktemp -d "${TMPDIR:-/tmp}/doiszero-native-package.XXXXXX")"
trap 'rm -rf "$task_stage"' EXIT
ditto "$task_app" "$task_stage/Dois.Zero.app"
ln -s /Applications "$task_stage/Applications"
task_output="$task_root/src-tauri/target/release/bundle/dmg/Dois.Zero_${task_version}_${task_arch}.dmg"
mkdir -p "$(dirname "$task_output")"
hdiutil create -volname 'Dois.Zero desenvolvimento' -srcfolder "$task_stage" -ov -format UDZO "$task_output"
hdiutil verify "$task_output"
shasum -a 256 "$task_output"
echo 'Pacote de desenvolvimento sem assinatura Developer ID/notarização. Nenhum app foi instalado.'
