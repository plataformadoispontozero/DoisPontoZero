import { test, expect, type Page } from '@playwright/test'

// Controlled API responses test client-side session/tenant boundaries.
// These cases are NOT real backend/RLS tests.
const userId = '11111111-1111-4111-8111-111111111111'
const agencyA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const agencyB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const roleId = '22222222-2222-4222-8222-222222222222'
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'agency-test@example.invalid', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() }
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now()/1000)+3600, role: 'authenticated', aud: 'authenticated' })).toString('base64url')}.audit-signature`

async function api(page: Page, options: { member?: boolean; owner?: boolean; failClients?: boolean; invalidLogin?: boolean; invalidSession?: boolean; unavailable?: boolean; inactive?: boolean; agenda?: boolean } = {}) {
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
    if (table === 'profiles') return respond([{ full_name: 'Usuário de teste' }])
    if (table === 'agency_members') return respond(options.member === false || options.inactive ? [] : [agencyA,agencyB].map((id,index) => ({ agency_id: id, role_id: roleId, agencies: { id, name: `Agência ${index ? 'B':'A'}`, status: 'active' }, roles: { id: roleId, name: options.owner === false ? 'VIEWER':'OWNER' } })))
    if (table === 'role_permissions') return respond([{ allowed: true, permissions: { permission_key: 'dashboard.view' } }])
    if (options.agenda && table === 'meetings') return respond([
      {id:'55555555-5555-4555-8555-555555555555',title:'Reunião pessoal real',starts_at:new Date().toISOString(),organizer_id:userId,meeting_participants:[]},
      {id:'66666666-6666-4666-8666-666666666666',title:'Reunião de outro usuário',starts_at:new Date().toISOString(),organizer_id:'other-user',meeting_participants:[]},
    ])
    if (options.agenda && table === 'tasks') return respond([{id:'77777777-7777-4777-8777-777777777777',title:'Prazo da minha tarefa',due_date:new Date().toISOString().slice(0,10),task_assignees:[{user_id:userId}]}])
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

test('unauthenticated deep route and reload require login', async ({page}) => {
  await api(page)
  const pdfRequests: string[] = []
  page.on('request',request => { if(request.url().match(/(?:vendor-pdf|react-pdf)/)) pdfRequests.push(request.url()) })
  await page.goto('/clients'); await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', {name:'Entrar na sua agência'})).toBeVisible()
  await page.reload(); await expect(page.getByRole('heading', {name:'Entrar na sua agência'})).toBeVisible()
  await expect(page.getByText('Admin Operações', {exact:true})).toHaveCount(0)
  expect(pdfRequests).toEqual([])
})
test('login preserves deep link and tenant switch clears client cache', async ({page}) => {
  const reads = await api(page)
  await page.goto('/clients'); await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('E-mail', {exact:true}).fill(user.email)
  await page.getByLabel('Senha', {exact:true}).fill('audit-password-only')
  await page.getByRole('button', {name:'Entrar',exact:true}).click()
  await expect(page).toHaveURL(/\/clients$/)
  await expect(page.getByText('Cliente da agência A', {exact:true})).toBeVisible()
  if ((page.viewportSize()?.width||1440)<768) {
    await page.getByRole('button',{name:'Abrir menu de navegação',exact:true}).click()
    await page.getByLabel('Agência no menu móvel',{exact:true}).selectOption(agencyB)
    const close=page.getByRole('button',{name:'Fechar painel',exact:true}); if(await close.isVisible()) await close.click()
  } else await page.getByLabel('Agência', {exact:true}).selectOption(agencyB)
  await expect(page.getByText('Cliente da agência B', {exact:true})).toBeVisible()
  await expect(page.getByText('Cliente da agência A', {exact:true})).toHaveCount(0)
  expect(reads).toContain(`notification:eq.${userId}`)
  expect(reads).toContain(`eq.${agencyA}`); expect(reads).toContain(`eq.${agencyB}`)
  await page.reload(); await expect(page.getByText('Cliente da agência B', {exact:true})).toBeVisible()
})
test('user with no active agency cannot enter the workspace', async ({page}) => {
  await api(page,{member:false}); await login(page)
  await expect(page.getByRole('heading', {name:'Acesso à agência indisponível'})).toBeVisible()
  await expect(page.getByRole('heading', {name:'Visão Geral',exact:true})).toHaveCount(0)
})
test('viewer cannot open the permission administration URL', async ({page}) => {
  await api(page,{owner:false}); await login(page)
  await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
  await page.goto('/settings/permissions')
  await expect(page.getByRole('heading',{name:'Acesso negado'})).toBeVisible()
})
test('backend client error is visible and never replaced with demo clients', async ({page}) => {
  await api(page,{failClients:true}); await login(page)
  await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
  await page.goto('/clients')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar')
  await expect(page.getByText('Acme Corp',{exact:true})).toHaveCount(0)
})
test('logout ends the SDK session and protects a subsequent deep route', async ({page,isMobile}) => {
  await api(page); await login(page)
  await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
  if(isMobile) {
    await page.getByRole('button',{name:'Abrir menu de navegação',exact:true}).click()
    await page.getByRole('button',{name:'Encerrar sessão',exact:true}).click()
  } else await page.getByRole('button',{name:'Sair do sistema',exact:true}).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/clients'); await expect(page).toHaveURL(/\/login$/)
})

test('client form uses active tenant and survives reload through the API contract', async ({page}) => {
  await api(page); await login(page)
  await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
  await page.goto('/clients/new')
  await page.getByLabel('Nome da Marca / Razão Social *',{exact:true}).fill('Cliente criado no teste')
  const created = page.waitForRequest(request => request.url().includes('/rest/v1/clients') && request.method() === 'POST')
  await page.getByRole('button',{name:'Cadastrar Cliente',exact:true}).click()
  expect((await created).postDataJSON().agency_id).toBe(agencyA)
  await expect(page).toHaveURL(/\/clients$/)
  await page.reload(); await expect(page.getByText('Cliente criado no teste',{exact:true})).toBeVisible()
  await page.goto('/clients/44444444-4444-4444-8444-444444444444/edit')
  await expect(page.getByLabel('Nome da Marca / Razão Social *',{exact:true})).toHaveValue('Cliente criado no teste')
  await page.getByLabel('Nome da Marca / Razão Social *',{exact:true}).fill('Cliente editado no teste')
  await page.getByRole('button',{name:'Salvar Alterações',exact:true}).click()
  await expect(page).toHaveURL(/\/clients$/)
  await page.reload(); await expect(page.getByText('Cliente editado no teste',{exact:true})).toBeVisible()
})

for (const scenario of [
  {name:'invalid credentials',options:{invalidLogin:true},message:'Não foi possível entrar'},
  {name:'invalid or expired session',options:{invalidSession:true},message:'Sessão inválida'},
  {name:'backend unavailable',options:{unavailable:true},message:'indisponível'},
  {name:'inactive membership excluded by server',options:{inactive:true},message:'vínculo ativo'},
]) test(scenario.name + ' never grants private access',async ({page}) => {
  await api(page,scenario.options); await login(page)
  await expect(page.getByRole('alert')).toContainText(scenario.message)
  await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toHaveCount(0)
  await expect(page.getByText('Admin Operações',{exact:true})).toHaveCount(0)
})

test('public proposal without a verified token cannot show a fixture or require login',async ({page}) => {
  await api(page); await page.goto('/p/invalid-token')
  await expect(page.getByRole('heading',{name:'Link Inválido ou Expirado'})).toBeVisible()
  await expect(page).toHaveURL(/\/p\/invalid-token$/)
  await expect(page.getByText('Acme Corp Brasil',{exact:true})).toHaveCount(0)
})

test('personal agenda lists real API meetings and deadlines and links to creation',async ({page})=>{
  await api(page,{agenda:true}); await login(page)
  await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
  await page.goto('/calendar')
  await expect(page.getByRole('link',{name:'Reunião pessoal real',exact:true})).toBeVisible()
  await expect(page.getByRole('link',{name:'Prazo da minha tarefa',exact:true})).toBeVisible()
  await expect(page.getByText('Reunião de outro usuário',{exact:true})).toHaveCount(0)
  await page.getByLabel('Período',{exact:true}).selectOption('week')
  await expect(page.getByRole('link',{name:'Reunião pessoal real',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Novo Compromisso',exact:true}).click()
  await expect(page).toHaveURL(/\/meetings\/new$/)
})

test('team routes require permissions and cannot bypass access through a direct URL', async ({page}) => {
  await api(page,{owner:false})
  await login(page)
  await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
  for (const path of ['/team','/team/new','/team/not-in-this-agency']) {
    await page.goto(path)
    await expect(page.getByRole('heading',{name:'Acesso negado'})).toBeVisible()
  }
})

test('team invitation creates a manual link with the selected role and no false email confirmation',async ({page})=>{
  await api(page)
  await page.route('**/rest/v1/roles?**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([{id:roleId,name:'MANAGER',agency_id:agencyA}])}))
  let body:any
  await page.route('**/functions/v1/team-invite',route=>{body=route.request().postDataJSON();return route.fulfill({contentType:'application/json',body:JSON.stringify({invitationId:'test-id',inviteUrl:'https://site.invalid/accept-invitation#id=test-id',existingAccount:true})})})
  await login(page)
  await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
  await page.goto('/team/new')
  await page.getByRole('button',{name:'Convidar Membro'}).click()
  await page.getByLabel('E-mail do convidado').fill('gestor@example.invalid')
  await page.getByLabel('Papel de acesso atribuído').selectOption(roleId)
  await page.getByRole('button',{name:'Gerar Convite',exact:true}).click()
  await expect(page.getByLabel('Link do convite')).toHaveValue('https://site.invalid/accept-invitation#id=test-id')
  expect(body).toEqual({email:'gestor@example.invalid',roleId,agencyId:agencyA})
  await expect(page.getByText(/Nenhum e-mail foi enviado automaticamente/)).toBeVisible()
  await page.goto('/team/unknown-member')
  await expect(page.getByRole('alert').filter({hasText:'Profissional não encontrado nesta agência.'})).toBeVisible()
})

test('team-only login hides Google and keeps workspace protected', async ({ page }) => {
  await api(page)
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Continuar com Google' })).toHaveCount(0)
  await expect(page.getByText('ACESSO RESTRITO À EQUIPE', { exact: true })).toBeVisible()
  await expect(page.locator('.dz-auth-intro .dz-brand-logo')).toBeVisible()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})


test("monthly generator imports briefing and respects format quantities", async ({
  page,
}) => {
  await api(page);
  await page.route("**/rest/v1/briefings?**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { id: "brief-test", title: "Briefing mensal", status: "approved" },
      ]),
    }),
  );
  await page.route("**/rest/v1/rpc/get_editorial_briefing", (route) =>
    route.fulfill({
      json: {
        id: "brief-test",
        revision: "test-brief-revision",
        updatedAt: "2026-10-12",
        answers: [
          { value: "Gerar contatos", label: "Objetivo" },
          { value: "Empreendedores locais", label: "Público-alvo" },
        ],
      },
    }),
  );
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Visão Geral", exact: true }),
  ).toBeVisible();
  await page.goto("/editorial");
  await page
    .getByLabel("Cliente", { exact: true })
    .selectOption("33333333-3333-4333-8333-333333333333");
  await page.getByLabel("Briefing do cliente").selectOption("brief-test");
  await expect(
    page.getByRole("textbox", { name: "Objetivo", exact: true }),
  ).toHaveValue("Gerar contatos");
  await expect(
    page.getByRole("textbox", { name: "Público-alvo", exact: true }),
  ).toHaveValue("Empreendedores locais");
  await page
    .getByLabel("Temas aprovados para este mês", { exact: true })
    .fill("Consultoria\nPlanejamento\nRotina");
  await page.getByLabel("Post", { exact: true }).fill("1");
  await page.getByLabel("Reels", { exact: true }).fill("1");
  await page.getByLabel("Carrossel", { exact: true }).fill("1");
  await page
    .getByRole("button", { name: "Gerar calendário mensal", exact: true })
    .click();
  await expect(page.getByLabel(/Tema do conteúdo/)).toHaveCount(3);
  await expect(
    page.getByText("Prévia estratégica · campaign-rules-1.0"),
  ).toBeVisible();
  await expect(
    page.getByLabel("Quantidade de slides do conteúdo 3"),
  ).toHaveValue("7");
  await expect(
    page.getByLabel("Quantidade de cenas do conteúdo 2"),
  ).toHaveValue("3");
  await page.getByLabel("Quantidade de slides do conteúdo 3").fill("5");
  await page
    .getByRole("button", { name: "Remontar estrutura da peça", exact: true })
    .nth(1)
    .click();
  await expect(page.getByLabel("Copy do conteúdo 3")).toHaveValue(/Slide 5:/);
  await expect(page.getByLabel("Copy do conteúdo 3")).not.toHaveValue(
    /Slide 6:/,
  );
  await page.screenshot({
    path: `test-results/editorial-engine-${page.viewportSize()?.width}.png`,
    fullPage: true,
  });
});

test('public editorial review accepts copy suggestions and closes after approval without login', async ({page}) => {
  await api(page)
  let status='pending'; const submissions:any[]=[]
  await page.route('**/rest/v1/rpc/get_public_editorial',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({client:'Cliente editorial',month:'2026-11-01',status,items:[{date:'2026-11-10',format:'post',title:'Tema do mês',copy:'Texto original'}]})}))
  await page.route('**/rest/v1/rpc/submit_public_editorial',route=>{
    const body=route.request().postDataJSON(); submissions.push(body)
    status=body.p_decision==='approve'?'approved':'changes_requested'
    return route.fulfill({contentType:'application/json',body:'true'})
  })
  await page.goto('/approve-calendar/'+ 'a'.repeat(64))
  await expect(page.getByRole('heading',{name:'Revisão do calendário editorial'})).toBeVisible()
  await page.getByLabel('Sugestão de copy').fill('Texto sugerido pelo cliente')
  await page.getByRole('button',{name:'Enviar sugestão deste conteúdo'}).click()
  await expect(page.getByText('Sua sugestão foi registrada para a equipe revisar.')).toBeVisible()
  expect(submissions[0].p_copy).toBe('Texto sugerido pelo cliente')
  page.on('dialog',dialog=>dialog.accept())
  await page.getByRole('button',{name:'Aprovar calendário completo'}).click()
  await expect(page.getByText('Revisão concluída. Este calendário já foi aprovado.')).toBeVisible()
  await expect(page.getByLabel('Sugestão de copy')).toHaveCount(0)
  expect(submissions[1].p_decision).toBe('approve')
})


test('grouped navigation preserves active section, settings footer and compact icon alignment',async ({page})=>{
 await api(page);await login(page)
 await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
 const mobile=(page.viewportSize()?.width||1440)<768
 if(mobile)await page.getByRole('button',{name:'Abrir menu de navegação',exact:true}).click()
 const nav=mobile?page.getByRole('dialog'):page.getByRole('complementary',{name:'Navegação Principal'})
 await expect(nav.getByRole('button',{name:'CLIENTES & COMERCIAL',exact:true})).toBeVisible()
 await nav.getByRole('button',{name:'CLIENTES & COMERCIAL',exact:true}).click()
 await expect(nav.getByRole('link',{name:'Clientes',exact:true})).toBeHidden()
 if(mobile)await page.getByRole('button',{name:'Fechar painel',exact:true}).click()
 await page.goto('/clients')
 if(mobile)await page.getByRole('button',{name:'Abrir menu de navegação',exact:true}).click()
 await expect(nav.getByRole('button',{name:'CLIENTES & COMERCIAL',exact:true})).toHaveAttribute('aria-expanded','true')
 await expect(nav.getByRole('link',{name:'Clientes',exact:true})).toHaveAttribute('aria-current','page')
 await expect(nav.getByRole('link',{name:'Configurações',exact:true})).toHaveCount(1)
 if(!mobile){
  await page.getByRole('button',{name:'Recolher barra lateral'}).click()
  await expect(page.getByRole('complementary',{name:'Navegação Principal'})).toHaveCSS('width','72px')
  const sidebar=page.getByRole('complementary',{name:'Navegação Principal'}),box=await sidebar.boundingBox()
  const icon=await sidebar.getByRole('link',{name:'Clientes',exact:true}).locator('svg').boundingBox()
  expect(Math.abs((icon!.x+icon!.width/2)-(box!.x+box!.width/2))).toBeLessThan(2)
  await expect(sidebar.getByRole('link',{name:'Dois.Zero',exact:true}).locator('img')).toBeVisible()
  await page.screenshot({path:`test-results/navigation-compact-${page.viewportSize()!.width}.png`,fullPage:false})
  await page.reload();await expect(sidebar).toHaveAttribute('data-collapsed','true')
  await page.getByRole('link',{name:'Clientes',exact:true}).first().focus()
  await expect(page.getByRole('tooltip').filter({hasText:'Clientes'})).toBeVisible()
  await page.getByRole('button',{name:'Expandir barra lateral'}).click()
  await expect(sidebar).toHaveCSS('width','248px')
 }else{
  await nav.getByRole('link',{name:'Configurações',exact:true}).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('heading',{name:'Central de Configurações do Workspace'})).toBeVisible()
 }
 await page.screenshot({path:`test-results/navigation-${page.viewportSize()!.width}.png`,fullPage:false})
})

test('invite acceptance verifies token and sets the invited professional password',async ({page})=>{
 await api(page)
 const id='99999999-9999-4999-8999-999999999999'
 let verified=false,accepted=false
 await page.route('**/auth/v1/verify',route=>{verified=route.request().postDataJSON().token_hash==='controlled-invite-token';return route.fulfill({contentType:'application/json',body:JSON.stringify({access_token:token,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user})})})
 await page.route('**/rest/v1/rpc/accept_team_invitation',route=>{accepted=route.request().postDataJSON().p_id===id;return route.fulfill({contentType:'application/json',body:JSON.stringify(agencyA)})})
 await page.goto('/accept-invitation#id='+id+'&token_hash=controlled-invite-token')
 await page.getByLabel('Seu nome').fill('Gestor convidado')
 await page.getByLabel('Criar senha').fill('StrongTest1!')
 await page.getByLabel('Confirmar senha').fill('StrongTest1!')
 await page.getByRole('button',{name:'Aceitar convite e entrar'}).click()
 await expect(page).toHaveURL(/\/dashboard$/)
 expect(verified).toBe(true);expect(accepted).toBe(true)
})

test('five notification sounds can be previewed and muted',async ({page})=>{
 await api(page);await login(page)
 await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible()
 await page.goto('/notifications')
 await expect(page.getByRole('button',{name:/^Testar:/})).toHaveCount(5)
 await page.getByRole('button',{name:'Ativar sons de notificação',exact:true}).click()
 await expect(page.getByRole('button',{name:'Silenciar notificações',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Testar: Cliente aprovou',exact:true}).click()
 await page.getByRole('button',{name:'Silenciar notificações',exact:true}).click()
 await expect(page.getByRole('button',{name:'Ativar sons de notificação',exact:true})).toBeVisible()
})


test('new operational events play approval, production and client motifs without replaying history',async({page})=>{
 await api(page)
 await page.addInitScript(()=>{
  const original=window.AudioContext
  ;(window as any).__played=[]
  window.AudioContext=new Proxy(original,{construct(target,args){const context=Reflect.construct(target,args) as AudioContext;const create=context.createOscillator.bind(context);context.createOscillator=()=>{const oscillator=create(),start=oscillator.start.bind(oscillator);oscillator.start=(...args:Parameters<typeof start>)=>{(window as any).__played.push(oscillator.frequency.value);return start(...args)};return oscillator};return context}})
 })
 let phase=0
 await page.route('**/rest/v1/monthly_editorial_campaigns?**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([{id:'sound-test',status:phase===0?'pending':phase===1?'approved':'production'}])}))
 await page.route('**/rest/v1/clients?**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(phase<3?[]:[{id:'new-client-sound',name:'Cliente do teste de áudio'}])}))
 await login(page);await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible();await page.goto('/notifications')
 const baseline=page.waitForResponse(r=>r.url().includes('/rest/v1/monthly_editorial_campaigns'))
 await page.getByRole('button',{name:'Ativar sons de notificação',exact:true}).click();await baseline
 await page.evaluate(()=>{(window as any).__played=[]})
 phase=1
 await expect.poll(()=>page.evaluate(()=>(window as any).__played),{timeout:20000}).toEqual([523,659,784])
 await page.evaluate(()=>{(window as any).__played=[]});phase=2
 await expect.poll(()=>page.evaluate(()=>(window as any).__played),{timeout:20000}).toEqual([220,330])
 await page.evaluate(()=>{(window as any).__played=[]});phase=3
 await expect.poll(()=>page.evaluate(()=>(window as any).__played),{timeout:20000}).toEqual([392,494,587,784])
})


test('production workspace groups and filters real demands and creates in its project', async ({page}) => {
  await api(page)
  const projectId='88888888-8888-4888-8888-888888888888', boardId='99999999-9999-4999-8999-999999999999', columnId='10101010-1010-4010-8010-101010101010'
  const rows=[{id:'12121212-1212-4212-8212-121212121212',agency_id:agencyA,project_id:projectId,board_id:boardId,column_id:columnId,title:'[Design] Identidade da campanha',description:'Referências e arquivos',status:'open',priority:'high',due_date:'2020-01-01',archived_at:null,assignees:[{user_id:userId,profile:{full_name:'Designer da equipe'}}],project:{id:projectId,name:'Campanha de lançamento'}}]
  let created:any, updated:any
  await page.route('https://audit-auth.supabase.co/rest/v1/**',async route=>{
    const u=new URL(route.request().url()), table=u.pathname.split('/').pop()
    if(table==='tasks'){
      if(route.request().method()==='PATCH'){updated=route.request().postDataJSON();Object.assign(rows[0],updated);return route.fulfill({json:null})}
      if(route.request().method()==='POST'){created=route.request().postDataJSON();return route.fulfill({json:{id:'13131313-1313-4313-8313-131313131313'}})}
      if(u.searchParams.get('select')==='position')return route.fulfill({json:[]})
      return route.fulfill({json:u.searchParams.has('id') ? rows[0] : rows})
    }
    if(table==='projects')return route.fulfill({json:[{id:projectId,name:'Campanha de lançamento',status:'active'}]})
    if(table==='board_columns')return route.fulfill({json:[{id:columnId,name:'A fazer',category:'backlog',position:1000,board_id:boardId},{id:'20202020-2020-4020-8020-202020202020',name:'Revisão',category:'review',position:2000,board_id:boardId}]})
    if(table==='project_boards')return route.fulfill({json:{id:boardId,project_id:projectId,columns:[{id:columnId,name:'A fazer',category:'backlog',position:1000}]}})
    return route.fallback()
  })
  await page.goto('/login');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('test-only-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/dashboard/)
  await page.goto('/production/design')
  await expect(page.getByRole('heading',{name:'Identidade da campanha',exact:true})).toBeVisible()
  await page.getByLabel('Etapa',{exact:true}).selectOption('review')
  await expect(page.getByText('Nenhuma demanda corresponde aos filtros.')).toBeVisible()
  await page.getByLabel('Etapa',{exact:true}).selectOption('')
  await page.getByRole('button',{name:'Nova demanda',exact:true}).click()
  await page.getByLabel('Projeto da demanda').selectOption(projectId)
  await page.getByRole('button',{name:'Continuar',exact:true}).click()
  await page.locator('#task-title').fill('Carrossel de lançamento')
  await page.getByRole('button',{name:'Criar Tarefa',exact:true}).click()
  await expect.poll(()=>created?.title).toBe('[Design] Carrossel de lançamento')
  expect(created.project_id).toBe(projectId);expect(created.agency_id).toBe(agencyA);expect(created.status).toBe('open')
  await page.getByRole('button',{name:/Ver demanda/}).first().click()
  await expect(page.locator('input').filter({hasNot:page.locator('[type=hidden]')}).first()).toBeVisible()
  await page.locator('[role=dialog] select').filter({has:page.locator('option[value="'+columnId+'"]')}).selectOption('20202020-2020-4020-8020-202020202020')
  await expect.poll(()=>updated?.status).toBe('review')
  await page.keyboard.press('Escape')
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({path:`test-results/production-${page.viewportSize()?.width}.png`,fullPage:true})
  for(const [path,title] of [['video','Vídeo & Motion'],['traffic','Tráfego Pago']]) {
    await page.goto('/production/'+path)
    await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible()
    await expect(page.getByText('Sua produção de '+title+' começa aqui.')).toBeVisible()
    if(path==='traffic') {
      await expect(page.getByRole('heading',{name:'Resultados dos clientes',exact:true})).toBeVisible()
      await expect(page.getByText('Integração Meta pendente',{exact:true})).toBeVisible()
    }
  }
})


test('production workspace respects consultation permissions and displays backend failure', async ({page}) => {
  await api(page,{owner:false})
  await page.route('https://audit-auth.supabase.co/rest/v1/role_permissions**',route=>route.fulfill({json:[{allowed:true,permissions:{permission_key:'tasks.view'}},{allowed:true,permissions:{permission_key:'dashboard.view'}}]}))
  await page.route('https://audit-auth.supabase.co/rest/v1/tasks**',route=>route.fulfill({status:403,json:{code:'42501',message:'permission denied'}}))
  await page.goto('/login');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('test-only-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/dashboard/)
  await page.goto('/production/design')
  await expect(page.getByRole('alert').filter({hasText:'Não foi possível carregar a produção.'})).toBeVisible({timeout:15000})
  await expect(page.getByRole('button',{name:'Nova demanda',exact:true})).toHaveCount(0)
  await expect(page.getByText('Sua produção de Design começa aqui.')).toHaveCount(0)
})


test('monthly generator consumes client strategy pillars and preserves exact campaign quotas',async({page})=>{
 await api(page,{owner:true});
 const strategy='77777777-7777-4777-8777-777777777777';
 await page.route('**/rest/v1/content_strategies?**',route=>route.fulfill({json:[{id:strategy,name:'Estratégia aprovada',objective:'Gerar contatos',target_audience:'Empreendedores locais',tone_of_voice:'Formal',brand_positioning:'Atendimento consultivo',restrictions:['Não mencionar desconto']}]}));
 await page.route('**/rest/v1/editorial_pillars?**',route=>route.fulfill({json:[{id:'88888888-8888-4888-8888-888888888888',name:'Consultoria aprovada',percentage:100,example_topics:['Planejamento','Consultoria','Rotina'],content_formats:['post','carrossel','reels']}]}));
 await login(page); await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible();
 await page.goto('/editorial');await page.getByLabel('Cliente',{exact:true}).selectOption('33333333-3333-4333-8333-333333333333');
 await page.getByLabel('Estratégia do cliente',{exact:true}).selectOption(strategy);
 await expect(page.getByRole('textbox',{name:'Objetivo',exact:true})).toHaveValue('Gerar contatos');
 await expect(page.getByRole('textbox',{name:'Restrições',exact:true})).toHaveValue('Não mencionar desconto');
 await expect(page.getByText(/Pilares elegíveis:/)).toContainText('Consultoria aprovada');
 await page.getByLabel('Post',{exact:true}).fill('1');await page.getByLabel('Reels',{exact:true}).fill('1');await page.getByLabel('Carrossel',{exact:true}).fill('1');
 await page.getByRole('button',{name:'Gerar calendário mensal',exact:true}).click();
 await expect(page.getByLabel(/Tema do conteúdo/)).toHaveCount(3);
 await expect(page.getByText(/3 propostas; 1 posts, 1 carrosséis e 1 reels/)).toContainText('Consultoria aprovada: 3');
});

test('password visibility and staged CSV import preserve confirmation and tenant',async({page})=>{
 const scopeReads=await api(page);let imported=false
 await page.route('**/rest/v1/rpc/import_clients_csv',route=>{const body=route.request().postDataJSON();expect(body.p_agency_id).toBe(agencyA);expect(body.p_rows).toEqual([{row:2,name:'Fictício CSV',slug:'ficticio-csv'}]);imported=true;return route.fulfill({contentType:'application/json',body:JSON.stringify({results:[{row:2,status:'imported',message:'Cliente cadastrado.'}],imported:1,ignored:0,errors:0})})})
 await page.goto('/login');await page.getByLabel('Senha',{exact:true}).fill('audit-password-only');await page.getByRole('button',{name:'Mostrar senha'}).click();await expect(page.getByLabel('Senha',{exact:true})).toHaveAttribute('type','text');await page.getByRole('button',{name:'Ocultar senha'}).click();await expect(page.getByLabel('Senha',{exact:true})).toHaveAttribute('type','password')
 await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/settings/integrations/import-clients')
 await page.getByLabel('Arquivo CSV').setInputFiles({name:'teste.csv',mimeType:'text/csv',buffer:Buffer.from('nome;slug\nFictício CSV;ficticio-csv\nInválido;SLUG')})
 await expect(page.getByText('Nome obrigatório, até 200 caracteres.')).toHaveCount(0)
 await expect(page.getByText('Slug obrigatório:',{exact:false})).toBeVisible();expect(imported).toBe(false)
 if(page.viewportSize()?.width===1440)await page.screenshot({path:'/private/tmp/doiszero-csv-preview.png',fullPage:true});await page.getByRole('button',{name:'Revisar importação'}).click();expect(imported).toBe(false)
 await page.getByRole('button',{name:'Confirmar e importar clientes'}).click();await expect(page.getByText('Linha 2: imported — Cliente cadastrado.')).toBeVisible();expect(imported).toBe(true);expect(scopeReads).toContain(`eq.${agencyA}`);expect(scopeReads).not.toContain('eq.demo-agency')
})
test('Google missing configuration does not simulate a connection',async({page})=>{
 await api(page);await page.route('**/functions/v1/google-workspace',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({configured:false,connected:false})}))
 await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/settings/integrations/google');await expect(page.getByText('Configuração necessária no Google Cloud e no backend.',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Conectar Google Agenda e Drive'})).toBeDisabled()
})
test('client journey queries stay scoped and editorial keeps selected client',async({page})=>{
 const reads=await api(page);await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/clients/33333333-3333-4333-8333-333333333333/workspace');await expect(page.getByRole('heading',{name:'Cliente da agência A',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Calendário e aprovação',exact:true})).toBeVisible();await page.getByRole('link',{name:'Planejar calendário deste cliente'}).click();await expect(page).toHaveURL(/editorial\?clientId=33333333/);expect(reads).toContain(`eq.${agencyA}`)
})

test('changing agency discards CSV review and confirmation',async({page})=>{
 await api(page);await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/settings/integrations/import-clients');await page.getByLabel('Arquivo CSV').setInputFiles({name:'teste.csv',mimeType:'text/csv',buffer:Buffer.from('name,slug\nFictício,ficticio')});await page.getByRole('button',{name:'Revisar importação'}).click();await expect(page.getByRole('button',{name:'Confirmar e importar clientes'})).toBeVisible()
 if((page.viewportSize()?.width||1440)<768){await page.getByRole('button',{name:'Abrir menu de navegação',exact:true}).click();await page.getByLabel('Agência no menu móvel',{exact:true}).selectOption(agencyB);const close=page.getByRole('button',{name:'Fechar painel',exact:true});if(await close.isVisible())await close.click()}else await page.getByLabel('Agência',{exact:true}).selectOption(agencyB)
 await expect(page.getByRole('button',{name:'Confirmar e importar clientes'})).toHaveCount(0);await expect(page.getByRole('cell',{name:'Fictício',exact:true})).toHaveCount(0)
})


test('Portuguese client export generates slug and translates status before confirmation', async ({page}) => {
 await api(page); let imported=false;
 await page.route('**/rest/v1/rpc/import_clients_csv', route => {
  const body=route.request().postDataJSON();
  expect(body.p_agency_id).toBe(agencyA);
  expect(body.p_rows).toEqual([{row:2,name:'Agência São José',slug:'agencia-sao-jose',status:'active'}]);
  imported=true;
  return route.fulfill({contentType:'application/json',body:JSON.stringify({results:[{row:2,status:'imported',message:'Cliente cadastrado.'}]})});
 });
 await login(page); await expect(page).toHaveURL(/dashboard/);
 await page.goto('/settings/integrations/import-clients');
 await page.getByLabel('Arquivo CSV').setInputFiles({name:'exportacao.csv',mimeType:'text/csv',buffer:Buffer.from('\uFEFFID;Nome do cliente;Status;Nicho\r\nexterno;Agência São José;ativo;Serviços')});
 await expect(page.getByRole('cell',{name:'agencia-sao-jose',exact:true})).toBeVisible();
 await expect(page.getByText('Colunas não importadas:',{exact:false})).toContainText('ID, Nicho');
 await page.getByRole('button',{name:'Revisar importação'}).click(); expect(imported).toBe(false);
 await page.getByRole('button',{name:'Confirmar e importar clientes'}).click();
 await expect(page.getByText('Linha 2: imported — Cliente cadastrado.')).toBeVisible(); expect(imported).toBe(true);
});

test('Google network error can be retried and configuration instructions identify OAuth client', async ({page}) => {
 await api(page); let available=false;
 await page.route('**/functions/v1/google-workspace',route => {
  return !available ? route.abort('failed') : route.fulfill({contentType:'application/json',body:JSON.stringify({configured:false,connected:false})});
 });
 await login(page); await expect(page).toHaveURL(/dashboard/); await page.goto('/settings/integrations/google');
 await expect(page.getByText('Não foi possível comunicar com a integração Google.',{exact:false})).toBeVisible();
 available=true; await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Ativar Agenda e Drive no Google Cloud'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Abrir credenciais do Google Cloud'})).toHaveAttribute('href',/firm-pentameter-474412-h7/);
 await expect(page.getByRole('button',{name:'Conectar Google Agenda e Drive'})).toBeDisabled();
});
