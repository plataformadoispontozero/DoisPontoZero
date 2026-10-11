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
      return respond([{ id: '33333333-3333-4333-8333-333333333333', agency_id: scope.replace('eq.',''), name: scope.includes(agencyB) ? 'Cliente da agência B':'Cliente da agência A', slug:'cliente', status:'active', logo_url:null, created_at:new Date().toISOString(), updated_at:new Date().toISOString() }])
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
  await page.getByLabel('Agência', {exact:true}).selectOption(agencyB)
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
