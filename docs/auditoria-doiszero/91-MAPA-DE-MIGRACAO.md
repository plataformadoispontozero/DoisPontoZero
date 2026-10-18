# Mapa de migração — somente plano

Nenhuma migração executada. Fonte indisponível: schema/campos/contagens antigos NÃO VERIFICADOS.

1. Exportação autorizada read-only e inventário real de tabelas/JSON/histórico/anexos.
2. Relacionar IDs legados a IDs atuais por source_system/source_id e evidência, não só nome.
3. Backup de destino, dry-run, conflitos, integridade de relações e contagens.
4. Piloto de um cliente autorizado em solicitação separada; reexecução idempotente.
5. Preservar dados existentes/editados, datas, autoria original como metadata quando sem identidade validada.
6. Binários permanecem Drive; guardar apenas links/IDs/metadados.
7. Snapshot e mecanismo de reversão com rastreio do lote, sem apagar origem.

Campos e tabelas finais dependem da fonte real. Não usar placeholders do documento como schema de implementação.
