import {render,screen,waitFor,act} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {it,expect,vi} from 'vitest'
import {usePresentationImage} from './presentationMedia'
const api=vi.hoisted(()=>({invoke:vi.fn()}))
vi.mock('@/lib/supabase/client',()=>({supabase:{functions:api}}))
const asset={id:'11111111-1111-4111-8111-111111111111',file_reference:{}}
function Image({token}:{token?:string}){const image=usePresentationImage(asset,token);return <span>{image.url||'carregando'}</span>}
it('deduplicates simultaneous requests and reuses media after navigating back, isolated by public link',async()=>{
 vi.stubGlobal('URL',Object.assign(URL,{createObjectURL:vi.fn(()=> 'blob:test'),revokeObjectURL:vi.fn()}))
 api.invoke.mockResolvedValue({data:new Blob(['image'],{type:'image/png'}),response:{headers:new Headers({'X-Presentation-Media-Type':'image/png'})}})
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}})
 const view=(show:boolean,token?:string)=><QueryClientProvider client={client}>{show&&<><Image token={token}/><Image token={token}/></>}</QueryClientProvider>
 const app=render(view(true));await waitFor(()=>expect(screen.getAllByText('blob:test')).toHaveLength(2));expect(api.invoke).toHaveBeenCalledTimes(1)
 app.rerender(view(false));app.rerender(view(true));await waitFor(()=>expect(screen.getAllByText('blob:test')).toHaveLength(2));expect(api.invoke).toHaveBeenCalledTimes(1)
 await act(async()=>app.rerender(view(true,'different-public-link')));await waitFor(()=>expect(api.invoke).toHaveBeenCalledTimes(2));client.clear()
})
