// @vitest-environment node
import {describe,it,expect,vi} from 'vitest'
import {createTokenHandler,type VoiceContext,type TokenDependencies} from '../../../supabase/functions/office-room-token/handler'
const production='https://doispontozero.renatodesigner.com.br'
const homologation='https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev'
const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',room='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const firstUser='11111111-1111-4111-8111-111111111111',secondUser='22222222-2222-4222-8222-222222222222'
const config={url:'wss://voice.example.invalid',apiKey:'server-key',apiSecret:'s'.repeat(32)}
function setup(){
 const context=(authorization:string):VoiceContext=>({agency_id:agency,user_id:authorization==='Bearer second'?secondUser:firstUser,room_id:room,room_name:`office_${agency}_${room}`,room_type:'team'})
 const issue=vi.fn<TokenDependencies['issue']>(async()=> 'test-token')
 const authorize=vi.fn<TokenDependencies['authorize']>(async authorization=>({context:context(authorization)}))
 const authenticate=vi.fn<TokenDependencies['authenticate']>(async authorization=>context(authorization).user_id)
 const handler=createTokenHandler({authenticate,authorize,configuration:()=>config,issue})
 const request=(origin:string,authorization='Bearer first',body:Record<string,unknown>={roomId:room})=>handler(new Request('https://edge.example.invalid/office-room-token',{method:'POST',headers:{'Content-Type':'application/json',Authorization:authorization,...(origin?{Origin:origin}:{})},body:JSON.stringify(body)}))
 return {issue,authorize,authenticate,request,context}
}
describe('office token review environment isolation',()=>{
 it('signs different rooms for production and homologation without changing the authenticated identity',async()=>{
  const r=setup()
  expect((await r.request(production)).status).toBe(200)
  expect((await r.request(homologation)).status).toBe(200)
  const productionContext=r.issue.mock.calls[0][0],stageContext=r.issue.mock.calls[1][0]
  expect(productionContext.room_name).toBe(`office_${agency}_${room}`)
  expect(stageContext.room_name).toBe(`homologacao_office_${agency}_${room}`)
  expect(stageContext.user_id).toBe(firstUser)
  expect(stageContext.agency_id).toBe(agency)
  expect(stageContext.room_id).toBe(room)
  expect(r.context('Bearer first').room_name).toBe(productionContext.room_name)
 })
 it('preserves the production room for native/no-Origin requests',async()=>{
  const r=setup();expect((await r.request('')).status).toBe(200)
  expect(r.issue.mock.calls[0][0]).toMatchObject({room_name:`office_${agency}_${room}`,user_id:firstUser})
 })
 it('keeps two authenticated users as different identities in the same homologation room',async()=>{
  const r=setup()
  expect((await r.request(homologation,'Bearer first')).status).toBe(200)
  expect((await r.request(homologation,'Bearer second')).status).toBe(200)
  const [first,second]=r.issue.mock.calls.map(call=>call[0])
  expect(first.user_id).toBe(firstUser);expect(second.user_id).toBe(secondUser)
  expect(first.room_name).toBe(second.room_name)
  expect(r.authorize.mock.calls.map(call=>call[2])).toEqual([false,true,false,true])
 })
 it('isolates authorized private calls after validating their base namespace',async()=>{
  const r=setup();r.authorize.mockResolvedValue({context:{...r.context('Bearer first'),room_type:'private_call',room_name:`office_call_${agency}_${room}`}})
  expect((await r.request(homologation)).status).toBe(200)
  expect(r.issue.mock.calls[0][0]).toMatchObject({room_name:`homologacao_office_call_${agency}_${room}`,user_id:firstUser})
 })
 it('rejects client-supplied room names, identities or environment parameters',async()=>{
  const r=setup()
  for(const spoof of [{room_name:'arbitrary'},{user_id:secondUser},{environment:'production'}])expect((await r.request(homologation,'Bearer first',{roomId:room,...spoof})).status).toBe(400)
  expect(r.issue).not.toHaveBeenCalled();expect(r.authorize).not.toHaveBeenCalled()
 })
 it('rejects unknown origins before authentication or issuance',async()=>{
  const r=setup();expect((await r.request('https://other.example.invalid')).status).toBe(403)
  expect(r.authenticate).not.toHaveBeenCalled();expect(r.issue).not.toHaveBeenCalled()
 })
 it('does not let environment isolation bypass identity and namespace checks',async()=>{
  for(const invalid of [{user_id:secondUser},{room_name:'unscoped-room'},{room_name:`homologacao_office_${agency}_${room}`},{room_id:firstUser}]){
   const r=setup();r.authorize.mockResolvedValue({context:{...r.context('Bearer first'),...invalid}})
   expect((await r.request(homologation)).status).toBe(403);expect(r.issue).not.toHaveBeenCalled()
  }
 })
})
