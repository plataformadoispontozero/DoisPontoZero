import { PROFILE_LABELS } from "@/features/clients/profileFields";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAgencyId, usePermission } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import {
  CLIENT_FIELDS,
  autoMapping,
  previewCsv,
  readCsvFile,
  type ColumnMapping,
  type CsvDocument,
} from "./csv";
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
  const [document, setDocument] = useState<CsvDocument | null>(null),
    [filename, setFilename] = useState(""),
    [mapping, setMapping] = useState<ColumnMapping>({}),
    [selected, setSelected] = useState<Set<number>>(new Set()),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [result, setResult] = useState<
      { row: number; status: string; message: string }[]
    >([]);
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
    setMessage("");
    setResult([]);
    setConfirm(false);
    try {
      const parsed = await readCsvFile(file);
      setDocument(parsed);
      setFilename(file.name);
      setMapping(autoMapping(parsed.headers));
      setSelected(new Set(parsed.records.map((r) => r.row)));
    } catch (e) {
      setDocument(null);
      setMessage(
        e instanceof Error ? e.message : "Não foi possível ler o CSV.",
      );
    }
  }
  async function save() {
    if (!supabase || !agencyId || !allowed || !confirm || !chosen.length)
      return;
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.rpc("import_clients_csv", {
        p_agency_id: agencyId,
        p_filename: filename,
        p_rows: chosen.map((r) => r.duplicate ? {...r.data, action:"fill_missing", existing_id:r.duplicate.id} : r.data),
      });
      if (error) throw error;
      setResult(data.results);
      setConfirm(false);
      setSelected(new Set());
      await cache.invalidateQueries({ queryKey: ["clients"] });
      await cache.invalidateQueries({
        queryKey: ["client-import-existing", agencyId],
      });
    } catch (e) {
      const code = (e as {code?: string})?.code;
      setMessage(code === "42501" ? "Sua conta não tem permissão para importar clientes nesta agência." : code === "PGRST202" ? "Serviço de importação indisponível. Contate o administrador." : "Importação não concluída. Verifique sua conexão e tente novamente; nenhum registro existente será atualizado.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">Importar clientes via CSV</h2>
      <p>
        Importação CSV disponível. Exporte manualmente seu arquivo em UTF-8. Até
        2 MB, 500 clientes e 30 colunas. Clientes novos serão cadastrados. Você poderá completar os dados ausentes de clientes já cadastrados, com revisão e confirmação.
      </p>
      {!allowed ? (
        <p role="alert">Você precisa da permissão de criar clientes.</p>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-5">
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#c84408] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#e65412] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          {document ? "Trocar arquivo CSV" : "Selecionar arquivo CSV"}
        </button>
        <p className="text-sm text-zinc-300">
          {document ? `Arquivo selecionado: ${filename}` : "Selecione o arquivo para visualizar os clientes. Depois, revise e confirme a importação."}
        </p>
        <input
          ref={fileInput}
          className="hidden"
          aria-label="Arquivo CSV"
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        </div>
      )}
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
          {canEdit && <label className="flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm"><input type="checkbox" className="mt-1" checked={completeExisting} disabled={busy||confirm} onChange={e=>setCompleteExisting(e.target.checked)}/>Completar dados ausentes de clientes já cadastrados. Nome, status, logotipo e informações preenchidas serão preservados.</label>}
          <p>
            {filename} · {document.records.length} registros ·{" "}
            {rows.filter((r) => r.errors.length).length} inválidos ·{" "}
            {rows.filter((r) => r.duplicate).length} duplicados ·{" "}
            {chosen.length} selecionados
          </p>
          <div className="grid gap-3 md:grid-cols-4">
            {CLIENT_FIELDS.map((field) => (
              <label key={field}>
                {({name: "Nome do cliente", slug: "Identificador (slug)", logo_url: "URL do logotipo", status: "Status"} as Record<string,string>)[field] || PROFILE_LABELS[field]} {field === "name" && "*"}
                <select
                  className="block w-full bg-[#202026] p-2"
                  aria-label={`Coluna ${field}`}
                  value={mapping[field] ?? ""}
                  disabled={busy || confirm}
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
                          busy || confirm || !!r.errors.length || (!!r.duplicate && (!completeExisting || !canEdit || !r.data.profile))
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
                busy ||
                !chosen.length ||
                !!missing.length ||
                duplicateMapping ||
                clients.isPending ||
                clients.isError ||
                !allowed ||
                !supabase
              }
              onClick={() => setConfirm(true)}
            >
              Revisar importação
            </button>
          ) : (
            <div className="space-y-3 border border-orange-600 rounded-lg p-4">
              <p>
                Confirme os {chosen.length} registros selecionados na tabela.
                Clientes novos serão cadastrados. Para clientes existentes selecionados, somente campos ausentes do perfil serão completados; nenhum dado preenchido será sobrescrito. Campos não mapeados serão ignorados.
              </p>
              <button
                className="bg-[#c84408] rounded-lg p-3"
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? "Importando…" : "Confirmar e importar clientes"}
              </button>
              <button
                className="ml-4"
                disabled={busy}
                onClick={() => setConfirm(false)}
              >
                Voltar à revisão
              </button>
            </div>
          )}
        </>
      )}
      {result.length > 0 && (
        <div role="status">
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
