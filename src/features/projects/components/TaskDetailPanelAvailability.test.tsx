import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ configured: true, isLoading: false, isError: false, refetch: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({ get isSupabaseConfigured() { return state.configured }, supabase: null }))
vi.mock('@/features/integrations/TaskCardCover', () => ({ TaskCardCover: () => null, useTaskCardCovers: () => ({ data: [] }) }))
vi.mock('@/features/integrations/DemandProductionFiles', () => ({ DemandProductionFiles: () => null }))
vi.mock('@/features/production/ProductionTimeline', () => ({ ProductionTimeline: () => null }))
vi.mock('@/features/tasks/hooks/useTasks', () => {
 const query = () => ({ data: [] })
 const mutation = () => ({ mutate: vi.fn(), isPending: false })
 return {
  useTask: () => ({ data: null, isLoading: state.isLoading, isError: state.isError, refetch: state.refetch }),
  useSubtasks: query, useTaskComments: query, useTaskAttachments: query, useTaskLinks: query, useTaskActivity: query,
  useUpdateTask: mutation, useMoveTask: mutation, useArchiveTask: mutation, useToggleChecklistItem: mutation,
  useCreateChecklist: mutation, useAddChecklistItem: mutation, useAddComment: mutation, useDeleteComment: mutation, useAddLink: mutation,
 }
})
import { TaskDetailPanel } from './TaskDetailPanel'
function show() { return render(<TaskDetailPanel open taskId="real-task-id" projectId="project-id" agencyId="agency-id" columns={[]} onClose={vi.fn()} />) }
describe('task detail without loaded task', () => {
 beforeEach(() => { state.configured = true; state.isLoading = false; state.isError = false; state.refetch.mockReset() })
 it('does not invent task content when the backend is unconfigured', () => {
  state.configured = false
  show()
  expect(screen.getByRole('alert')).toHaveTextContent('Servidor indisponível')
  expect(screen.queryByText('Tarefa Selecionada')).not.toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
 })
 it('announces loading without showing an editable task', () => {
  state.isLoading = true
  show()
  expect(screen.getByRole('status')).toHaveTextContent('Carregando demanda')
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
 })
 it('provides a retry for query errors', () => {
  state.isError = true
  show()
  expect(screen.getByRole('alert')).toHaveTextContent('Confira sua conexão')
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(state.refetch).toHaveBeenCalledOnce()
 })
 it('distinguishes missing or inaccessible data from loading', () => {
  show()
  expect(screen.getByRole('alert')).toHaveTextContent('Demanda não encontrada ou sem acesso')
 })
})
