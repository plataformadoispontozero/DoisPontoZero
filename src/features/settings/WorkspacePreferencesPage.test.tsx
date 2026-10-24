import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {beforeEach,describe,expect,it,vi} from 'vitest'
import {WorkspacePreferencesPage} from './WorkspacePreferencesPage'
const state=vi.hoisted(()=>({preferences:{agency_id:'a',language:'en-US',timezone:'America/Sao_Paulo',currency:'BRL',date_format:'DD/MM/YYYY',time_format:'24h',week_starts_on:1,default_project_view:'kanban',default_task_view:'board'},loading:false,error:false,update:vi.fn(),refetch:vi.fn()}))
vi.mock('./hooks/useAgencySettings',()=>({useAgencyPreferences:()=>({preferences:state.preferences,isLoading:state.loading,isError:state.error,updatePreferences:state.update,refetch:state.refetch})}))
vi.mock('@/components/ui/Toast',()=>({toast:{success:vi.fn(),error:vi.fn()}}))
beforeEach(()=>{state.preferences={agency_id:'a',language:'en-US',timezone:'America/Sao_Paulo',currency:'BRL',date_format:'DD/MM/YYYY',time_format:'24h',week_starts_on:1,default_project_view:'kanban',default_task_view:'board'};state.loading=false;state.error=false;state.update.mockReset();state.update.mockResolvedValue({});state.refetch.mockReset()})
describe('workspace language availability',()=>{
 it('preserves the saved unsupported language when saving other preferences',async()=>{
  render(<WorkspacePreferencesPage/>)
  expect(screen.getByLabelText('Idioma da interface')).toHaveValue('en-US')
  expect(screen.getByRole('option',{name:'Inglês — preferência anterior'})).toBeDisabled()
  expect(screen.getAllByRole('option').filter(option=>option.parentElement===screen.getByLabelText('Idioma da interface')&&!option.hasAttribute('disabled')).map(option=>option.getAttribute('value'))).toEqual(['pt-BR'])
  expect(state.update).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button',{name:'Salvar Preferências'}))
  await waitFor(()=>expect(state.update).toHaveBeenCalledWith(expect.objectContaining({language:'en-US'})))
 })
 it('only changes the saved language after an explicit selection',async()=>{
  render(<WorkspacePreferencesPage/>)
  fireEvent.change(screen.getByLabelText('Idioma da interface'),{target:{value:'pt-BR'}})
  fireEvent.click(screen.getByRole('button',{name:'Salvar Preferências'}))
  await waitFor(()=>expect(state.update).toHaveBeenCalledWith(expect.objectContaining({language:'pt-BR'})))
 })
 it('waits for remote data and initializes with its saved language',()=>{
  state.loading=true
  const {rerender}=render(<WorkspacePreferencesPage/>)
  expect(screen.getByRole('status')).toHaveTextContent('Carregando configurações')
  expect(screen.queryByLabelText('Idioma da interface')).not.toBeInTheDocument()
  state.preferences={...state.preferences,language:'es-ES'};state.loading=false
  rerender(<WorkspacePreferencesPage/>)
  expect(screen.getByLabelText('Idioma da interface')).toHaveValue('es-ES')
 })
 it('resets the form when switching agencies and offers retry after errors',()=>{
  const {rerender}=render(<WorkspacePreferencesPage/>)
  state.preferences={...state.preferences,agency_id:'b',language:'pt-BR'}
  rerender(<WorkspacePreferencesPage/>)
  expect(screen.getByLabelText('Idioma da interface')).toHaveValue('pt-BR')
  state.error=true;rerender(<WorkspacePreferencesPage/>)
  expect(screen.getByRole('alert')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Tentar novamente'}));expect(state.refetch).toHaveBeenCalledOnce()
 })
})
