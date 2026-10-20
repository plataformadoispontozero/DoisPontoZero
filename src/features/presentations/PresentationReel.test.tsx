import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {it,expect,vi} from 'vitest'
import {PresentationReel} from './PresentationReel'
vi.mock('@/lib/supabase/client',()=>({supabase:{functions:{invoke:async()=>({data:{url:'https://example.com/video-ticket'}})}}}))
it('plays inline in a silent loop and enables audio only through a user action',async()=>{
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{})
 render(<QueryClientProvider client={new QueryClient()}><PresentationReel assetId="reel" title="Reel do cliente"/></QueryClientProvider>)
 const video=screen.getByLabelText('Reel do cliente') as HTMLVideoElement
 await waitFor(()=>expect(video).toHaveAttribute('src','https://example.com/video-ticket'));expect(video.muted).toBe(true);expect(video.loop).toBe(true);expect(video.playsInline).toBe(true)
 fireEvent.click(screen.getByRole('button',{name:'Ativar áudio'}));expect(video.muted).toBe(false);expect(screen.getByRole('button',{name:'Silenciar'})).toBeVisible()
})
