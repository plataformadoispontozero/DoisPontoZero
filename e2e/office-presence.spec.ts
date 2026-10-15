import {test,expect,type Page,type WebSocketRoute} from '@playwright/test'
const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222']
const members=ids.map((user_id,i)=>({user_id,name:['Alice','Bruno'][i],avatar_url:null}))
class PresenceHub{
 sockets=new Map<WebSocketRoute,Map<string,string>>();states=new Map<string,Record<string,{metas:unknown[]}>>()
 install=async(page:Page)=>{await page.routeWebSocket('**/realtime/v1/websocket*',socket=>{const joined=new Map<string,string>();this.sockets.set(socket,joined);socket.onMessage(message=>{const [join,ref,topic,event,payload]=JSON.parse(String(message));const reply=(response={})=>socket.send(JSON.stringify([join,ref,topic,'phx_reply',{status:'ok',response}]));if(event==='phx_join'){joined.set(topic,join);reply({postgres_changes:[]});socket.send(JSON.stringify([join,null,topic,'presence_state',this.states.get(topic)||{}]))}else if(event==='presence'&&payload.event==='track'){const state={key:{metas:[{...payload.payload,phx_ref:ref}]}};this.states.set(topic,state);reply();this.sync(topic)}else if(event==='presence'&&payload.event==='untrack'){this.states.delete(topic);reply();this.sync(topic)}else if(event==='phx_leave'){joined.delete(topic);reply()}else reply()});socket.onClose(()=>{this.sockets.delete(socket)})})}
 sync(topic:string){for(const [socket,joined] of this.sockets){if(joined.has(topic))socket.send(JSON.stringify([joined.get(topic),null,topic,'presence_state',this.states.get(topic)||{}]))}}
}
async function setup(page:Page,index:number,hub:PresenceHub){
 const user={id:ids[index],aud:'authenticated',role:'authenticated',email:`presence-${index}@example.invalid`,app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-15T00:00:00Z'}
 const token=`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated',aud:'authenticated'})).toString('base64url')}.TEST_ONLY`
 await hub.install(page)
 await page.route('https://audit-auth.supabase.co/**',async route=>{const table=new URL(route.request().url()).pathname.split('/').pop();let data:unknown=[]
 if(table==='token')data={access_token:token,refresh_token:'TEST_ONLY',expires_in:3600,token_type:'bearer',user}
 if(table==='user')data=user
 if(table==='profiles')data={id:user.id,full_name:members[index].name}
 if(table==='agency_members')data=[{agency_id:agency,role_id:'33333333-3333-4333-8333-333333333333',status:'active',agencies:{id:agency,name:'Agência QA',status:'active'},roles:{name:'OWNER'}}]
 if(table==='office_presence_directory')data=members
 if(table==='office_directory')data=[]
 await route.fulfill({json:data})})
 await page.goto('/login');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('TEST_ONLY_PASSWORD');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/dashboard/);await page.goto('/office')
}
test('global presence connects two SDK sessions, persists navigation and recovers explicitly',async({browser})=>{
 const hub=new PresenceHub(),a=await browser.newContext(),b=await browser.newContext(),one=await a.newPage(),two=await b.newPage()
 try{await setup(one,0,hub);await setup(two,1,hub);for(const p of [one,two])await expect(p.getByRole('region',{name:'Presença global da equipe'}).getByRole('status')).toHaveText('2 pessoas online');await one.getByRole('button',{name:'Ocupado',exact:true}).click();await expect(two.getByRole('region',{name:'Presença global da equipe'})).toContainText('Ocupado');await one.getByRole('link',{name:'Visão Geral',exact:true}).first().click();await expect(one).toHaveURL(/dashboard/);await one.getByRole('link',{name:'Escritório Digital',exact:true}).first().click();await expect(one.getByRole('region',{name:'Presença global da equipe'}).getByRole('status')).toHaveText('2 pessoas online');await one.getByRole('button',{name:'Sair do escritório',exact:true}).click();await expect(one.getByRole('region',{name:'Presença global da equipe'})).toContainText('Presença desconectada');await one.getByRole('button',{name:'Reconectar presença',exact:true}).click();await expect(one.getByRole('region',{name:'Presença global da equipe'}).getByRole('status')).toHaveText('2 pessoas online')}finally{await a.close();await b.close()}
})
