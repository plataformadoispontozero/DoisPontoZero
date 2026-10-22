import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rpc: vi.fn(), invalidate: vi.fn() }));
vi.mock('@/features/auth/AuthProvider', () => ({ useAgencyId: () => 'agency-a', usePermission: () => true }));
vi.mock('@/lib/supabase/client', () => ({ supabase: { rpc: state.rpc } }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: [], isError: false, isPending: false }), useQueryClient: () => ({ invalidateQueries: state.invalidate }) }));
import ImportClientsPage from './ImportClientsPage';
function file(rows: number) {
  const bytes = new TextEncoder().encode(JSON.stringify(Array.from({ length: rows }, (_, i) => ({ name: `Cliente ${i}` }))));
  return { name: 'clientes.json', type: 'application/json', size: bytes.length, slice: (start: number, end: number) => ({ arrayBuffer: async () => bytes.slice(start, end).buffer }) } as File;
}
beforeEach(() => {
  state.rpc.mockReset(); state.invalidate.mockReset();
  state.rpc.mockImplementation(async (_name, args) => ({ data: { results: args.p_rows.map((row: { row: number }) => ({ row: row.row, status: 'created', message: 'Criado' })) }, error: null }));
});
async function prepare(rows: number) {
  render(<ImportClientsPage />);
  fireEvent.change(screen.getByLabelText('Arquivo CSV ou JSON'), { target: { files: [file(rows)] } });
  await screen.findByText(new RegExp(`${rows} registros no arquivo`));
}
describe('large client import review and batch submission', () => {
  it('never writes before complete review and confirmation, then uses awaited bounded batches', async () => {
    await prepare(250);
    expect(screen.getAllByRole('checkbox').length).toBeLessThan(110);
    expect(state.rpc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Revisar importação' }));
    await screen.findByText(/Revisão completa: 250 registros/);
    expect(state.rpc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e importar clientes' }));
    await screen.findByText(/Importação processada: 250 registros/);
    expect(state.rpc.mock.calls.map(call => call[1].p_rows.length)).toEqual([100, 100, 50]);
    expect(state.rpc.mock.calls[0][1].p_agency_id).toBe('agency-a');
  });
  it('reports earlier acknowledged batches and possible in-flight commit after a later failure', async () => {
    await prepare(250);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar importação' }));
    await screen.findByText(/Revisão completa: 250 registros/);
    const normal = state.rpc.getMockImplementation()!;
    state.rpc.mockImplementationOnce(normal).mockResolvedValueOnce({ data: null, error: new Error('network') });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e importar clientes' }));
    await screen.findByText(/100 registros em lotes anteriores receberam resposta/);
    expect(screen.getByRole('alert')).toHaveTextContent('O lote em andamento pode ter sido processado');
    expect(state.rpc).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmar e importar clientes' })).not.toBeInTheDocument());
  });
  it('permits importing only the reviewed preview instead of the remainder', async () => {
    await prepare(250);
    fireEvent.click(screen.getByLabelText(/Incluir também os registros após a prévia/));
    fireEvent.click(screen.getByRole('button', { name: 'Revisar importação' }));
    await screen.findByText(/Revisão completa: 100 registros/);
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
