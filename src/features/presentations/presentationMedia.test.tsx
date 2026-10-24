import {afterEach,it,expect,vi} from 'vitest'
import {render as rtlRender,screen,waitFor,cleanup} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
const render=(ui:React.ReactNode)=>rtlRender(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{ui}</QueryClientProvider>)
import {PresentationPreview} from './PresentationPreview'
const h=vi.hoisted(()=>({invoke:vi.fn()}))
vi.mock('@/lib/supabase/client',()=>({supabase:{functions:{invoke:h.invoke}}}))
afterEach(()=>{cleanup();vi.unstubAllGlobals();h.invoke.mockReset()})
it('renders an existing Drive asset through authorized media and revokes the local URL on exit',async()=>{
 const create=vi.fn(()=> 'blob:authorized-test-image'),revoke=vi.fn();vi.stubGlobal('URL',class extends URL{static createObjectURL=create;static revokeObjectURL=revoke})
 h.invoke.mockResolvedValue({data:new Blob(['image'],{type:'image/png'}),error:null})
 const result=render(<PresentationPreview presentation={{title:'Entrega',period_month:10,period_year:2026}} sections={[]} assets={[{id:'11111111-1111-4111-8111-111111111111',title:'Arte',thumbnail_reference:'https://lh3.googleusercontent.com/EXPIRED',web_view_link:'https://drive.google.com/file/d/google_file_12345/view'}]} publicToken="PUBLIC_LINK_TEST_ONLY_123456789"/>)
 await waitFor(()=>expect(screen.getByRole('img',{name:'Arte'})).toHaveAttribute('src','blob:authorized-test-image'))
 expect(h.invoke).toHaveBeenCalledWith('google-workspace',expect.objectContaining({body:{action:'presentation-media',assetId:'11111111-1111-4111-8111-111111111111',preview:true,publicToken:'PUBLIC_LINK_TEST_ONLY_123456789'}}));expect(document.querySelector('img[src*="EXPIRED"]')).toBeNull();result.unmount();expect(revoke).toHaveBeenCalledWith('blob:authorized-test-image')
})
it('does not fall back to an expired Google image when the link is denied',async()=>{
 h.invoke.mockResolvedValue({data:null,error:new Error('denied')})
 render(<PresentationPreview presentation={{title:'Entrega',period_month:10,period_year:2026}} sections={[]} assets={[{id:'11111111-1111-4111-8111-111111111111',title:'Arte privada',thumbnail_reference:'https://lh3.googleusercontent.com/EXPIRED',web_view_link:'https://drive.google.com/file/d/google_file_12345/view'}]}/>)
 await waitFor(()=>expect(h.invoke).toHaveBeenCalled());expect(screen.queryByRole('img',{name:'Arte privada'})).toBeNull();expect(await screen.findByText('Prévia do material indisponível.',{},{timeout:4000})).toBeInTheDocument()
})
