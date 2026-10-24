import { type CsvDocument, type CsvRecord } from './csv';

export const IMPORT_LIMITS = { bytes: 1024 ** 3, columns: 512, rows: 1_000_000, cellChars: 256 * 1024, recordChars: 2 * 1024 * 1024, previewRows: 100, previewChars: 4 * 1024 * 1024, batchRows: 100, chunkBytes: 64 * 1024 };
export interface ScanOptions { signal?: AbortSignal; onProgress?: (bytes: number, total: number) => void; onRecord?: (record: CsvRecord, headers: string[]) => Promise<void> | void; headers?: string[] }
export interface ScannedDocument extends CsvDocument { totalRecords: number }
function check(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException('Leitura cancelada.', 'AbortError'); }
async function* chunks(file: File, options: ScanOptions) {
  if (file.size > IMPORT_LIMITS.bytes) throw Error('Arquivo acima de 1 GiB.');
  if (typeof file.slice !== 'function' && file.size > IMPORT_LIMITS.chunkBytes) throw Error('Este navegador não suporta leitura em blocos. Use uma versão atualizada.');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (let offset = 0; offset < file.size; offset += IMPORT_LIMITS.chunkBytes) {
    check(options.signal);
    const data = typeof file.slice === 'function' ? await file.slice(offset, offset + IMPORT_LIMITS.chunkBytes).arrayBuffer() : await file.arrayBuffer();
    let text: string;
    try { text = decoder.decode(data, { stream: true }); } catch { throw Error('Arquivo inválido. Use UTF-8.'); }
    yield text;
    options.onProgress?.(Math.min(file.size, offset + data.byteLength), file.size);
    await new Promise(resolve => setTimeout(resolve, 0));
    if (typeof file.slice !== 'function') break;
  }
  try { const tail = decoder.decode(); if (tail) yield tail; } catch { throw Error('Arquivo inválido. Use UTF-8.'); }
  check(options.signal);
}
const headerKey = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[\s-]+/g, '_');
function validateHeaders(headers: string[]) {
  if (headers.some(h => h.length > 200)) throw Error('Nome de coluna acima de 200 caracteres.');
  if (!headers.length || headers.some(h => !h.trim()) || new Set(headers.map(headerKey)).size !== headers.length) throw Error('Cabeçalhos vazios ou duplicados. Corrija o arquivo.');
  if (headers.length > IMPORT_LIMITS.columns) throw Error(`Limite de ${IMPORT_LIMITS.columns} colunas excedido.`);
}

/** Two-pass import: scan the entire file, retain only a bounded preview, then reread with an awaited batch consumer. */
export async function scanClientFile(file: File, options: ScanOptions = {}): Promise<ScannedDocument> {
  const records: CsvRecord[] = [];
  let headers = options.headers ? [...options.headers] : [], totalRecords = 0, previewChars = 0;
  const accept = async (record: CsvRecord, recordHeaders: string[]) => {
    check(options.signal);
    if (++totalRecords > IMPORT_LIMITS.rows) throw Error('Limite de 1.000.000 de registros excedido.');
    const chars = record.cells.reduce((sum, cell) => sum + cell.length, 0);
    if (records.length < IMPORT_LIMITS.previewRows && previewChars + chars <= IMPORT_LIMITS.previewChars) { records.push(record); previewChars += chars; }
    await options.onRecord?.(record, recordHeaders);
  };
  let delimiter: ',' | ';' = ',';
  if (/\.json$/i.test(file.name) || file.type === 'application/json') {
    const reader = new JsonReader(chunks(file, options), options.signal);
    let found = false;
    await reader.value([], false, async (item) => {
      found = true;
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw Error(`Registro ${totalRecords + 1}: cada cliente precisa ser um objeto.`);
      const row = flattenClient(item as Record<string, unknown>, totalRecords + 1);
      if (options.headers) {
        if ([...row.keys()].some(k => !headers.includes(k))) throw Error('Os campos do arquivo mudaram. Selecione o arquivo novamente.');
      } else for (const key of row.keys()) if (!headers.includes(key)) headers.push(key);
      validateHeaders(headers);
      // Earlier preview records are extended when a later JSON object introduces a column.
      for (const record of records) while (record.cells.length < headers.length) record.cells.push('');
      await accept({ row: totalRecords + 1, cells: headers.map(h => row.get(h) ?? '') }, headers);
    });
    if (await reader.token() !== undefined) throw Error('JSON inválido: conteúdo após o documento.');
    if (!found) throw Error('O JSON precisa conter uma lista não vazia em um array, data, clients ou clientes.');
  } else {
    let pending = '', sniffed = false, state: 'field' | 'quoted' | 'closed' = 'field', cell = '', cells: string[] = [], line = 1, start = 1, skipLf = false, rowChars = 0, afterQuoteSpace = false;
    const finishCell = () => { cells.push(cell); cell = ''; state = 'field'; afterQuoteSpace = false; if (cells.length > IMPORT_LIMITS.columns) throw Error('Limite de 512 colunas excedido.'); };
    const process = async (text: string, final = false) => {
      const ready: CsvRecord[] = [];
      const row = () => { finishCell(); if (cells.some(v => v.trim())) ready.push({ row: start, cells }); cells = []; rowChars = 0; };
      for (const c of text) {
        if (skipLf) { skipLf = false; if (c === '\n') continue; }
        // eslint-disable-next-line no-control-regex
        if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/.test(c)) throw Error('Arquivo inválido. Use CSV em UTF-8.');
        if (++rowChars > IMPORT_LIMITS.recordChars) throw Error(`Linha ${start}: registro acima de 2 MiB de texto.`);
        if (state === 'quoted') { if (c === '"') state = 'closed'; else { cell += c; if (c === '\n') line++; } }
        else if (state === 'closed' && c === '"') { if (afterQuoteSpace) throw Error(`Aspas inválidas na linha ${line}.`); cell += '"'; state = 'quoted'; }
        else if (c === delimiter) finishCell();
        else if (c === '\n' || c === '\r') { row(); line++; start = line; skipLf = c === '\r'; }
        else if (state === 'closed') { if (c !== ' ' && c !== '\t') throw Error(`Aspas inválidas na linha ${line}.`); afterQuoteSpace = true; }
        else if (c === '"') { if (cell.trim()) throw Error(`Aspas inválidas na linha ${line}.`); cell = ''; state = 'quoted'; }
        else cell += c;
        if (cell.length > IMPORT_LIMITS.cellChars) throw Error(`Linha ${start}: campo acima de 256 KiB de texto.`);
      }
      if (final) { if (state === 'quoted') throw Error('Campo entre aspas não foi fechado.'); row(); }
      for (const record of ready) {
        check(options.signal);
        if (!sniffed) { headers = record.cells.map(h => h.trim()); validateHeaders(headers); sniffed = true; }
        else await accept(record, headers);
      }
    };
    let detected = false;
    for await (let text of chunks(file, options)) {
      if (!detected) {
        pending += text; text = '';
        let quoted = false, commas = 0, semis = 0, end = false;
        for (const c of pending) { if (c === '"') quoted = !quoted; else if (!quoted) { if (c === '\r' || c === '\n') { end = true; break; } if (c === ',') commas++; if (c === ';') semis++; } }
        if (!end && pending.length <= IMPORT_LIMITS.recordChars) continue;
        if (pending.length > IMPORT_LIMITS.recordChars) throw Error('Cabeçalho acima de 2 MiB.');
        delimiter = semis > commas ? ';' : ','; detected = true; text = pending.replace(/^\uFEFF/, ''); pending = '';
      }
      await process(text);
    }
    if (!detected) { delimiter = pending.includes(';') ? ';' : ','; await process(pending.replace(/^\uFEFF/, '')); }
    await process('', true);
    if (!sniffed) throw Error('Cabeçalho ausente.');
    if (!totalRecords) throw Error('O CSV não contém registros.');
  }
  return { headers, records, totalRecords, delimiter };
}
function flattenClient(item: Record<string, unknown>, index: number) {
  const row = new Map<string, string>();
  const add = (key: string, value: unknown, override = true) => {
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) throw Error(`Registro ${index}, campo ${key}: apenas valores simples; objetos aninhados somente em profile.`);
    const text = value === null ? '' : String(value);
    if (text.length > IMPORT_LIMITS.cellChars) throw Error(`Registro ${index}: campo acima de 256 KiB.`);
    if (override || !row.get(key)) row.set(key, text);
  };
  for (const [key, value] of Object.entries(item)) if (key !== 'profile') add(key, value);
  if (item.profile != null) {
    if (typeof item.profile !== 'object' || Array.isArray(item.profile)) throw Error(`Registro ${index}: profile precisa ser um objeto.`);
    for (const [key, value] of Object.entries(item.profile)) add(key, value, false);
  }
  return row;
}

/** Incremental JSON tokenizer/parser. Only a single client object is materialized. Envelope metadata is skipped. */
class JsonReader {
  private buildingChars = 0;
  private source: AsyncIterator<string>; private buffer = ''; private offset = 0; private held?: string; private ended = false;
  constructor(source: AsyncIterable<string>, private signal?: AbortSignal) { this.source = source[Symbol.asyncIterator](); }
  private async ensure() { while (this.offset >= this.buffer.length && !this.ended) { check(this.signal); const next = await this.source.next(); this.ended = !!next.done; this.buffer = next.value ?? ''; this.offset = 0; } return this.offset < this.buffer.length; }
  async token(): Promise<string | undefined> {
    if (this.held !== undefined) { const t = this.held; this.held = undefined; return t; }
    while (await this.ensure()) { const c = this.buffer[this.offset]; if (/\s|\uFEFF/.test(c)) this.offset++; else break; }
    if (!(await this.ensure())) return undefined;
    let result = '', quoted = false, escaped = false;
    const first = this.buffer[this.offset];
    if ('{}[]:,'.includes(first)) { this.offset++; return first; }
    quoted = first === '"';
    if (quoted) { result = '"'; this.offset++; }
    while (await this.ensure()) {
      // Consume a whole chunk synchronously; await only at chunk boundaries.
      while (this.offset < this.buffer.length) {
        const c = this.buffer[this.offset];
        if (!quoted && /[\s\]}:,]/.test(c)) return result;
        result += c; this.offset++;
        if (result.length > IMPORT_LIMITS.cellChars * 6 + 2) throw Error('Token JSON acima do limite de 256 KiB de texto escapado.');
        if (quoted) { if (!escaped && c === '"') return result; if (!escaped && c === '\\') escaped = true; else escaped = false; }
      }
    }
    if (quoted) throw Error('JSON inválido: texto não fechado.');
    return result || undefined;
  }
  private addBudget(chars: number) { this.buildingChars += chars; if (this.buildingChars > IMPORT_LIMITS.recordChars) throw Error('Registro JSON acima de 2 MiB de texto.'); }
  private async expect(expected: string) { if (await this.token() !== expected) throw Error('JSON inválido: estrutura incompleta.'); }
  async value(path: string[], build: boolean, emit: (item: unknown) => Promise<void>, depth = 0): Promise<unknown> {
    if (depth > 32) throw Error('JSON excede 32 níveis de profundidade.');
    const token = await this.token();
    if (build) this.addBudget(token?.length ?? 0);
    if (token === '{') {
      const object: Record<string, unknown> = Object.create(null); let next = await this.token();
      if (next === '}') return build ? object : undefined;
      for (;;) {
        if (!next?.startsWith('"')) throw Error('JSON inválido: nome de campo esperado.');
        if (build) this.addBudget(next.length);
        let key: string; try { key = JSON.parse(next); } catch { throw Error('JSON inválido: campo malformado.'); }
        await this.expect(':');
        const value = await this.value([...path, key], build, emit, depth + 1);
        if (build) object[key] = value;
        next = await this.token(); if (next === '}') break; if (next !== ',') throw Error('JSON inválido: separador de campos esperado.'); next = await this.token();
      }
      return build ? object : undefined;
    }
    if (token === '[') {
      const target = !build && (path.length === 0 || path.every(k => ['data', 'clients', 'clientes'].includes(k)));
      const array: unknown[] = []; let next = await this.token(); if (next === ']') return build ? array : undefined;
      for (;;) {
        this.held = next;
        if (target) this.buildingChars = 0;
        const value = await this.value([...path, '*'], build || target, emit, depth + 1);
        if (target) await emit(value); else if (build) { array.push(value); if (array.length > IMPORT_LIMITS.columns) throw Error('Lista aninhada acima de 512 elementos.'); }
        next = await this.token(); if (next === ']') break; if (next !== ',') throw Error('JSON inválido: separador de registros esperado.'); next = await this.token();
      }
      return build ? array : undefined;
    }
    if (token === undefined) throw Error('JSON inválido: valor ausente.');
    let value: unknown; try { value = JSON.parse(token); } catch { throw Error('JSON inválido: valor malformado.'); }
    if (typeof value === 'object' && value !== null) throw Error('JSON inválido.');
    if (typeof value === 'string' && value.length > IMPORT_LIMITS.cellChars) throw Error('Campo JSON acima de 256 KiB de texto.');
    return build ? value : undefined;
  }
}

