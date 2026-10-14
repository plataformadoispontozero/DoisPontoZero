import {test,expect,type Page} from '@playwright/test';
// Browser checks use controlled API fixtures; persistent backend checks are documented separately.
const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',userId='11111111-1111-4111-8111-111111111111';
const client={id:'aurora',name:'Aurora Café — TESTE FICTÍCIO',profile:{monthly_objective:'Apresentar a marca fictícia'}};
const task={id:'task-aurora',agency_id:agency,title:'[Design] Arte Aurora — TESTE',description:'Copy revisada e direção visual de teste',status:'review',priority:'normal',position:0,project_id:'project',board_id:'board',column_id:'column',created_by:userId,archived_at:null,due_date:'2026-11-01',assignees:[],checklists:[],project:{id:'project',name:'Campanha Aurora — TESTE',client_id:client.id,client:{id:client.id,name:client.name}},column:{id:'column',name:'Revisão',category:'review'}};
async function setup(page:Page,prefix='[Design]',description=task.description){
 let demand={...task,title:`${prefix} Arte Aurora — TESTE`,description};
 const user={id:userId,aud:'authenticated',role:'authenticated',email:'aurora-test@example.invalid',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-14T00:00:00Z'};
 const token=`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:userId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated',aud:'authenticated'})).toString('base64url')}.test-only`;
 await page.route('https://audit-auth.supabase.co/**',async route=>{
  const url=new URL(route.request().url()),table=url.pathname.split('/').pop();const send=(data:unknown)=>route.fulfill({json:data,headers:{'access-control-allow-origin':'*'}});
  if(table==='token')return send({access_token:token,refresh_token:'test-only',expires_in:3600,token_type:'bearer',user});
  if(table==='user')return send(user);
  if(table==='agency_members')return send([{agency_id:agency,role_id:'22222222-2222-4222-8222-222222222222',status:'active',agencies:{id:agency,name:'Agência de teste',status:'active'},roles:{name:'OWNER'}}]);
  if(table==='profiles')return send([{id:userId,full_name:'Usuário de teste'}]);
  if(table==='role_permissions')return send([]);
  if(table==='clients')return send([client]);
  if(table==='monthly_editorial_campaigns')return send([{id:'campaign',client_id:client.id,month:'2026-11-01',status:'production',project_id:'project',items:[{format:'post',title:'Arte',copy:'Copy'}]}]);
  if(table==='tasks'){if(route.request().method()==='PATCH')demand={...demand,...route.request().postDataJSON()};return send(url.searchParams.has('id')?demand:[demand]);}
  if(table==='projects')return send([]);
  if(table==='project_boards')return send({id:'board',project_id:'project',columns:[task.column],tasks:[task]});
  return send([]);
 });
 await page.goto('/login');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('test-only');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
}
test('Social Media shows November data without selecting a client and opens the demand centrally',async({page})=>{
 await setup(page);await page.goto('/social-media');await expect(page.getByRole('heading',{name:'Demandas por cliente'})).toBeVisible();await expect(page.getByRole('link',{name:'Abrir calendário'})).toBeVisible();await expect(page.getByLabel('Mês da operação')).toHaveValue('');
 await page.getByRole('button',{name:/Arte Aurora/}).click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('textbox').first()).toHaveValue(task.title);
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
