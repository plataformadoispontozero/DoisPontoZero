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

test('profile-only calendar requires reviewed suggestions and saves generated real payload',async({page})=>{
 await api(page,{owner:true});
 const clientId='33333333-3333-4333-8333-333333333333';let saved:any;
 await page.route('**/rest/v1/clients?**',route=>route.fulfill({json:[{id:clientId,name:'Cliente auditado',profile:{niche:'Engenharia',monthly_objective:'Atrair novos clientes',target_audience:'Empresas locais',tone:'Profissional'}}]}));
 await page.route('**/rest/v1/client_legacy_records?**',route=>route.fulfill({json:[]}));
 const campaignId='99999999-9999-4999-8999-999999999999';
 await page.route('**/rest/v1/rpc/save_monthly_editorial',route=>{saved=route.request().postDataJSON();return route.fulfill({json:campaignId});});
 await page.route('**/rest/v1/monthly_editorial_campaigns?**',route=>{const campaign=saved?{id:campaignId,agency_id:agencyA,client_id:clientId,briefing_id:saved.p_briefing,month:saved.p_month,context:saved.p_context,items:saved.p_items,status:'draft',project_id:null}:null;return route.fulfill({json:new URL(route.request().url()).searchParams.has('id')?campaign:campaign?[campaign]:[]});});
 await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/editorial/new?clientId='+clientId);
 await expect(page.getByRole('textbox',{name:'Objetivo',exact:true})).toHaveValue('Atrair novos clientes');
 await page.getByRole('button',{name:'Gerar calendário mensal',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Antes de gerar, complete:'})).toContainText('temas revisados');
 await page.getByRole('button',{name:'Preparar sugestões para revisão',exact:true}).click();
 await expect(page.getByRole('button',{name:'Aplicar temas revisados',exact:true})).toBeDisabled();
 await page.getByLabel('Revisei os temas e quero usá-los neste rascunho').check();
 await page.getByRole('button',{name:'Aplicar temas revisados',exact:true}).click();
 await page.getByLabel('Post',{exact:true}).fill('1');await page.getByLabel('Carrossel',{exact:true}).fill('1');await page.getByLabel('Reels',{exact:true}).fill('1');
 await page.getByRole('button',{name:'Gerar calendário mensal',exact:true}).click();
 await expect(page).toHaveURL(new RegExp('/editorial\\?clientId='+clientId+'&campaignId='+campaignId));
 await expect(page.getByRole('button',{name:'Gerar demandas aprovadas',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:/Abrir demanda/})).toHaveCount(3);
 await page.getByRole('button',{name:'Abrir demanda 1',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Revisar demanda'});await expect(dialog).toBeVisible();
 await dialog.getByLabel('Legenda completa',{exact:true}).fill('Legenda revisada pela social media para o cliente auditado.');
 await dialog.getByRole('button',{name:'Salvar alterações',exact:true}).click();
 await expect(dialog.getByRole('button',{name:'Salvar alterações',exact:true})).toBeDisabled();
 expect(saved.p_items[0].copy).toContain('Legenda revisada pela social media');
 await dialog.getByRole('button',{name:'Fechar',exact:true}).click();
 await expect(page.getByRole('button',{name:'Gerar demandas aprovadas',exact:true})).toBeDisabled();
 const carouselIndex=saved.p_items.findIndex((x:any)=>x.format==='carousel');
 const originalSlides=structuredClone(saved.p_items[carouselIndex].editorial.slides);
 expect(new Set(originalSlides.map((x:any)=>x.text)).size).toBe(originalSlides.length);
 await page.getByRole('button',{name:'Abrir demanda '+(carouselIndex+1),exact:true}).click();
 await dialog.getByLabel('Texto da lâmina 1',{exact:true}).fill('Texto revisado apenas na primeira lâmina.');
 await dialog.getByRole('button',{name:'Salvar alterações',exact:true}).click();await expect(dialog.getByRole('button',{name:'Salvar alterações',exact:true})).toBeDisabled();
 expect(saved.p_items[carouselIndex].editorial.slides.slice(1)).toEqual(originalSlides.slice(1));
 expect(saved.p_items[carouselIndex].editorial.slides[0].visual).toBe(originalSlides[0].visual);
 expect(saved.p_items[carouselIndex].copy).toContain('Texto revisado apenas na primeira lâmina.');
 await dialog.getByRole('button',{name:'Fechar',exact:true}).click();
 const reelIndex=saved.p_items.findIndex((x:any)=>x.format==='reels');await page.getByRole('button',{name:'Abrir demanda '+(reelIndex+1),exact:true}).click();
 for(const label of ['Fala da cena 1','Texto na tela da cena 1','Câmera da cena 1','Áudio da cena 1'])await expect(dialog.getByLabel(label,{exact:true})).not.toHaveValue('');
 await expect(dialog).toBeVisible();expect(await dialog.evaluate(el=>el.getBoundingClientRect().width<=window.innerWidth)).toBe(true);
 await dialog.getByRole('button',{name:'Fechar',exact:true}).click();
 expect(saved.p_client).toBe(clientId);expect(saved.p_agency).toBe(agencyA);expect(saved.p_items).toHaveLength(3);expect(saved.p_context.approvedFacts||[]).toEqual([]);expect(saved.p_context.topics).toHaveLength(2);expect(saved.p_items.find((x:any)=>x.format==='carousel').editorial.slides).toHaveLength(7);
});

test('Drive briefing mirror shares reviewed context between briefing, client and calendar',async({page})=>{
 await api(page,{owner:true});const clientId='33333333-3333-4333-8333-333333333333';
 let document:any={id:'88888888-8888-4888-8888-888888888888',agency_id:agencyA,client_id:clientId,google_file_id:'drive-brief-document-123',name:'Briefing estratégico auditado',mime_type:'text/plain',path:'02 BRIEFINGS & DOCS/Briefing.txt',version:'2',reviewed_version:null,reviewed_at:null,reviewed_context:{},available:true,can_read_text:true,synced_at:new Date().toISOString()};
 await page.route('**/rest/v1/client_drive_documents?**',route=>route.fulfill({json:[document]}));
 await page.route('**/functions/v1/google-workspace',route=>{const body=route.request().postDataJSON();expect(body.agencyId).toBe(agencyA);expect(body.clientId).toBe(clientId);return route.fulfill({json:body.action==='client-drive-documents'?{documents:[],scan:{complete:true}}:{document:{version:'2'},text:'Posicionamento: soluções técnicas para empresas.'}});});
 await page.route('**/rest/v1/rpc/save_client_drive_review',route=>{const body=route.request().postDataJSON();document={...document,reviewed_context:body.p_context,reviewed_version:body.p_version,reviewed_at:new Date().toISOString()};return route.fulfill({json:document.id});});
 await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/briefings');
 await page.getByLabel('Cliente para consultar briefs no Drive').selectOption(clientId);
 await page.getByRole('button',{name:'Buscar briefs no Drive'}).click();
 await page.getByRole('button',{name:'Revisar contexto',exact:true}).click();
 await expect(page.getByText('Posicionamento: soluções técnicas para empresas.',{exact:true})).toBeVisible();
 await page.getByLabel('Objetivo',{exact:true}).fill('Atrair empresas interessadas');await page.getByLabel('Público-alvo',{exact:true}).fill('Gestores de empresas');await page.getByLabel('Posicionamento e diferenciais').fill('Soluções técnicas para empresas');await page.getByLabel('Temas e ideias (um por linha)').fill('Como escolher soluções técnicas\nDúvidas de gestores');
 await page.getByLabel('Conferi o documento e revisei as informações acima').check();await page.getByRole('button',{name:'Salvar contexto revisado',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Contexto revisado salvo'})).toBeVisible();
 await page.goto('/clients/'+clientId);await page.getByRole('navigation',{name:'Seções da ficha do cliente'}).getByRole('button',{name:'Briefings',exact:true}).click();
 await expect(page.getByText('Briefing estratégico auditado',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Usar no calendário'})).toBeVisible();
 await page.getByRole('link',{name:'Usar no calendário'}).click();await page.getByRole('button',{name:'Usar contexto de Briefing estratégico auditado'}).click();
 await expect(page.getByRole('textbox',{name:'Objetivo',exact:true})).toHaveValue('Atrair empresas interessadas');await expect(page.getByRole('textbox',{name:'Público-alvo',exact:true})).toHaveValue('Gestores de empresas');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});


test('generation save failure preserves reviewed inputs and never opens production',async({page})=>{
 await api(page,{owner:true});const clientId='33333333-3333-4333-8333-333333333333';
 await page.route('**/rest/v1/clients?**',route=>route.fulfill({json:[{id:clientId,name:'Cliente auditado',profile:{niche:'Engenharia',monthly_objective:'Atrair novos clientes',target_audience:'Empresas locais',tone:'Profissional'}}]}));
 await page.route('**/rest/v1/client_legacy_records?**',route=>route.fulfill({json:[]}));
 await page.route('**/rest/v1/rpc/save_monthly_editorial',route=>route.fulfill({status:503,json:{message:'Falha controlada ao gravar rascunho'}}));
 await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/editorial/new?clientId='+clientId);
 await page.getByRole('button',{name:'Preparar sugestões para revisão',exact:true}).click();
 await page.getByLabel('Revisei os temas e quero usá-los neste rascunho').check();await page.getByRole('button',{name:'Aplicar temas revisados',exact:true}).click();
 await page.getByRole('button',{name:'Gerar calendário mensal',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Não foi possível concluir. Verifique as permissões e tente novamente.'})).toBeVisible();
 await expect(page).toHaveURL(new RegExp('/editorial/new\\?clientId='+clientId));
 await expect(page.getByRole('textbox',{name:'Objetivo',exact:true})).toHaveValue('Atrair novos clientes');
 await expect(page.getByRole('button',{name:'Gerar demandas aprovadas',exact:true})).toHaveCount(0);
 await expect(page.getByText(/suas entradas foram mantidas/)).toBeVisible();
});
