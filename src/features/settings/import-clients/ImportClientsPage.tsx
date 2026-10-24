import { PROFILE_LABELS } from "@/features/clients/profileFields";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAgencyId, usePermission } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import {
  CLIENT_FIELDS,
  autoMapping,
  previewCsv,
  type ColumnMapping,
  type ImportClient,
} from "./csv";
import { IMPORT_LIMITS, scanClientFile, type ScannedDocument } from "./stream";
export default function ImportClientsPage() {
  const agency = useAgencyId();
  return <ImportClientsWizard key={agency || "no-agency"} />;
}
function ImportClientsWizard() {
  const fileInput = useRef<HTMLInputElement>(null);
  const agencyId = useAgencyId(),
    allowed = usePermission("clients.create"),
    canEdit = usePermission("clients.edit"),
    clients = useQuery({
      queryKey: ["client-import-existing", agencyId],
      enabled: !!agencyId && !!supabase && allowed,
      queryFn: async () => {
        const existing: { id: string; name: string; slug: string }[] = [];
        for (let offset = 0; ; offset += 1000) {
          const r = await supabase!.from("clients").select("id,name,slug")
            .eq("agency_id", agencyId).order("id").range(offset, offset + 999);
          if (r.error) throw r.error;
          const batch = r.data as { id: string; name: string; slug: string }[];
          existing.push(...batch);
          if (batch.length < 1000) break;
        }
        return existing;
      },
    }),
    cache = useQueryClient();
  const [completeExisting, setCompleteExisting] = useState(false);
  const [document, setDocument] = useState<ScannedDocument | null>(null),
    [filename, setFilename] = useState(""),
    [mapping, setMapping] = useState<ColumnMapping>({}),
    [selected, setSelected] = useState<Set<number>>(new Set()),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [result, setResult] = useState<
      { row: number; status: string; message: string }[]
    >([]);
  const sourceFile = useRef<File | null>(null);
  const controller = useRef<AbortController | null>(null);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [includeRemaining, setIncludeRemaining] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewInvalid, setReviewInvalid] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [outcomes, setOutcomes] = useState<Record<string, number>>({});
  useEffect(() => () => controller.current?.abort(), []);
  const rows = useMemo(
    () => (document ? previewCsv(document, mapping, clients.data || []) : []),
    [document, mapping, clients.data],
  );
  const chosen = rows.filter(
    (r) => selected.has(r.data.row) && !r.errors.length && (!r.duplicate || (completeExisting && canEdit && !!r.data.profile)),
  );
  const missing = ["name"].filter(
    (f) => mapping[f as keyof ColumnMapping] === undefined,
  );
  const duplicateMapping =
    new Set(Object.values(mapping)).size !== Object.values(mapping).length;
  async function upload(file: File) {
    controller.current?.abort();
    const operation = new AbortController(); controller.current = operation;
    setMessage(""); setResult([]); setConfirm(false); setDocument(null);
    setReading(true); setProgress(0); sourceFile.current = null;
    try {
      const parsed = await scanClientFile(file, { signal: operation.signal, onProgress: (bytes, total) => setProgress(total ? bytes / total * 100 : 0) });
      if (operation.signal.aborted) return;
      sourceFile.current = file;
      setDocument(parsed); setFilename(file.name); setMapping(autoMapping(parsed.headers));
      setSelected(new Set(parsed.records.map(r => r.row))); setIncludeRemaining(true);
    } catch (e) {
      if (!operation.signal.aborted) setMessage(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally { if (controller.current === operation) setReading(false); }
  }
  async function consumeRows(consumer: (data: ImportClient) => Promise<void>, operation: AbortController) {
    if (!sourceFile.current || !document) throw Error("Selecione o arquivo novamente.");
    const seen = new Map<string, number>();
    const sampleRows = new Set(document.records.map(r => r.row));
    let valid = 0, invalid = 0;
    await scanClientFile(sourceFile.current, {
      signal: operation.signal, headers: document.headers,
      onProgress: (bytes, total) => setProgress(total ? bytes / total * 100 : 0),
      onRecord: async record => {
        const row = previewCsv({ ...document, records: [record] }, mapping, clients.data || [], seen)[0];
        const requested = sampleRows.has(record.row) ? selected.has(record.row) : includeRemaining;
        if (row.errors.length) { invalid++; return; }
        if (!requested || (row.duplicate && (!completeExisting || !canEdit || !row.data.profile))) return;
        valid++;
        await consumer(row.duplicate ? { ...row.data, action: "fill_missing", existing_id: row.duplicate.id } : row.data);
      },
    });
    return { valid, invalid };
  }
  async function review() {
    const operation = new AbortController(); controller.current = operation;
    setReading(true); setProgress(0); setMessage("");
    try {
      const summary = await consumeRows(async () => {}, operation);
      setReviewCount(summary.valid); setReviewInvalid(summary.invalid); setConfirm(true);
    } catch (e) { if (!operation.signal.aborted) setMessage(e instanceof Error ? e.message : "Falha na revisão."); }
    finally { setReading(false); }
  }
  async function save() {
    if (!supabase || !agencyId || !allowed || !confirm || !reviewCount) return;
    const operation = new AbortController(); controller.current = operation;
    setBusy(true); setMessage(""); setProcessed(0); setProgress(0); setOutcomes({});
    let acknowledged = 0, batch: ImportClient[] = [], batchBytes = 0;
    const statuses: { row: number; status: string; message: string }[] = [];
    const counts: Record<string, number> = Object.create(null);
    const flush = async () => {
      if (!batch.length) return;
      if (operation.signal.aborted) throw new DOMException("Cancelado", "AbortError");
      const { data, error } = await supabase!.rpc("import_clients_csv", { p_agency_id: agencyId, p_filename: filename, p_rows: batch });
      if (error) throw error;
      if (!Array.isArray(data?.results) || data.results.length !== batch.length) throw Error("Resposta incompleta do serviço de importação.");
      acknowledged += batch.length; setProcessed(acknowledged);
      for (const result of data.results) { counts[String(result.status)] = (counts[String(result.status)] || 0) + 1; if (statuses.length < 100) statuses.push(result); }
      setOutcomes({ ...counts });
      batch = []; batchBytes = 0;
    };
    try {
      await consumeRows(async row => {
        const bytes = new TextEncoder().encode(JSON.stringify(row)).byteLength + 2;
        if (bytes > 1024 * 1024) throw Error(`Linha ${row.row}: dados mapeados acima de 1 MiB.`);
        if (batch.length && (batch.length >= IMPORT_LIMITS.batchRows || batchBytes + bytes > 1024 * 1024)) await flush();
        batch.push(row); batchBytes += bytes;
      }, operation);
      await flush();
      setMessage(`Importação processada: ${acknowledged} registros com resposta do servidor. Confira os resultados; duplicados e recusas não são contabilizados como novos cadastros.`);
      setConfirm(false); setSelected(new Set()); setIncludeRemaining(false);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setMessage(`${operation.signal.aborted ? "Importação interrompida" : code === "42501" ? "Permissão recusada" : "Importação interrompida por falha"}. ${acknowledged} registros em lotes anteriores receberam resposta e podem ter sido gravados. O lote em andamento pode ter sido processado; confira os clientes antes de repetir. ${e instanceof Error ? e.message : ""}`);
      setConfirm(false);
    } finally {
      setResult(statuses); setBusy(false);
      await cache.invalidateQueries({ queryKey: ["clients"] });
      await cache.invalidateQueries({ queryKey: ["client-import-existing", agencyId] });
    }
  }
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">Importar clientes via CSV ou JSON</h2>
      <p>
        Importe CSV ou JSON exportado do Lovable, em UTF-8. JSON aceita uma lista de clientes ou um objeto com data/clients e dados de profile. Até 1 GiB, 1.000.000 de registros e 512 colunas, com leitura em blocos. A prévia mostra até 100 registros e 4 MiB de texto; a revisão percorre o arquivo completo antes de confirmar. Cada campo aceita até 262.144 caracteres e cada registro até 2.097.152 caracteres. Clientes novos serão cadastrados. Você poderá completar os dados ausentes de clientes já cadastrados, com revisão e confirmação.
      </p>
      {!allowed ? (
        <p role="alert">Você precisa da permissão de criar clientes.</p>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-5">
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#c84408] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#e65412] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy || reading}
          onClick={() => fileInput.current?.click()}
        >
          {document ? "Trocar arquivo CSV ou JSON" : "Selecionar arquivo CSV ou JSON"}
        </button>
        <p className="text-sm text-zinc-300">
          {document ? `Arquivo selecionado: ${filename}` : "Selecione o arquivo para visualizar os clientes. Depois, revise e confirme a importação."}
        </p>
        <input
          ref={fileInput}
          className="hidden"
          aria-label="Arquivo CSV ou JSON"
          type="file"
          accept=".csv,.json,text/csv,application/json"
          disabled={busy || reading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        </div>
      )}
      {(reading || busy) && <div role="status" className="space-y-2"><p>{busy ? `Importando em lotes: ${processed} registros com resposta` : "Lendo e conferindo o arquivo"} · {Math.floor(progress)}%</p><progress className="w-full" aria-label="Progresso da leitura" max={100} value={progress}/><button type="button" onClick={() => controller.current?.abort()}>Cancelar {busy ? "próximos lotes" : "leitura"}</button>{busy && <p>Lotes já enviados podem ter sido gravados. Cancelar interrompe somente os próximos lotes.</p>}</div>}
      {message && (
        <p role="alert" className="text-orange-300">
          {message}
        </p>
      )}
      {clients.isError && (
        <p role="alert">
          Não foi possível conferir clientes existentes. A importação está
          bloqueada.
        </p>
      )}
      {document && (
        <>
          {canEdit && <label className="flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm"><input type="checkbox" className="mt-1" checked={completeExisting} disabled={busy||reading||confirm} onChange={e=>setCompleteExisting(e.target.checked)}/>Completar dados ausentes de clientes já cadastrados. Nome, status, logotipo e informações preenchidas serão preservados.</label>}
          <p>
            {filename} · {document.totalRecords} registros no arquivo · {document.headers.length} colunas · prévia de {document.records.length} registros ·{" "}
            {rows.filter((r) => r.errors.length).length} inválidos ·{" "}
            {rows.filter((r) => r.duplicate).length} duplicados ·{" "}
            {chosen.length} selecionados na prévia
          </p>
          {document.totalRecords > document.records.length && <label className="flex gap-3 rounded-lg border border-white/15 p-4"><input type="checkbox" checked={includeRemaining} disabled={busy || reading || confirm} onChange={e => setIncludeRemaining(e.target.checked)}/>Incluir também os registros após a prévia. Todos serão validados antes da confirmação; inválidos e duplicados não autorizados serão ignorados.</label>}
          <div className="grid gap-3 md:grid-cols-4">
            {CLIENT_FIELDS.map((field) => (
              <label key={field}>
                {({name: "Nome do cliente", slug: "Identificador (slug)", logo_url: "URL do logotipo", status: "Status"} as Record<string,string>)[field] || PROFILE_LABELS[field]} {field === "name" && "*"}
                <select
                  className="block w-full bg-[#202026] p-2"
                  aria-label={`Coluna ${field}`}
                  value={mapping[field] ?? ""}
                  disabled={busy || reading || confirm}
                  onChange={(e) =>
                    setMapping((m) => {
                      const next = { ...m };
                      if (e.target.value === "") delete next[field];
                      else next[field] = Number(e.target.value);
                      return next;
                    })
                  }
                >
                  <option value="">{field === "slug" ? "Gerar pelo nome do cliente" : "Não importar"}</option>
                  {document.headers.map((h, i) => (
                    <option value={i} key={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p>
            {mapping.slug === undefined && "O identificador será gerado pelo nome. Status ativo/inativo/arquivado será convertido automaticamente. "} Colunas não importadas:{" "}
            {document.headers
              .filter((_, i) => !Object.values(mapping).includes(i))
              .join(", ") || "nenhuma"}
            . Duplicados são identificados pelo slug nesta agência. Nomes iguais
            com slugs diferentes exigem sua revisão.
          </p>
          {missing.length > 0 && (
            <p role="alert">
              Mapeie os campos obrigatórios: {missing.join(", ")}.
            </p>
          )}
          {duplicateMapping && (
            <p role="alert">Cada campo precisa de uma coluna diferente.</p>
          )}
          <div className="overflow-auto max-h-96">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Importar</th>
                  <th>Linha</th>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Status / logotipo</th>
                  <th>Validação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.data.row} className="border-b border-white/10">
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Selecionar linha ${r.data.row}`}
                        disabled={
                          busy || reading || confirm || !!r.errors.length || (!!r.duplicate && (!completeExisting || !canEdit || !r.data.profile))
                        }
                        checked={
                          selected.has(r.data.row) &&
                          !r.errors.length &&
                          (!r.duplicate || (completeExisting && canEdit && !!r.data.profile))
                        }
                        onChange={(e) =>
                          setSelected((old) => {
                            const n = new Set(old);
                            if (e.target.checked) n.add(r.data.row);
                            else n.delete(r.data.row);
                            return n;
                          })
                        }
                      />
                    </td>
                    <td>{r.data.row}</td>
                    <td>{r.data.name}</td>
                    <td>{r.data.slug}</td>
                    <td>
                      {r.data.status || "active"}
                      <br />
                      {r.data.logo_url || "Sem logotipo"}
                      {r.data.profile && <details className="mt-2"><summary className="cursor-pointer text-orange-300">Ver {Object.keys(r.data.profile).length} dados do perfil</summary><dl className="mt-2 max-w-lg space-y-2">{Object.entries(r.data.profile).map(([key,value])=><div key={key}><dt className="font-semibold">{PROFILE_LABELS[key]||key}</dt><dd className="whitespace-pre-wrap break-words">{String(value)}</dd></div>)}</dl></details>}
                    </td>
                    <td>
                      {r.errors.join(" ")}
                      {r.duplicate
                        ? completeExisting && canEdit ? "Já cadastrado: completar somente dados ausentes." : "Já cadastrado."
                        : r.possibleSameName
                          ? "Possível mesmo cliente; revise."
                          : !r.errors.length
                            ? "Válido"
                            : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!confirm ? (
            <button
              className="bg-[#c84408] rounded-lg p-3"
              disabled={
                busy || reading ||
                (!chosen.length && !(includeRemaining && document.totalRecords > document.records.length)) ||
                !!missing.length ||
                duplicateMapping ||
                clients.isPending ||
                clients.isError ||
                !allowed ||
                !supabase
              }
              onClick={() => void review()}
            >
              Revisar importação
            </button>
          ) : (
            <div className="space-y-3 border border-orange-600 rounded-lg p-4">
              <p>
                Revisão completa: {reviewCount} registros elegíveis para importar; {reviewInvalid} registros inválidos serão ignorados. Confirme a importação destes {reviewCount} registros.
                Clientes novos serão cadastrados. Para clientes existentes selecionados, somente campos ausentes do perfil serão completados; nenhum dado preenchido será sobrescrito. Campos não mapeados serão ignorados.
              </p>
              <button
                className="bg-[#c84408] rounded-lg p-3"
                disabled={busy || reading || !reviewCount}
                onClick={() => void save()}
              >
                {busy ? "Importando…" : "Confirmar e importar clientes"}
              </button>
              <button
                className="ml-4"
                disabled={busy || reading}
                onClick={() => setConfirm(false)}
              >
                Voltar à revisão
              </button>
            </div>
          )}
        </>
      )}
      {Object.keys(outcomes).length > 0 && <p role="status">Respostas por resultado: {Object.entries(outcomes).map(([status, count]) => `${status}: ${count}`).join(" · ")}</p>}
      {result.length > 0 && (
        <div role="status">
          <p>Primeiras {result.length} respostas do servidor (máximo 100). O total processado aparece acima.</p>
          {result.map((r) => (
            <p key={r.row}>
              Linha {r.row}: {r.status} — {r.message}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
