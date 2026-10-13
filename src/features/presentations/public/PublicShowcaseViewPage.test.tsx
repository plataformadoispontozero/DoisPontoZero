import {render,screen,fireEvent,act} from '@testing-library/react'
import {MemoryRouter,Routes,Route,Link} from 'react-router-dom'
import {describe,it,expect,vi} from 'vitest'
import {PublicShowcaseViewPage} from './PublicShowcaseViewPage'
const api=vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('@/lib/supabase/client',()=>({supabase:api}))
describe('public presentation token changes',()=>{
 it('ignores late responses from an earlier link and keeps the current presentation',async()=>{
 let resolveOld:(value:unknown)=>void=()=>{}
 const old=new Promise(resolve=>{resolveOld=resolve})
 const presentation=(title:string)=>({data:{presentation:{title,period_month:10,period_year:2026},sections:[],assets:[]},error:null})
 api.rpc.mockImplementation((name:string,args:{p_token:string})=>name==='get_public_showcase'?(args.p_token==='old-link'?old:Promise.resolve(presentation('Apresentação atual'))):Promise.resolve({data:[],error:null}))
 render(<MemoryRouter initialEntries={['/showcase/old-link']}><Link to="/showcase/new-link">Outro link</Link><Routes><Route path="/showcase/:publicToken" element={<PublicShowcaseViewPage/>}/></Routes></MemoryRouter>)
 fireEvent.click(screen.getByRole('link',{name:'Outro link'}));expect(await screen.findByRole('heading',{name:'Apresentação atual'})).toBeInTheDocument()
 await act(async()=>{resolveOld(presentation('Apresentação antiga'));await old})
 expect(screen.queryByRole('heading',{name:'Apresentação antiga'})).not.toBeInTheDocument();expect(screen.getByRole('heading',{name:'Apresentação atual'})).toBeInTheDocument()
 })
})
