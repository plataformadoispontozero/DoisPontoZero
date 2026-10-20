import {expect,type Page} from '@playwright/test'
export const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
export const actor='11111111-1111-4111-8111-111111111111'
export const colleague='22222222-2222-4222-8222-222222222222'
export const roles=[{id:'33333333-3333-4333-8333-333333333333',name:'OWNER'},{id:'44444444-4444-4444-8444-444444444444',name:'MEMBER'},{id:'55555555-5555-4555-8555-555555555555',name:'ADMIN'}]
export async function accessWorkspace(page:Page){
 const permissions=[{id:'66666666-6666-4666-8666-666666666666',permission_key:'tasks.view',module:'tasks'},{id:'77777777-7777-4777-8777-777777777777',permission_key:'tasks.edit',module:'tasks'}]
 const grants:{role_id:string;permission_id:string;allowed:boolean}[]=[],ownershipCalls:unknown[]=[],permissionCalls:unknown[]=[]
 let currentRole='OWNER',colleagueRole='MEMBER'
 const user={id:actor,aud:'authenticated',role:'authenticated',email:'access@example.invalid',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-15T00:00:00Z'}
 const token=`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated',aud:'authenticated'})).toString('base64url')}.TEST_ONLY`
 await page.route('https://*.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url()),table=url.pathname.split('/').pop()
  let data:unknown=[]
  if(table==='token')data={access_token:token,refresh_token:'TEST_ONLY',expires_in:3600,token_type:'bearer',user}
  if(table==='user')data=user
  if(table==='profiles')data={id:actor,full_name:'Proprietário QA'}
  if(table==='roles')data=roles
  if(table==='permissions')data=permissions
  if(table==='role_permissions')data=url.searchParams.has('role_id')?grants:[{allowed:true,permissions:{permission_key:'settings.view'}},{allowed:true,permissions:{permission_key:'members.view'}}]
  if(table==='agency_members'){
   const membership={id:'88888888-8888-4888-8888-888888888888',agency_id:agency,user_id:actor,status:'active',joined_at:'2026-10-15T00:00:00Z',role_id:roles.find(r=>r.name===currentRole)!.id,agencies:{id:agency,name:'Agência QA',status:'active'},roles:{name:currentRole},profiles:{full_name:'Proprietário QA'}}
   data=url.searchParams.get('select')?.includes('profiles(')?[membership,{...membership,id:'99999999-9999-4999-8999-999999999999',user_id:colleague,role_id:roles.find(r=>r.name===colleagueRole)!.id,roles:{name:colleagueRole},profiles:{full_name:'Colega QA'}}]:[membership]
  }
  if(table==='get_management_kanban')data={tasks:[],has_more:false,next_offset:0}
  if(table==='set_agency_role_permissions'){
   const body=request.postDataJSON();permissionCalls.push(body)
   for(const change of body.p_changes){const existing=grants.find(g=>g.role_id===change.role_id&&g.permission_id===change.permission_id);if(existing)existing.allowed=change.allowed;else grants.push(change)}
   data=null
  }
  if(table==='manage_agency_ownership'){
   const body=request.postDataJSON();ownershipCalls.push(body);colleagueRole='OWNER';if(body.p_action==='transfer')currentRole='ADMIN';data=true
  }
  await route.fulfill({json:data})
 })
 await page.routeWebSocket('**/realtime/v1/websocket*',socket=>socket.onMessage(message=>{
  const [join,ref,topic,event]=JSON.parse(String(message));socket.send(JSON.stringify([join,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:[]}}]));if(event==='phx_join')socket.send(JSON.stringify([join,null,topic,'presence_state',{}]))
 }))
 await page.goto('/login');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('TEST_ONLY_PASSWORD');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/)
 return {ownershipCalls,permissionCalls}
}
