// @vitest-environment node
import {describe,it,expect,vi} from 'vitest'
import worker from '../../../worker/index'
describe('static asset fallback boundary',()=>{
 it('turns an HTML SPA fallback for an old chunk into a non-cacheable 404',async()=>{const fetch=vi.fn(async()=>new Response('<html/>',{headers:{'Content-Type':'text/html','Cache-Control':'public, max-age=31536000, immutable'}}));const result=await worker.fetch(new Request('https://example.com/assets/old.js'),{ASSETS:{fetch}});expect(result.status).toBe(404);expect(result.headers.get('Cache-Control')).toBe('no-store');expect(result.headers.get('Content-Type')).toContain('text/plain')})
 it('preserves real hashed assets and ordinary page fallback',async()=>{for(const [path,type]of [['/assets/current.js','application/javascript'],['/profile','text/html']]){const response=new Response('body',{headers:{'Content-Type':type}});expect(await worker.fetch(new Request('https://example.com'+path),{ASSETS:{fetch:async()=>response}})).toBe(response)}})
 it('keeps HEAD empty and actual missing assets uncached',async()=>{const result=await worker.fetch(new Request('https://example.com/assets/missing.css',{method:'HEAD'}),{ASSETS:{fetch:async()=>new Response(null,{status:404})}});expect(result.status).toBe(404);expect(await result.text()).toBe('');expect(result.headers.get('Cache-Control')).toBe('no-store')})
})
