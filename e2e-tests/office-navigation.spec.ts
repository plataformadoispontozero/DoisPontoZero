import {test,expect} from '@playwright/test'

test('Escritório Digital abre salas, controles de voz e mensagens pela navegação antiga',async({page})=>{
 const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
 const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'office@example.invalid',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-15T00:00:00Z'}
 const token=`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated',aud:'authenticated'})).toString('base64url')}.TEST_ONLY`
 // APIs controladas: este fluxo não envia credenciais reais nem valida áudio LiveKit.
 await page.route('https://*.supabase.co/**',async route=>{
  const table=new URL(route.request().url()).pathname.split('/').pop()
  let data:unknown=[]
  if(table==='token')data={access_token:token,refresh_token:'TEST_ONLY',expires_in:3600,token_type:'bearer',user}
  if(table==='user')data=user
  if(table==='profiles')data={id:user.id,full_name:'Pessoa QA'}
  if(table==='agency_members')data=[{agency_id:agency,role_id:'33333333-3333-4333-8333-333333333333',status:'active',agencies:{id:agency,name:'Agência QA',status:'active'},roles:{name:'OWNER'}}]
  if(table==='office_presence_directory')data=[{user_id:user.id,name:'Pessoa QA',avatar_url:null}]
  if(table==='office_directory')data=[{id:'44444444-4444-4444-8444-444444444444',name:'Sala QA',office_enabled:true}]
  if(table==='get_management_kanban')data={tasks:[],has_more:false,next_offset:0}
  await route.fulfill({json:data})
 })
 await page.routeWebSocket('**/realtime/v1/websocket*',socket=>{
  socket.onMessage(message=>{
   const [join,ref,topic,event]=JSON.parse(String(message))
   socket.send(JSON.stringify([join,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:[]}}]))
   if(event==='phx_join')socket.send(JSON.stringify([join,null,topic,'presence_state',{}]))
  })
 })
 await page.goto('/login')
 await page.getByLabel('E-mail',{exact:true}).fill(user.email)
 await page.getByLabel('Senha',{exact:true}).fill('TEST_ONLY_PASSWORD')
 await page.getByRole('button',{name:'Entrar',exact:true}).click()
 await expect(page).toHaveURL(/\/dashboard$/)
 await page.getByRole('link',{name:'Escritório Digital',exact:true}).first().click()
 await expect(page).toHaveURL(/\/office$/)
 await expect(page.getByRole('heading',{name:'Escritório Digital',exact:true,level:1})).toBeVisible()
 await expect(page.getByRole('region',{name:'Salas de voz'}).getByRole('button',{name:'Sala QA · Entrar na sala',exact:true})).toBeEnabled()
 await expect(page.getByRole('region',{name:'Presença global da equipe'})).toBeVisible()
 await page.getByRole('link',{name:'Mensagens',exact:true}).click()
 await expect(page).toHaveURL(/\/chat\/messages$/)
 await expect(page.getByRole('heading',{name:'Mensagens · Escritório Digital'})).toBeVisible()
 await page.goto('/chat')
 await expect(page).toHaveURL(/\/office$/)
})
