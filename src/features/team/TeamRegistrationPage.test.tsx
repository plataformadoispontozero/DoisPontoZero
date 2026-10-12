import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TeamRegistrationPage } from './TeamRegistrationPage'
const invoke=vi.hoisted(()=>vi.fn())
vi.mock('@/lib/supabase/client',()=>({supabase:{functions:{invoke}}}))
beforeEach(()=>vi.clearAllMocks())
function form(confirm='test-password'){
 render(<MemoryRouter><TeamRegistrationPage/></MemoryRouter>)
 fireEvent.change(screen.getByLabelText('Nome completo'),{target:{value:'Profissional Teste'}})
 fireEvent.change(screen.getByLabelText('E-mail'),{target:{value:'test@example.com'}})
 fireEvent.change(screen.getByLabelText('Sua função profissional'),{target:{value:'designer'}})
 fireEvent.change(screen.getByLabelText('Criar senha'),{target:{value:'test-password'}})
 fireEvent.change(screen.getByLabelText('Confirmar senha'),{target:{value:confirm}})
 fireEvent.click(screen.getByRole('button',{name:'Enviar cadastro para aprovação'}))
}
describe('Team registration',()=>{
 it('submits only professional description and displays pending approval without granting a session',async()=>{
  invoke.mockResolvedValue({data:{submitted:true},error:null})
  form()
  await screen.findByText('Solicitação recebida')
  expect(invoke).toHaveBeenCalledWith('team-registration',{body:{action:'register',name:'Profissional Teste',email:'test@example.com',password:'test-password',profession:'designer',honey:''}})
  expect(screen.getByText(/aguardando aprovação/)).toBeInTheDocument()
 })
 it('does not submit mismatched passwords',async()=>{
  form('different-password')
  await screen.findByRole('alert')
  expect(invoke).not.toHaveBeenCalled()
 })
 it('does not claim success when the server rejects the registration',async()=>{
  invoke.mockResolvedValue({data:{error:'Muitas solicitações.'},error:null})
  form()
  await screen.findByText('Muitas solicitações.')
  expect(screen.queryByText('Solicitação recebida')).not.toBeInTheDocument()
 })
})
