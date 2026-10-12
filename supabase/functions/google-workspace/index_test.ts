// Isolated protocol test. No real Google/Supabase credentials or network calls.
Deno.test('Google OAuth checks session/permission, uses PKCE, encrypts credentials and consumes state once', async () => {
 const originalFetch=globalThis.fetch,originalServe=Deno.serve
 const vars:Record<string,string>={SUPABASE_URL:'https://supabase.invalid',SUPABASE_ANON_KEY:'test-public-key',SUPABASE_SERVICE_ROLE_KEY:'test-server-key',GOOGLE_WORKSPACE_CLIENT_ID:'test-client',GOOGLE_WORKSPACE_CLIENT_SECRET:'test-secret',GOOGLE_WORKSPACE_REDIRECT_URI:'https://supabase.invalid/functions/v1/google-workspace',GOOGLE_WORKSPACE_TOKEN_KEY:btoa('a'.repeat(32)),GOOGLE_WORKSPACE_APP_ORIGIN:'https://agency.invalid'}
 const previous=Object.fromEntries(Object.keys(vars).map(k=>[k,Deno.env.get(k)]));for(const [k,v]of Object.entries(vars))Deno.env.set(k,v)
 let handler:(req:Request)=>Promise<Response>=async()=>new Response(),authorized=true,state:any=null,saved:any=null,tokenCalls=0
 const assert=(condition:unknown,message:string)=>{if(!condition)throw Error(message)}
 const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}})
 Object.defineProperty(Deno,'serve',{configurable:true,value:(fn:typeof handler)=>{handler=fn}})
 globalThis.fetch=async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=String(input),body=String(init?.body||'')
  if(url.endsWith('/auth/v1/user'))return json({id:'11111111-1111-4111-8111-111111111111',email:'test@example.invalid'})
  if(url.includes('/rpc/google_workspace_permission'))return json(authorized)
  if(url.includes('/rpc/google_workspace_secret')){const args=JSON.parse(body);if(args.p_action==='state'){state=args;return json({})}if(args.p_action==='consume'){if(!state||state.p_hash!==args.p_hash)return json({message:'invalid state'},400);const value={agency:state.p_agency,user:state.p_user,ciphertext:state.p_ciphertext};state=null;return json(value)}if(args.p_action==='save'){saved=args.p_ciphertext;return json({})}if(args.p_action==='read')return json({ciphertext:saved});return json({})}
  if(url.includes('/rest/v1/agency_members'))return json({id:'member-test'})
  if(url==='https://oauth2.googleapis.com/token'){tokenCalls++;const params=new URLSearchParams(body);assert(params.has('code_verifier'),'PKCE verifier required');return json({access_token:'provider-access-only',refresh_token:'provider-refresh-only',expires_in:3600,scope:'openid email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events.readonly'})}
  if(url==='https://openidconnect.googleapis.com/v1/userinfo')return json({sub:'account-test',email:'google@example.invalid',email_verified:true})
  throw Error(`Unexpected test request: ${new URL(url).pathname}`)
 }
 try{
  await import('./index.ts')
  const call=(action:string,bearer=true)=>handler(new Request('https://supabase.invalid/functions/v1/google-workspace',{method:'POST',headers:{'Content-Type':'application/json',...(bearer?{Authorization:'Bearer test-jwt'}:{})},body:JSON.stringify({action,agencyId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'})}))
  assert((await call('start',false)).status===401,'session required');authorized=false;assert((await call('start')).status===403,'permission required');authorized=true
  const started=await(await call('start')).json(),url=new URL(started.url)
  assert(url.origin==='https://accounts.google.com','fixed OAuth origin');assert(url.searchParams.get('code_challenge_method')==='S256','S256 required');assert(url.searchParams.get('state')?.length===43,'random state')
  assert(!state.p_ciphertext.includes('verifier'),'state encrypted')
  const callback=`https://supabase.invalid/functions/v1/google-workspace?state=${url.searchParams.get('state')}&code=test-code`
  const completed=await handler(new Request(callback));assert(completed.headers.get('Location')==='https://agency.invalid/settings/integrations/google?google=connected','safe callback destination')
  assert(saved&&!saved.includes('provider-access-only')&&!saved.includes('provider-refresh-only'),'tokens encrypted');assert(tokenCalls===1,'one token exchange')
  await handler(new Request(callback));assert(tokenCalls===1,'no replay exchange')
  const status=await(await call('status')).json();assert(status.connected&&status.email==='google@example.invalid','real account metadata');assert(!JSON.stringify(status).includes('provider-access-only'),'no provider token sent to browser')
 }finally{globalThis.fetch=originalFetch;Object.defineProperty(Deno,'serve',{configurable:true,value:originalServe});for(const [k,v]of Object.entries(previous)){if(v===undefined)Deno.env.delete(k);else Deno.env.set(k,v)}}
})
