import {it,expect,vi} from 'vitest'
import {presentationVideo} from '../../../supabase/functions/google-workspace/presentationVideo'
const context={agencyId:'agency',fileId:'google_video_12345',folderId:'folder'}
it('streams an authorized video range without exposing Google credentials',async()=>{
 const send=vi.fn(async(url:any,_options?:RequestInit)=>String(url).includes('fields=')?new Response(JSON.stringify({id:context.fileId,mimeType:'video/mp4',parents:['folder']})):new Response(new Uint8Array([1,2,3]),{status:206,headers:{'content-range':'bytes 0-2/500','content-length':'3'}}))
 const response=await presentationVideo(new Request('https://example.test',{headers:{range:'bytes=0-2'}}),{assetId:'asset'},{},{authorize:async()=>context,accessToken:async()=>'SECRET_GOOGLE',fetch:send})
 expect(response.status).toBe(206);expect(response.headers.get('content-type')).toBe('video/mp4');expect(response.headers.get('content-range')).toBe('bytes 0-2/500');expect(response.headers.get('authorization')).toBeNull();expect(new Headers(send.mock.calls[1][1]?.headers).get('range')).toBe('bytes=0-2');expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1,2,3])
})
it('denies unauthorized or moved videos and arbitrary multi-range requests',async()=>{
 const send=vi.fn(async()=>new Response(JSON.stringify({id:context.fileId,mimeType:'video/mp4',parents:['other']})))
 const deps={authorize:async()=>context,accessToken:async()=>'SECRET',fetch:send}
 expect((await presentationVideo(new Request('https://test.invalid'),{assetId:'asset'},{},{...deps,authorize:async()=>null})).status).toBe(403);expect(send).not.toHaveBeenCalled()
 expect((await presentationVideo(new Request('https://test.invalid'),{assetId:'asset'},{},deps)).status).toBe(404)
})
