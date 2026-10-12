import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AcceptInvitationPage } from './AcceptInvitationPage'
const mocks=vi.hoisted(()=>({getUser:vi.fn(),updateUser:vi.fn(),verifyOtp:vi.fn(),rpc:vi.fn()}))
vi.mock('@/features/auth/AuthProvider',()=>({useAuth:()=>({user:null,reloadAccess:vi.fn()})}))
vi.mock('@/lib/supabase/client',()=>({supabase:{auth:mocks,rpc:mocks.rpc}}))
beforeEach(()=>{
 vi.clearAllMocks()
 window.history.replaceState(null,'','/accept-invitation?id=f90b702c-ff8c-4dde-9a51-918b3c4f1f93&setup=1')
 mocks.updateUser.mockResolvedValue({error:{message:'Test stops before accepting'}})
})
function submit(){
 render(<MemoryRouter><AcceptInvitationPage/></MemoryRouter>)
 fireEvent.change(screen.getByLabelText('Seu nome'),{target:{value:'Pessoa'}})
 fireEvent.change(screen.getByLabelText('Criar senha'),{target:{value:'password-test'}})
 fireEvent.change(screen.getByLabelText('Confirmar senha'),{target:{value:'password-test'}})
 fireEvent.click(screen.getByRole('button',{name:'Aceitar convite e entrar'}))
}
describe('Email invitation redirect',()=>{
 it('requires the session established by the emailed Auth link before setting a password',async()=>{
  mocks.getUser.mockResolvedValue({data:{user:null},error:{message:'missing'}})
  submit()
  await screen.findByText('Abra o link recebido por e-mail para definir sua senha.')
  expect(mocks.updateUser).not.toHaveBeenCalled()
  expect(mocks.rpc).not.toHaveBeenCalled()
 })
 it('offers password setup for a verified email redirect and preserves the invitation id',async()=>{
  mocks.getUser.mockResolvedValue({data:{user:{id:'recipient'}},error:null})
  submit()
  await waitFor(()=>expect(mocks.updateUser).toHaveBeenCalledWith({password:'password-test',data:{full_name:'Pessoa'}}))
  expect(mocks.verifyOtp).not.toHaveBeenCalled()
 })
})
