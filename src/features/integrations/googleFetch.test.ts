// @vitest-environment node
import {describe,it,expect,vi} from 'vitest'
import {googleFetch,GoogleRequestTimeoutError,isGoogleTimeout} from '../../../supabase/functions/google-workspace/googleFetch'
const waitingFetch:typeof fetch=async(_input,init)=>new Promise((_resolve,reject)=>{
 const signal=init?.signal
 if(signal?.aborted){reject(signal.reason);return}
 signal?.addEventListener('abort',()=>reject(signal.reason),{once:true})
})
describe('Google request timeout budget',()=>{
 it('aborts a stalled operation with an actionable error and never retries a mutation',async()=>{
  const send=vi.fn(waitingFetch)
  await expect(googleFetch('https://www.googleapis.com/drive/v3/files',{method:'POST',body:'{}'},10,send)).rejects.toBeInstanceOf(GoogleRequestTimeoutError)
  expect(send).toHaveBeenCalledTimes(1)
 })
 it('preserves caller cancellation and reason',async()=>{
  const controller=new AbortController(),reason=new Error('caller cancelled')
  const pending=googleFetch('https://www.googleapis.com/drive/v3/files',{signal:controller.signal},100,waitingFetch)
  controller.abort(reason)
  await expect(pending).rejects.toBe(reason)
  expect(isGoogleTimeout(reason)).toBe(false)
 })
 it('uses cancellation from a Request when init has no signal',async()=>{
  const controller=new AbortController(),reason=new Error('request cancelled')
  const pending=googleFetch(new Request('https://www.googleapis.com/drive/v3/files',{signal:controller.signal}),{},100,waitingFetch)
  controller.abort(reason)
  await expect(pending).rejects.toBe(reason)
 })
 it('keeps method body headers and response unchanged',async()=>{
  const response=new Response('ok'),send=vi.fn<typeof fetch>(async()=>response),headers={Authorization:'Bearer fake'}
  expect(await googleFetch('https://www.googleapis.com/drive/v3/files',{method:'POST',body:'payload',headers},100,send)).toBe(response)
  expect(send.mock.calls[0]?.[1]).toMatchObject({method:'POST',body:'payload',headers})
 })
 it('keeps a stalled response body under the same deadline',async()=>{
  const send:typeof fetch=async(_input,init)=>new Response(new ReadableStream({start(controller){init?.signal?.addEventListener('abort',()=>controller.error(init.signal?.reason),{once:true})}}))
  const response=await googleFetch('https://www.googleapis.com/drive/v3/files',{},10,send)
  try{await response.text();throw Error('expected deadline')}catch(error){expect(isGoogleTimeout(error)).toBe(true)}
 })
 it('does not rewrite transport errors or non-success HTTP responses',async()=>{
  const reason=new TypeError('network failed')
  await expect(googleFetch('https://www.googleapis.com/drive/v3/files',{},100,async()=>{throw reason})).rejects.toBe(reason)
  expect((await googleFetch('https://www.googleapis.com/drive/v3/files',{},100,async()=>new Response(null,{status:429}))).status).toBe(429)
 })
})
