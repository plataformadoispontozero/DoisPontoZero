import { afterEach, describe, expect, it, vi } from 'vitest';
import { IMPORT_LIMITS, scanClientFile } from './stream';
import { autoMapping, previewCsv } from './csv';
function file(name: string, text: string): File {
  const bytes = new TextEncoder().encode(text);
  return { name, type: '', size: bytes.length, arrayBuffer: vi.fn(() => { throw Error('Whole-file reading forbidden'); }), slice: (start: number, end: number) => ({ arrayBuffer: async () => bytes.slice(start, end).buffer }) } as unknown as File;
}
const initialChunk = IMPORT_LIMITS.chunkBytes;
afterEach(() => { IMPORT_LIMITS.chunkBytes = initialChunk; });
describe('bounded streaming client import', () => {
  it.each(['csv', 'json'])('reads UTF-8 across byte boundaries without whole-file buffering: %s', async format => {
    IMPORT_LIMITS.chunkBytes = 3;
    const input = format === 'csv' ? 'name;city\r\n"São José\nAgência ""2.0""";Natal' : JSON.stringify({ data: { clientes: [{ name: 'São José\nAgência "2.0"', profile: { city: 'Natal' } }] } });
    const result = await scanClientFile(file(`clients.${format}`, input));
    expect(result.totalRecords).toBe(1);
    expect(result.records[0].cells).toEqual(['São José\nAgência "2.0"', 'Natal']);
  });
  it('scans all rows while retaining a bounded preview and awaits each consumer', async () => {
    const source = file('clients.json', JSON.stringify(Array.from({ length: 1200 }, (_, i) => ({ name: `Cliente ${i}` }))));
    let active = 0, maxActive = 0, count = 0;
    const progress: number[] = [];
    const result = await scanClientFile(source, { onProgress: n => progress.push(n), onRecord: async () => { active++; maxActive = Math.max(maxActive, active); await Promise.resolve(); count++; active--; } });
    expect(result.totalRecords).toBe(1200); expect(count).toBe(1200); expect(result.records).toHaveLength(100); expect(maxActive).toBe(1);
    expect(progress.at(-1)).toBe(source.size);
  });
  it('finds later JSON fields and aligns the preview on the second pass', async () => {
    const source = file('clients.json', '[{"name":"A"},{"name":"B","profile":{"city":"Natal"}}]');
    const scan = await scanClientFile(source); expect(scan.headers).toEqual(['name', 'city']); expect(scan.records[0].cells).toEqual(['A', '']);
    const lengths: number[] = [];
    await scanClientFile(source, { headers: scan.headers, onRecord: record => { lengths.push(record.cells.length); } });
    expect(lengths).toEqual([2, 2]);
  });
  it('accepts 200 columns and rejects more than 512', async () => {
    const columns = (n: number) => JSON.stringify([Object.fromEntries(Array.from({ length: n }, (_, i) => [`field${i}`, 'value']))]);
    expect((await scanClientFile(file('clients.json', columns(200)))).headers).toHaveLength(200);
    await expect(scanClientFile(file('clients.json', columns(513)))).rejects.toThrow('512');
    await expect(scanClientFile(file('clients.csv', Array.from({length:513}, (_, i) => `field${i}`).join(',') + '\n' + Array(513).fill('x').join(',')))).rejects.toThrow('512');
  });
  it.each(['[{"name":"A"}] trailing', '[{"name":"A"},]', '{"clients":[{"name":"A"}]', '[{"name":{"bad":true}}]', '[{"name":"bad\\x"}]'])('rejects malformed or unsupported JSON %s', async input => {
    await expect(scanClientFile(file('clients.json', input))).rejects.toThrow();
  });
  it('rejects malformed input after the preview instead of approving only the sample', async () => {
    const input = '[' + Array.from({ length: 101 }, () => '{"name":"A"}').join(',') + ',invalid]';
    await expect(scanClientFile(file('clients.json', input))).rejects.toThrow('JSON inválido');
  });
  it('cancels before reading further records', async () => {
    const controller = new AbortController(); let count = 0;
    await expect(scanClientFile(file('clients.csv', 'name\n' + Array(1000).fill('Cliente').join('\n')), { signal: controller.signal, onRecord: () => { if (++count === 2) controller.abort(); } })).rejects.toMatchObject({ name: 'AbortError' });
    expect(count).toBe(2);
  });
  it('scans an actual file above the former 2 MiB limit without retaining every row', async () => {
    const source = file('clients.json', JSON.stringify(Array.from({ length: 6000 }, (_, i) => ({ name: `Cliente ${i}`, note: 'a'.repeat(400) }))));
    expect(source.size).toBeGreaterThan(2 * 1024 * 1024);
    const result = await scanClientFile(source);
    expect(result.totalRecords).toBe(6000); expect(result.records).toHaveLength(100);
  });
  it('keeps CSV column-count errors visible across the complete review', async () => {
    const errors: string[][] = [];
    await scanClientFile(file('clients.csv', 'name,city\nA,Natal\nB,Natal,extra\nC'), { onRecord: (record, headers) => { errors.push(previewCsv({ headers, records: [record], delimiter: ',' }, autoMapping(headers), [])[0].errors); } });
    expect(errors[0]).toEqual([]); expect(errors[1].join()).toContain('Quantidade de campos'); expect(errors[2].join()).toContain('Quantidade de campos');
  });
  it('blocks files above 1 GiB before reading', async () => {
    const source = { name: 'clients.json', size: IMPORT_LIMITS.bytes + 1 } as File;
    await expect(scanClientFile(source)).rejects.toThrow('1 GiB');
  });
  it.each(['csv', 'json'])('rejects oversized individual fields in %s', async format => {
    const text = 'x'.repeat(IMPORT_LIMITS.cellChars + 1);
    await expect(scanClientFile(file(`clients.${format}`, format === 'csv' ? `name\n${text}` : JSON.stringify([{ name: text }])))).rejects.toThrow(/256 KiB/);
  });
  it('validates duplicate slugs across separate streaming batches', async () => {
    const source = file('clients.csv', 'name\nMesmo\nOutro\nMesmo');
    const seen = new Map<string, number>(); const errors: string[][] = [];
    await scanClientFile(source, { onRecord: (record, headers) => { errors.push(previewCsv({ headers, records: [record], delimiter: ',' }, autoMapping(headers), [], seen)[0].errors); } });
    expect(errors[0]).toEqual([]); expect(errors[2].join()).toContain('Slug repetido');
  });
});
