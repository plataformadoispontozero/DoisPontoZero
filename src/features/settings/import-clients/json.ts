import { CSV_LIMITS, parseCsv, type CsvDocument } from './csv'

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const scalar = (value: unknown): value is string | number | boolean | null => value === null || ['string', 'number', 'boolean'].includes(typeof value)

/** Convert exported client records into the same reviewed mapping/validation pipeline as CSV. */
export function parseClientJson(input: string): CsvDocument {
  if (new TextEncoder().encode(input).byteLength > CSV_LIMITS.bytes) throw Error('Arquivo acima de 2 MB.')
  let value: unknown
  try { value = JSON.parse(input.replace(/^\uFEFF/, '')) } catch { throw Error('JSON inválido. Exporte um array de clientes ou um objeto com data/clients/clientes.') }
  if (isRecord(value)) value = value.clients ?? value.clientes ?? value.data
  if (isRecord(value)) value = value.clients ?? value.clientes
  if (!Array.isArray(value) || !value.length) throw Error('O JSON precisa conter uma lista não vazia de clientes em um array, data, clients ou clientes.')
  if (value.length > CSV_LIMITS.rows) throw Error('Limite de 500 registros excedido.')
  const headers: string[] = []
  const rows = value.map((item, index) => {
    if (!isRecord(item)) throw Error(`Registro ${index + 1}: cada cliente precisa ser um objeto.`)
    const row = new Map<string, string>()
    for (const [key, cell] of Object.entries(item)) {
      if (key === 'profile') continue
      if (!scalar(cell)) throw Error(`Registro ${index + 1}, campo ${key}: use texto, número ou valor nulo; objetos aninhados só são aceitos em profile.`)
      row.set(key, cell === null ? '' : String(cell))
    }
    if (item.profile !== undefined && item.profile !== null) {
      if (!isRecord(item.profile)) throw Error(`Registro ${index + 1}: profile precisa ser um objeto.`)
      for (const [key, cell] of Object.entries(item.profile)) {
        if (!scalar(cell)) throw Error(`Registro ${index + 1}, profile.${key}: valor não suportado.`)
        // Explicit top-level data wins; no tenant or database IDs are trusted by the importer.
        if (!row.has(key) || !row.get(key)) row.set(key, cell === null ? '' : String(cell))
      }
    }
    for (const key of row.keys()) if (!headers.includes(key)) headers.push(key)
    return row
  })
  if (!headers.length || headers.some(h => !h.trim())) throw Error('Campos JSON vazios ou ausentes.')
  if (headers.length > CSV_LIMITS.columns) throw Error('Limite de 30 colunas excedido. Exporte apenas os dados dos clientes.')
  return { headers, delimiter: ',', records: rows.map((row, index) => ({row:index + 1, cells:headers.map(h => row.get(h) ?? '')})) }
}

export async function readClientImportFile(file: File): Promise<CsvDocument> {
  if (file.size > CSV_LIMITS.bytes) throw Error('Arquivo acima de 2 MB.')
  let text: string
  try { text = new TextDecoder('utf-8', {fatal:true}).decode(await file.arrayBuffer()) }
  catch { throw Error('Arquivo inválido. Exporte como CSV ou JSON em UTF-8.') }
  return /\.json$/i.test(file.name) || file.type === 'application/json' ? parseClientJson(text) : parseCsv(text)
}
