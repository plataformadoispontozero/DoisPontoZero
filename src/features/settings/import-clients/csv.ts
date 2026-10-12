export const CSV_LIMITS = { bytes: 2 * 1024 * 1024, rows: 500, columns: 30 };
export const CLIENT_FIELDS = ["name", "slug", "logo_url", "status"] as const;
export type ClientField = (typeof CLIENT_FIELDS)[number];
export interface CsvRecord {
  row: number;
  cells: string[];
}
export interface CsvDocument {
  headers: string[];
  records: CsvRecord[];
  delimiter: "," | ";";
}
export type ColumnMapping = Partial<Record<ClientField, number>>;
export interface ImportClient {
  row: number;
  name: string;
  slug: string;
  logo_url?: string;
  status?: string;
}
export interface PreviewRow {
  data: ImportClient;
  errors: string[];
  duplicate?: { id: string; name: string };
  possibleSameName?: string;
}
const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
const aliases: Record<ClientField, string[]> = {
  name: ["name", "nome", "marca", "nome_da_marca", "nome_do_cliente", "cliente", "razao_social"],
  slug: ["slug", "identificador", "identificador_unico"],
  logo_url: ["logo_url", "url_do_logotipo", "logotipo", "logo"],
  status: ["status", "situacao"],
};
export function autoMapping(headers: string[]): ColumnMapping {
  const result: ColumnMapping = {};
  for (const field of CLIENT_FIELDS) {
    const i = headers.findIndex((h) => aliases[field].includes(normalize(h)));
    if (i >= 0) result[field] = i;
  }
  return result;
}
export function parseCsv(input: string): CsvDocument {
  if (new TextEncoder().encode(input).byteLength > CSV_LIMITS.bytes)
    throw Error("Arquivo acima de 2 MB.");
  const text = input.replace(/^\uFEFF/, "");
  if (!text.trim()) throw Error("Arquivo vazio.");
  // Binary control characters are rejected intentionally before parsing text.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/.test(text))
    throw Error("Arquivo inválido. Use CSV em UTF-8.");
  let quote = false,
    comma = 0,
    semicolon = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quote && text[i + 1] === '"') {
        i++;
        continue;
      }
      quote = !quote;
    } else if (!quote) {
      if (c === "\n" || c === "\r") break;
      if (c === ",") comma++;
      if (c === ";") semicolon++;
    }
  }
  const delimiter = semicolon > comma ? ";" : ",";
  const records: CsvRecord[] = [];
  let cells: string[] = [],
    cell = "",
    state: "field" | "quoted" | "closed" = "field",
    line = 1,
    start = 1;
  function finishCell() {
    cells.push(cell);
    cell = "";
    state = "field";
    if (cells.length > CSV_LIMITS.columns)
      throw Error("Limite de 30 colunas excedido.");
  }
  function finishRow() {
    finishCell();
    if (cells.some((v) => v.trim())) records.push({ row: start, cells });
    cells = [];
    if (records.length > CSV_LIMITS.rows + 1)
      throw Error("Limite de 500 registros excedido.");
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (state === "quoted") {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else state = "closed";
      } else {
        cell += c;
        if (c === "\n") line++;
      }
      continue;
    }
    if (c === delimiter) {
      finishCell();
      continue;
    }
    if (c === "\r" || c === "\n") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      finishRow();
      line++;
      start = line;
      continue;
    }
    if (state === "closed") {
      if (c !== " " && c !== "\t")
        throw Error(`Aspas inválidas na linha ${line}.`);
      continue;
    }
    if (c === '"') {
      if (cell.trim()) throw Error(`Aspas inválidas na linha ${line}.`);
      cell = "";
      state = "quoted";
    } else cell += c;
  }
  if (state === "quoted") throw Error("Campo entre aspas não foi fechado.");
  finishRow();
  const header = records.shift();
  if (!header) throw Error("Cabeçalho ausente.");
  const headers = header.cells.map((h) => h.trim());
  if (
    headers.some((h) => !h) ||
    new Set(headers.map(normalize)).size !== headers.length
  )
    throw Error("Cabeçalhos vazios ou duplicados. Corrija o arquivo.");
  if (!records.length) throw Error("O CSV não contém registros.");
  return { headers, records, delimiter };
}
export async function readCsvFile(file: File) {
  if (file.size > CSV_LIMITS.bytes) throw Error("Arquivo acima de 2 MB.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      await file.arrayBuffer(),
    );
  } catch {
    throw Error("Arquivo inválido. Exporte como CSV UTF-8.");
  }
  return parseCsv(text);
}
export const clientSlug = (name: string) => name.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "").slice(0, 100).replace(/-$/g, "");
const statuses: Record<string, string> = { ativo: "active", ativa: "active", inativo: "inactive", inativa: "inactive", arquivado: "archived", arquivada: "archived" };
export function previewCsv(
  document: CsvDocument,
  mapping: ColumnMapping,
  existing: { id: string; name: string; slug: string }[],
): PreviewRow[] {
  const seen = new Map<string, number>();
  return document.records.map((record) => {
    const get = (f: ClientField) =>
      mapping[f] === undefined ? "" : (record.cells[mapping[f]!] || "").trim();
    const data: ImportClient = {
      row: record.row,
      name: get("name"),
      slug: mapping.slug === undefined ? clientSlug(get("name")) : get("slug"),
    };
    if (get("logo_url")) data.logo_url = get("logo_url");
    if (get("status")) data.status = statuses[normalize(get("status"))] || get("status").toLowerCase();
    const errors: string[] = [];
    if (record.cells.length !== document.headers.length)
      errors.push("Quantidade de campos diferente do cabeçalho.");
    if (!data.name || data.name.length > 200)
      errors.push("Nome obrigatório, até 200 caracteres.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || data.slug.length > 100)
      errors.push(
        "Slug obrigatório: letras minúsculas, números e hífens; até 100 caracteres.",
      );
    if (
      data.status &&
      !["active", "inactive", "archived"].includes(data.status)
    )
      errors.push("Status deve ser active, inactive ou archived.");
    if (data.logo_url) {
      try {
        const url = new URL(data.logo_url);
        if (
          !["https:", "http:"].includes(url.protocol) ||
          url.username ||
          url.password ||
          data.logo_url.length > 2048
        )
          throw Error();
      } catch {
        errors.push("URL do logotipo inválida (HTTP/HTTPS).");
      }
    }
    if (seen.has(data.slug))
      errors.push(`Slug repetido no arquivo (linha ${seen.get(data.slug)}).`);
    else seen.set(data.slug, record.row);
    const duplicate = existing.find((c) => c.slug === data.slug);
    const sameName = existing.find(
      (c) => normalize(c.name) === normalize(data.name) && c.slug !== data.slug,
    );
    return { data, errors, duplicate, possibleSameName: sameName?.name };
  });
}
