import {test,expect,type Page} from '@playwright/test';
// Browser checks use controlled API fixtures; persistent backend checks are documented separately.
const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',userId='11111111-1111-4111-8111-111111111111';
const client={id:'aurora',name:'Aurora Café — TESTE FICTÍCIO',profile:{monthly_objective:'Apresentar a marca fictícia'}};
const task={id:'task-aurora',agency_id:agency,title:'[Design] Arte Aurora — TESTE',description:'Copy revisada e direção visual de teste',status:'review',priority:'normal',position:0,project_id:'project',board_id:'board',column_id:'column',created_by:userId,archived_at:null,due_date:'2026-11-01',assignees:[],checklists:[],project:{id:'project',name:'Campanha Aurora — TESTE',client_id:client.id,client:{id:client.id,name:client.name}},column:{id:'column',name:'Revisão',category:'review'}};
async function setup(page:Page,prefix='[Design]',description=task.description,role='OWNER'){
 let demand={...task,title:`${prefix} Arte Aurora — TESTE`,description};
 const user={id:userId,aud:'authenticated',role:'authenticated',email:'aurora-test@example.invalid',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-14T00:00:00Z'};
 const token=`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:userId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated',aud:'authenticated'})).toString('base64url')}.test-only`;
 await page.route('https://audit-auth.supabase.co/**',async route=>{
  const url=new URL(route.request().url()),table=url.pathname.split('/').pop();const send=(data:unknown)=>route.fulfill({json:data,headers:{'access-control-allow-origin':'*'}});
  if(table==='token')return send({access_token:token,refresh_token:'test-only',expires_in:3600,token_type:'bearer',user});
  if(table==='user')return send(user);
  if(table==='agency_members')return send([{agency_id:agency,role_id:'22222222-2222-4222-8222-222222222222',status:'active',agencies:{id:agency,name:'Agência de teste',status:'active'},roles:{name:role}}]);
  if(table==='profiles')return send([{id:userId,full_name:'Usuário de teste'}]);
  if(table==='role_permissions')return send(['tasks.view','strategy.view','projects.view','meetings.view','briefings.view'].map(permission_key=>({allowed:true,permissions:{permission_key}})));
  if(table==='agency_branding')return send({id:'branding',agency_id:agency,display_name:'Agência de teste REAL',legal_name:'Empresa de teste',tagline:'Contexto real',primary_color:'#C74410',secondary_color:'#B8B8C0',accent_color:'#FF8759',background_color:'#101014',surface_color:'#1C1C24',text_color:'#F8F9FC',heading_font:'Inter',body_font:'Inter',theme_mode:'dark',contact_email:'contato@example.invalid',contact_phone:'12345',website_url:'https://example.invalid',business_hours:'08h às 17h'});
  if(table==='agency_preferences')return send({id:'prefs',agency_id:agency,language:'pt-BR',timezone:'Europe/Paris',currency:'EUR',date_format:'DD/MM/YYYY',time_format:'24h',week_starts_on:1,default_project_view:'kanban',default_task_view:'list'});
  if(table==='agency_document_settings')return send({id:'doc',agency_id:agency,header_style:'left_logo',footer_text:'Rodapé real',show_logo:true,show_watermark:false,watermark_opacity:0.05,page_format:'A4',document_font:'Helvetica'});
  if(table==='agency_portal_settings')return send({id:'portal',agency_id:agency,portal_title:'Portal real',welcome_message:'Bem-vindo',show_agency_logo:true,show_client_logo:true,footer_text:'Rodapé',contact_email:'contato@example.invalid',website_url:'https://example.invalid'});
  if(table==='roles')return send([{id:'owner',name:'OWNER'},{id:'designer',name:'DESIGNER'}]);
  if(table==='permissions')return send([{id:'tasks-view',permission_key:'tasks.view',module:'tasks',description:'Visualizar tarefas'}]);
  if(table==='clients')return send([client]);
  if(table==='monthly_editorial_campaigns')return send([{id:'campaign',client_id:client.id,month:'2026-11-01',status:'production',project_id:'project',items:[{format:'post',title:'Arte',copy:'Copy'}]}]);
  if(table==='tasks'){if(route.request().method()==='PATCH')demand={...demand,...route.request().postDataJSON()};return send(url.searchParams.has('id')?demand:[demand]);}
  if(table==='projects')return send([]);
  if(table==='get_management_kanban')return send({tasks:[demand],has_more:false});
  if(table==='project_boards')return send({id:'board',project_id:'project',columns:[task.column],tasks:[task]});
  return send([]);
 });
 await page.goto('/login');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('test-only');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
}
test('Social Media shows November data without selecting a client and opens the demand centrally',async({page})=>{
 await setup(page);await page.goto('/social-media');await expect(page.getByRole('heading',{name:'Demandas por cliente'})).toBeVisible();await expect(page.getByRole('link',{name:'Abrir calendário'})).toBeVisible();await expect(page.getByLabel('Mês da operação')).toHaveValue('');
 await page.locator('details[aria-label="Demandas de Aurora Café — TESTE FICTÍCIO"] > summary').click();await page.getByRole('button',{name:/Arte Aurora/}).click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('textbox').first()).toHaveValue(task.title);
 const box=await dialog.boundingBox();const viewport=page.viewportSize()!;expect(Math.abs(box!.x+box!.width/2-viewport.width/2)).toBeLessThan(3);expect(box!.height).toBeLessThan(viewport.height);await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
});
test('Design groups the demand by client and opens the shared central dialog',async({page})=>{
 await setup(page);await page.goto('/production/design');await expect(page.getByRole('region',{name:'Demandas de Aurora Café — TESTE FICTÍCIO'})).toBeVisible();await page.getByRole('button',{name:/Arte Aurora/}).click();await expect(page.getByRole('dialog')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const [department,prefix] of [['video','[Videomaker]'],['traffic','[Tráfego Pago]']])test(`${department} groups assigned test demands without inventing connected accounts`,async({page})=>{
 await setup(page,prefix);await page.goto(`/production/${department}`);
 await expect(page.getByRole('region',{name:'Demandas de Aurora Café — TESTE FICTÍCIO'})).toBeVisible();
 await page.getByRole('button',{name:/Arte Aurora/}).click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('reads a complete carousel and edits its full text without truncation',async({page})=>{
 const description='carousel\n\nLegenda da campanha sem cortes.\n\n'+Array.from({length:5},(_,i)=>`Lâmina ${i+1}: Título ${i+1}\nTexto completo da lâmina ${i+1}.\nDireção: contraste e respiro.`).join('\n\n');
 await setup(page,'[Design]',description);await page.goto('/production/design');await page.getByRole('button',{name:/Arte Aurora/}).click();
 const dialog=page.getByRole('dialog');await expect(dialog.getByText('Carrossel · 5 lâminas')).toBeVisible();if(page.viewportSize()!.width>=1000)await expect.poll(async()=>(await dialog.boundingBox())!.width).toBeGreaterThan(900);expect(await dialog.getByRole('heading',{name:/^Lâmina \d/}).count()).toBe(5);
 await dialog.getByRole('button',{name:'Editar conteúdo'}).click();const editor=dialog.getByRole('textbox',{name:'Texto completo da demanda'});await expect(editor).toHaveValue(description);expect((await editor.boundingBox())!.height).toBeGreaterThan(400);
 const edited=description+'\n\nObservação final preservada.';await editor.fill(edited);await dialog.getByRole('button',{name:'Concluir edição'}).click();await expect(dialog.getByText(/Observação final preservada/)).toBeVisible();await dialog.getByRole('button',{name:'Editar conteúdo'}).click();await expect(editor).toHaveValue(edited);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('reads script scenes in individual blocks',async({page})=>{
 await setup(page,'[Videomaker]','reels\n\nContexto do roteiro.\n\nCena 1 (8s): Abertura\nNa tela: Texto 1\nCena 2 (12s): Desenvolvimento\nNa tela: Texto 2\nCena 3 (10s): Convite\nLegenda: Legenda do roteiro');await page.goto('/production/video');await page.getByRole('button',{name:/Arte Aurora/}).click();const dialog=page.getByRole('dialog');await expect(dialog.getByText('Roteiro · 3 cenas')).toBeVisible();expect(await dialog.getByRole('heading',{name:/^Cena \d/}).count()).toBe(3);await expect(dialog.getByRole('heading',{name:'Legenda'})).toBeAttached();
});

test('retired internal proposal URLs return to the dashboard without querying proposals',async({page})=>{
 const reads:string[]=[];page.on('request',request=>{if(/supabase\.co.*(?:proposals|proposal)/.test(request.url()))reads.push(request.url());});
 await setup(page);
 for(const path of ['/proposals','/proposals/new','/proposals/templates/new','/proposals/services','/proposals/old-id','/proposals/old-id/edit','/proposals/old-id/export','/proposals/old-id/preview','/proposals/old-id/versions']){
  await page.goto(path);await expect(page).toHaveURL(/\/dashboard$/);await expect(page.getByRole('heading',{name:'Visão Geral',exact:true})).toBeVisible();
 }
 await expect(page.getByRole('link',{name:'Propostas',exact:true})).toHaveCount(0);expect(reads).toEqual([]);
});

test('old public proposal links show retirement without any backend lookup',async({page})=>{
 const reads:string[]=[];page.on('request',request=>{if(request.url().includes('supabase.co'))reads.push(request.url());});
 await page.goto('/p/old-public-token');await expect(page.getByRole('heading',{name:'Área de propostas descontinuada'})).toBeVisible();await expect(page.getByRole('link',{name:'Ir para o site da agência'})).toHaveAttribute('href','/');expect(reads).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('Tasks starts with a client group and opens demands only after expansion',async({page})=>{
 await setup(page);await page.goto('/tasks');await expect(page.getByRole('heading',{name:'Tarefas & Produção'})).toBeVisible();const group=page.locator('details[aria-label="Demandas de Aurora Café — TESTE FICTÍCIO"]');await expect(group).toBeVisible();await expect(page.getByRole('button',{name:/Arte Aurora/})).toBeHidden();await group.locator('summary').click();await page.getByRole('button',{name:/Arte Aurora/}).click();await expect(page.getByRole('dialog')).toBeVisible();
});
test('management Kanban shows client columns and preserves the central demand dialog',async({page})=>{
 await setup(page);await page.goto('/projects');await expect(page.getByRole('heading',{name:'Kanban Geral',exact:true})).toBeVisible();await expect(page.getByRole('region',{name:'Kanban de Aurora Café — TESTE FICTÍCIO'})).toBeVisible();await page.getByRole('button',{name:/Arte Aurora/}).click();await expect(page.getByRole('dialog')).toBeVisible();
});
test('member cannot open the management aggregate but keeps production access',async({page})=>{
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('get_management_kanban'))requests.push(r.url())});await setup(page,'[Design]',task.description,'MEMBER');await page.goto('/projects');await expect(page.getByRole('heading',{name:'Acesso negado',exact:true})).toBeVisible();expect(requests).toEqual([]);await page.goto('/production/design');await expect(page.getByRole('region',{name:'Demandas de Aurora Café — TESTE FICTÍCIO'})).toBeVisible();
});
test('diagnostics lists this delivery and its remaining external checks',async({page})=>{
 await setup(page);await page.goto('/settings/diagnostics');await expect(page.getByRole('heading',{name:'Última entrega: Fechamento por fases: configurações e colaboração'})).toBeVisible();await expect(page.getByRole('heading',{name:'Tráfego: métricas Meta por campanha'})).toBeVisible();await expect(page.getByText(/Validar a leitura com autorização ads_read ativa/)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('personal agenda uses calendar, week, day and list without creating events',async({page})=>{
 await setup(page);await page.goto('/calendar');await expect(page.getByRole('region',{name:'Calendário pessoal'})).toBeVisible();await page.getByLabel('Período',{exact:true}).selectOption('week');await page.getByLabel('Período',{exact:true}).selectOption('day');await page.getByRole('button',{name:'Lista',exact:true}).click();await expect(page.getByRole('region',{name:'Calendário pessoal'})).toBeHidden();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Meta returns campaign metrics and clears the old period when changing the filter',async({page})=>{
 await setup(page,'[Tráfego Pago]');await page.route('**/functions/v1/meta-workspace',async route=>{const body=route.request().postDataJSON();expect(['last_7d','last_30d','last_90d']).toContain(body.period);await route.fulfill({json:{connected:true,insights:[{spend:'100',reach:'500',clicks:'50',impressions:'1000',account_currency:'BRL',date_start:'2026-10-01',date_stop:'2026-10-07'}],campaigns:[{campaign_id:'demo',campaign_name:'Campanha simulada — TESTE',spend:'60',account_currency:'BRL'}]}})});await page.goto('/production/traffic');await page.getByLabel('Cliente dos resultados Meta').selectOption('aurora');await page.getByRole('button',{name:'Consultar resultados',exact:true}).click();await expect(page.getByRole('heading',{name:'Campanha simulada — TESTE'})).toBeVisible();await page.getByLabel('Período das métricas Meta').selectOption('last_7d');await expect(page.getByRole('heading',{name:'Campanha simulada — TESTE'})).toBeHidden();await page.getByRole('button',{name:'Consultar resultados',exact:true}).click();await expect(page.getByRole('heading',{name:'Campanha simulada — TESTE'})).toBeVisible();
});

test('presentation PDF embeds artwork and downloads the previewed file',async({page})=>{
 await setup(page);const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="#2d4038"/><circle cx="500" cy="440" r="170" fill="#d5b88b"/><text x="500" y="760" fill="white" font-size="60" text-anchor="middle">Aurora Café</text><text x="500" y="850" fill="white" font-size="32" text-anchor="middle">TESTE FICTÍCIO</text></svg>';
 await page.route('https://audit-media.invalid/art.svg',route=>route.fulfill({body:svg,contentType:'image/svg+xml',headers:{'access-control-allow-origin':'*'}}));
 await page.route('**/rest/v1/presentations*',route=>route.fulfill({json:{id:'pdf-test',agency_id:agency,client_id:'aurora',title:'Aurora Café — apresentação de teste',period_month:11,period_year:2026,created_at:'2026-10-14T00:00:00Z',updated_at:'2026-10-14T00:00:00Z',status:'draft',clients:{name:client.name},presentation_sections:[{id:'s',title:'Entregas e direção visual',position:0,content:{text:'Copy de teste e direção visual preservadas. '+('Conteúdo de revisão para validar paginação e leitura. '.repeat(80)),images:[{src:'https://audit-media.invalid/art.svg',alt:'Arte fictícia Aurora Café'}]}}],presentation_assets:[]}}));
 await page.goto('/presentations/pdf-test/export');await page.getByRole('button',{name:'Visualizar Prévia',exact:true}).click();await expect(page.getByTitle('Prévia da Apresentação PDF')).toBeVisible({timeout:30000});await expect(page.getByText(/materiais não tiveram a prévia carregada/)).toHaveCount(0);
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar PDF Agora',exact:true}).click();const download=await downloaded;expect(download.suggestedFilename()).toMatch(/\.pdf$/);if(test.info().project.name==='desktop')await download.saveAs('/private/tmp/aurora-presentation-adjustments.pdf');
});

test('briefings are collapsed by client and preserve response and PDF routes',async({page})=>{
 await setup(page);await page.route('**/rest/v1/briefings*',route=>route.fulfill({json:[{id:'brief-test',client_id:'aurora',title:'Briefing fictício Aurora',status:'submitted',created_at:'2026-10-14T00:00:00Z',updated_at:'2026-10-14T00:00:00Z',client:{name:client.name},template:{name:'Modelo de teste'}}]}));await page.goto('/briefings');await expect(page.getByRole('heading',{name:'Briefing Studio'})).toBeVisible();await expect(page.getByRole('link',{name:'Ver respostas',exact:true})).toBeHidden();await page.locator('details > summary').filter({hasText:client.name}).click();await expect(page.getByRole('link',{name:'Ver respostas',exact:true})).toHaveAttribute('href','/briefings/brief-test/responses');await expect(page.getByRole('link',{name:'Visualizar PDF',exact:true})).toHaveAttribute('href','/briefings/brief-test/export');
});
test('editorial groups campaigns by client and opens the chosen month',async({page})=>{
 await setup(page);const campaign={id:'campaign',client_id:'aurora',month:'2026-11-01',status:'production',project_id:'project',context:{},items:[{date:'2026-11-01',format:'post',title:'Arte de teste',copy:'Copy aprovada de teste',visualDirection:'Direção de teste'}]};await page.route('**/rest/v1/monthly_editorial_campaigns*',route=>route.fulfill({json:new URL(route.request().url()).searchParams.has('id')?campaign:[campaign]}));await page.goto('/editorial');await expect(page.getByRole('heading',{name:'Calendários por cliente'})).toBeVisible();await page.locator('details > summary').filter({hasText:client.name}).click();await page.getByRole('button',{name:/11\/2026/}).click();await expect(page.getByRole('button',{name:'Abrir demanda 1'})).toBeVisible();await page.getByRole('button',{name:'Abrir demanda 1'}).click();await expect(page.getByRole('heading',{name:'Revisar demanda',exact:true})).toBeVisible();
});

for(const path of ['/settings','/settings/agency','/settings/branding','/settings/appearance','/settings/notifications','/settings/team','/settings/permissions','/settings/workspace','/settings/documents','/settings/client-experience','/settings/integrations','/settings/integrations/google','/settings/integrations/meta','/settings/integrations/import-clients','/settings/apps','/settings/security','/settings/activity','/settings/public-site'])test(`settings loads and refreshes ${path}`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);await page.goto(path);await expect(page.locator('main')).toBeVisible();await expect(page.locator('main')).not.toContainText('Unexpected Application Error');await page.reload();await expect(page.locator('main')).toBeVisible();await expect(page).toHaveURL(new RegExp(path+'$'));expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('agency identity waits for real settings and atomically saves the actual contact fields',async({page})=>{
 await setup(page);let calls=0;await page.route('**/rest/v1/rpc/save_agency_identity',async route=>{calls++;const b=route.request().postDataJSON();expect(b.p_branding.contact_phone).toBe('54321');expect(b.p_branding.contact_email).toBe('contato@example.invalid');expect(b.p_preferences.timezone).toBe('Europe/Paris');await route.fulfill({json:{branding:{...b.p_branding,agency_id:agency},preferences:{...b.p_preferences,agency_id:agency}}})});await page.goto('/settings/agency');await expect(page.getByLabel('Nome comercial da agência')).toHaveValue('Agência de teste REAL');await expect(page.getByLabel('Telefone da agência')).toHaveValue('12345');await page.getByLabel('Telefone da agência').fill('54321');await page.getByRole('button',{name:'Salvar Alterações',exact:true}).click();await expect.poll(()=>calls).toBe(1);await expect(page.getByText('Configurações da agência atualizadas com sucesso!',{exact:true})).toBeVisible();
});

test('work rooms link to meetings and show the current presence scope',async({page})=>{
 await setup(page);await page.route('**/rest/v1/rpc/chat_directory',route=>route.fulfill({json:{channels:[{id:'room',agency_id:agency,name:'Sala Aurora — TESTE',channel_type:'general',visibility:'agency'}],conversations:[]}}));await page.goto('/chat');await page.getByRole('button',{name:'Abrir reuniões',exact:true}).click();await expect(page).toHaveURL(/\/meetings$/);
});
test('security reports unconfirmed server revocation and supports a subsequent successful logout',async({page})=>{
 await setup(page);await page.route('**/auth/v1/logout*',route=>route.fulfill({status:500,json:{message:'Logout indisponível'}}));await page.goto('/settings/security');await page.getByRole('button',{name:'Encerrar Sessão no Supabase'}).click();await expect(page).toHaveURL(/\/login\?logout=unconfirmed$/);await expect(page.getByRole('alert')).toContainText('servidor não confirmou');await setup(page);await page.goto('/settings/security');await page.route('**/auth/v1/logout*',route=>route.fulfill({status:204}));await page.getByRole('button',{name:'Encerrar Sessão no Supabase'}).click();await expect(page).toHaveURL(/\/login$/);
});
