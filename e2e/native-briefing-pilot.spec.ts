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

test('native migrated briefing displays preserved responses and history without current approval',async({page})=>{
 await api(page,{owner:true});const briefingId='cc5f33d5-236f-41c2-9abc-c31ce09bb50e',questionId='aaaaaaaa-1111-4111-8111-111111111111',sectionId='bbbbbbbb-1111-4111-8111-111111111111';
 await page.route('**/rest/v1/briefings?**',route=>{const q=new URL(route.request().url()).searchParams;expect(q.get('agency_id')).toBe('eq.'+agencyA);return route.fulfill({json:{id:briefingId,agency_id:agencyA,client_id:'33333333-3333-4333-8333-333333333333',template_id:'audit-template',title:'Briefing histórico auditado',status:'draft',source_system:'lovable',source_status:'approved',migration_review_pending:true,created_at:'2025-10-10T10:00:00Z',updated_at:'2025-10-11T10:00:00Z',client:{name:'Cliente auditado'},template:{name:'Modelo histórico',category:'custom',version:1,sections:[{id:sectionId,title:'Canais e tráfego',position:1}],questions:[{id:questionId,section_id:sectionId,label:'Já fez tráfego pago',question_key:'ja_fez_trafego_pago',question_type:'single_choice',position:1,is_required:false,options:[]}]},answers:[{question_id:questionId,answer_value:false}],public_links:[]}});});
 await page.route('**/rest/v1/briefing_versions?**',route=>{const q=new URL(route.request().url()).searchParams;expect(q.get('agency_id')).toBe('eq.'+agencyA);expect(q.get('briefing_id')).toBe('eq.'+briefingId);return route.fulfill({json:[{id:'history-audit',created_at:'2025-10-11T10:00:00Z',snapshot:{legacy_history:{campo_alterado:'Objetivo principal',valor_anterior:'Conhecimento de marca',valor_novo:'Conquistar clientes',alterado_em:'2025-10-11T10:00:00Z'}}}]});});
 await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/briefings/'+briefingId+'/responses');
 await expect(page.getByRole('heading',{name:'Briefing migrado do Lovable'})).toBeVisible();await expect(page.getByText(/a migração não concede aprovação/)).toBeVisible();
 await expect(page.getByText('Não',{exact:true})).toBeVisible();await page.getByText('Ver 1 alterações históricas',{exact:true}).click();await expect(page.getByText('Conquistar clientes',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
