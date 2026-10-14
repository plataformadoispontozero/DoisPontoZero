import {render,screen,act} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {vi,it,expect,beforeEach} from 'vitest'
import {IntegrationsCenterPage} from './IntegrationsCenterPage'
const state=vi.hoisted(()=>({agency:'a',user:'u',allowed:true,invoke:vi.fn()}))
vi.mock('@/features/auth/AuthProvider',()=>({useAgencyId:()=>state.agency,usePermission:()=>state.allowed,useAuth:()=>({user:{id:state.user}})}))
vi.mock('@/lib/supabase/client',()=>({isSupabaseConfigured:true,supabase:{functions:{invoke:state.invoke}}}))
beforeEach(()=>{state.agency='a';state.user='u';state.allowed=true;state.invoke.mockReset()})
it('clears old connection status and ignores late responses across agencies',async()=>{let resolveOld:(value:unknown)=>void=()=>{};const old=new Promise(resolve=>resolveOld=resolve);state.invoke.mockImplementation(()=>old);const {rerender}=render(<MemoryRouter><IntegrationsCenterPage/></MemoryRouter>);state.agency='b';state.invoke.mockResolvedValue({data:{configured:false,connected:false},error:null});rerender(<MemoryRouter><IntegrationsCenterPage/></MemoryRouter>);expect((await screen.findAllByText('Configuração necessária')).length).toBe(2);await act(async()=>{resolveOld({data:{configured:true,connected:true},error:null});await old});expect(screen.queryByText('Conta autorizada')).not.toBeInTheDocument()})
it('handles unavailable permission without making network requests',()=>{state.allowed=false;render(<MemoryRouter><IntegrationsCenterPage/></MemoryRouter>);expect(screen.getAllByText('Sem permissão para verificar')).toHaveLength(2);expect(state.invoke).not.toHaveBeenCalled()})
it('turns rejected network requests into visible verification errors',async()=>{state.invoke.mockRejectedValue(new Error('network'));render(<MemoryRouter><IntegrationsCenterPage/></MemoryRouter>);expect((await screen.findAllByText('Não foi possível verificar')).length).toBe(2)})
