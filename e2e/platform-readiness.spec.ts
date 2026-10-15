import { test, expect, type Page } from '@playwright/test'

// Controlled API responses test client-side session/tenant boundaries.
// These cases are NOT real backend/RLS tests.
const userId = '11111111-1111-4111-8111-111111111111'
const agencyA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const agencyB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const roleId = '22222222-2222-4222-8222-222222222222'
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'agency-test@example.invalid', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() }
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now()/1000)+3600, role: 'authenticated', aud: 'authenticated' })).toString('base64url')}.audit-signature`

async function api(page: Page, options: { member?: boolean; owner?: boolean; failClients?: boolean; invalidLogin?: boolean; invalidSession?: boolean; unavailable?: boolean; inactive?: boolean; agenda?: boolean; social?: boolean } = {}) {
  const reads: string[] = []
  let savedClient: any = null
  await page.route('https://audit-auth.supabase.co/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const table = url.pathname.split('/').pop()
    const respond = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'content-range': '0-0/0' }, body: JSON.stringify(data) })
    if (options.unavailable && url.pathname.endsWith('/user')) return route.abort('failed')
    if (options.invalidSession && url.pathname.endsWith('/user')) return respond({message:'invalid token'},401)
    if (options.invalidLogin && url.pathname.endsWith('/token')) return respond({error:'invalid_grant',error_description:'Invalid login credentials'},400)
    if (url.pathname.endsWith('/token')) return respond({ access_token: token, refresh_token: 'audit-refresh-only', token_type: 'bearer', expires_in: 3600, user })
    if (url.pathname.endsWith('/user')) return respond(user)
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 })
    if (options.social && table === 'monthly_editorial_campaigns') { reads.push('social:'+url.searchParams.get('agency_id')+':'+url.searchParams.get('client_id')+':'+url.searchParams.get('month')); return respond([{id:'77777777-7777-4777-8777-777777777777',client_id:'33333333-3333-4333-8333-333333333333',month:'2026-10-01',status:'changes_requested',project_id:'66666666-6666-4666-8666-666666666666',items:[{title:'Conteúdo de teste'},{title:'Outro conteúdo de teste'}]}]) }
    if (table === 'chat_directory') return respond({channels:[{id:'99999999-9999-4999-8999-999999999999',agency_id:agencyA,name:'Design',description:'Criação e direção visual',channel_type:'project',visibility:'agency',unread_count:2}],conversations:[]})
    if (table === 'chat_work_room_presence') return respond([])
    if (table === 'profiles') return respond([{ full_name: 'Usuário de teste' }])
    if (table === 'agency_members' && url.searchParams.get('select')?.includes('profiles:user_id')) return respond([{user_id:'88888888-8888-4888-8888-888888888888',profiles:{full_name:'Membro de teste',avatar_url:null}}])
    if (table === 'agency_members') return respond(options.member === false || options.inactive ? [] : [agencyA,agencyB].map((id,index) => ({ agency_id: id, role_id: roleId, agencies: { id, name: `Agência ${index ? 'B':'A'}`, status: 'active' }, roles: { id: roleId, name: options.owner === false ? 'VIEWER':'OWNER' } })))
    if (table === 'role_permissions') return respond([{ allowed: true, permissions: { permission_key: 'dashboard.view' } }])
    if (options.agenda && table === 'meetings') return respond([
      {id:'55555555-5555-4555-8555-555555555555',title:'Reunião pessoal real',starts_at:new Date().toISOString(),organizer_id:userId,meeting_participants:[]},
      {id:'66666666-6666-4666-8666-666666666666',title:'Reunião de outro usuário',starts_at:new Date().toISOString(),organizer_id:'other-user',meeting_participants:[]},
    ])
    if (options.agenda && table === 'tasks') return respond([{id:'77777777-7777-4777-8777-777777777777',title:'Prazo da minha tarefa',due_date:new Date().toISOString().slice(0,10),task_assignees:[{user_id:userId}]}])
    if (table === 'get_management_kanban') return respond({tasks:[],has_more:false,next_offset:0})
    if (table === 'notifications') {
      reads.push('notification:' + url.searchParams.get('recipient_id'))
      if (url.searchParams.has('user_id')) return respond({code:'42703',message:'column user_id does not exist'},400)
      return respond([])
    }
    if (table === 'clients') {
      if (request.method() === 'POST') {
        savedClient = { ...request.postDataJSON(), id: '44444444-4444-4444-8444-444444444444', created_at:new Date().toISOString(), updated_at:new Date().toISOString() }
        return respond(savedClient)
      }
      if (request.method() === 'PATCH') {
        savedClient = { ...savedClient, ...request.postDataJSON() }
        return respond(savedClient)
      }
      if (savedClient && url.searchParams.get('id')) return respond(savedClient)
      if (savedClient && !url.searchParams.get('id')) return respond([savedClient])

      if (options.failClients) return respond({ code:'42501', message:'access denied' },403)
      const scope = url.searchParams.get('agency_id') || ''; reads.push(scope)
      const fixture = { id: '33333333-3333-4333-8333-333333333333', agency_id: scope.replace('eq.',''), name: scope.includes(agencyB) ? 'Cliente da agência B':'Cliente da agência A', slug:'cliente', status:'active', logo_url:null, created_at:new Date().toISOString(), updated_at:new Date().toISOString() }; return respond(url.searchParams.has('id') ? fixture : [fixture])
    }
    return respond([])
  })
  return reads
}
async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill('audit-password-only')
  await page.getByRole('button', { name:'Entrar', exact:true }).click()
}

// Route smoke uses controlled authenticated APIs; it does not prove production RLS.
for (const path of ['/dashboard','/clients','/briefings','/editorial','/social-media','/projects','/tasks','/production/design','/production/video','/production/traffic','/meetings/new','/settings','/strategy/new','/editorial/new','/chat']) {
 test('authenticated route refresh '+path,async({page})=>{
  const crashes:string[]=[];page.on('pageerror',e=>crashes.push(e.message));
  const reads=await api(page);await login(page);await expect(page).toHaveURL(/\/dashboard$/, {timeout:15000});await page.goto(path);
  await expect(page).toHaveURL(new RegExp(path+'$'));
  await expect(page.locator('main')).toBeVisible();await expect(page.locator('main')).not.toContainText('Unexpected Application Error');
  await page.reload();await expect(page.locator('main')).toBeVisible();
  if(path==='/meetings/new') {await expect(page.getByText('Cliente da agência A',{exact:true})).toBeAttached();expect(reads).toContain('eq.'+agencyA);expect(reads).not.toContain('eq.demo-agency');}
  expect(crashes).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 });
}

test('work room overview filters real rooms and enters their conversation',async({page},testInfo)=>{
 await api(page);await login(page);await expect(page).toHaveURL(/\/dashboard$/, {timeout:15000});await page.goto('/chat');
 await expect(page.getByRole('heading',{name:'Um espaço para criar juntos.'})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('work-rooms.png'),fullPage:true});
 await page.getByPlaceholder('Nome da sala...').fill('nada-encontrado');
 await expect(page.getByText(/Nenhuma sala disponível/)).toBeVisible();
 await page.getByPlaceholder('Nome da sala...').fill('Design');
 await page.getByRole('button',{name:/Design Criação e direção visual/}).click();
 await expect(page).toHaveURL(/\/chat\/channels\/99999999-9999-4999-8999-999999999999$/);
 await expect(page.getByPlaceholder(/Enviar mensagem/)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});

 test('social media connects selected client to the editorial workflow',async({page},testInfo)=>{await api(page);await login(page);await expect(page).toHaveURL(/\/dashboard$/, {timeout:15000});await page.goto('/social-media');await expect(page.getByRole('heading',{name:'Social Media',exact:true})).toBeVisible();await page.getByLabel('Cliente da operação').selectOption('33333333-3333-4333-8333-333333333333');await expect(page.getByRole('link',{name:'Criar calendário'})).toHaveAttribute('href','/editorial/new?clientId=33333333-3333-4333-8333-333333333333');await expect(page.getByRole('link',{name:'Dados e briefing'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);await page.screenshot({path:testInfo.outputPath('social-media.png'),fullPage:true});});

test('social workflow loads selected client and links its actual campaign stage',async({page},testInfo)=>{
 const reads=await api(page,{social:true});await login(page);await expect(page).toHaveURL(/\/dashboard$/,{timeout:15000});await page.goto('/social-media');
 await expect(page.getByRole('heading',{name:'Social Media',exact:true})).toBeVisible();
 await page.getByLabel('Mês da operação').fill('2026-10');
 await page.getByLabel('Cliente da operação').selectOption('33333333-3333-4333-8333-333333333333');
 await expect(page.getByRole('heading',{name:'Demandas do cliente'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Criar calendário'})).toHaveAttribute('href','/editorial/new?clientId=33333333-3333-4333-8333-333333333333');
 await expect(page.getByRole('link',{name:'Abrir calendário'})).toHaveAttribute('href','/editorial?clientId=33333333-3333-4333-8333-333333333333&campaignId=77777777-7777-4777-8777-777777777777');
 await expect(page.getByRole('link',{name:'Abrir produção'})).toHaveAttribute('href','/projects/66666666-6666-4666-8666-666666666666');
 expect(reads).toContain('social:eq.'+agencyA+':eq.33333333-3333-4333-8333-333333333333:eq.2026-10-01');
 expect(reads.some(r=>r.includes('demo-agency'))).toBe(false);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await page.screenshot({path:testInfo.outputPath('social-media.png'),fullPage:true});
});

test('presentation fits its container and persists per-material decisions',async({page},testInfo)=>{
 const decisions:{asset_id:string;decision:string;note:string;created_at:string}[]=[];
 await page.route('https://lh3.googleusercontent.com/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#e95513"/><text x="80" y="180" font-size="64">Material de teste</text></svg>'}));
 await page.route('https://audit-auth.supabase.co/rest/v1/rpc/**',async route=>{const name=new URL(route.request().url()).pathname.split('/').pop();const payload=route.request().postDataJSON();let data:unknown=[];
 if(name==='get_public_showcase')data={presentation:{title:'Relatório Mensal · Direção e posicionamento da campanha',client_name:'Cliente de teste',period_month:10,period_year:2026},sections:[{id:'section',section_type:'gallery',title:'Materiais da campanha',position:0}],assets:['a','b'].map(id=>({id,section_id:'section',title:'Arte '+id,mime_type:'image/webp',thumbnail_reference:'https://lh3.googleusercontent.com/'+id+'=s220'}))};
 if(name==='get_showcase_material_reviews')data=[...decisions].reverse();
 if(name==='submit_showcase_material_review'){const review={asset_id:payload.p_asset,decision:payload.p_decision,note:payload.p_note,created_at:new Date().toISOString()};decisions.push(review);data={...review,id:String(decisions.length)};}
 await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('/showcase/test-published-token-long-enough');
 await expect(page.getByRole('heading',{name:/Relatório Mensal/})).toBeVisible();
 // A mobile-width container within a desktop viewport must also use a single column.
 await page.getByTestId('presentation-preview').evaluate(el=>{(el as HTMLElement).style.maxWidth='390px'});
 const widths=await page.getByRole('img',{name:/Arte/}).evaluateAll(imgs=>imgs.map(img=>img.getBoundingClientRect().width));expect(widths.every(w=>w>250)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await expect(page.getByRole('link',{name:/Drive/})).toHaveCount(0);
 await page.getByRole('button',{name:'Aprovar',exact:true}).first().click();await expect(page.getByText('Aprovado',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Solicitar ajuste',exact:true}).last().click();await page.getByLabel('O que precisa mudar?').fill('Ajustar contraste');await page.getByRole('button',{name:'Enviar retorno'}).click();await expect(page.getByText('Ajuste solicitado',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByText('Aprovado',{exact:true})).toBeVisible();await expect(page.getByText('Ajustar contraste',{exact:true})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('presentation-responsive.png'),fullPage:true});
});
