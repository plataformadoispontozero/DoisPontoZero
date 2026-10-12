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

test('demand Drive files list real folders and require explicit creation before direct multiupload',async({page})=>{
 await api(page,{owner:true});const taskId='11111111-2222-4222-8222-111111111111',projectId='22222222-2222-4222-8222-222222222222';let selected='client-root-folder-123',created=0,uploads=0;const attachments:any[]=[],sessions=new Map<string,any>();
 const folders=[{id:'october-folder-12345',name:'10 - OUTUBRO',canUpload:true,isAppAuthorized:true}];
 const task={id:taskId,agency_id:agencyA,project_id:projectId,title:'Demanda auditada',description:'Criativo',priority:'normal',status:'todo',due_date:'2026-10-15',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),assignees:[],checklists:[],column:{id:'audit-column',name:'Briefado',category:'todo'},project:{id:projectId,name:'Projeto auditado',client_id:'audit-client',client:{id:'audit-client',name:'Cliente auditado'}}};
 await page.route('**/rest/v1/tasks?**',route=>route.fulfill({json:new URL(route.request().url()).searchParams.has('id')?task:[task]}));
 await page.route('**/rest/v1/task_attachments?**',route=>route.fulfill({json:attachments}));
 await page.route('**/functions/v1/google-workspace',route=>{const b=route.request().postDataJSON();expect(b.taskId).toBe(taskId);expect(b.agencyId).toBe(agencyA);
  if(b.action==='task-drive-list'){const folder=folders.find(f=>f.id===b.folderId)||folders.find(f=>f.id===selected)||{id:'client-root-folder-123',name:'Cliente auditado',canUpload:true,isAppAuthorized:true};return route.fulfill({json:{client:{id:'audit-client',name:'Cliente auditado'},root:{id:'client-root-folder-123',name:'Cliente auditado'},folder,folders:folder.id==='client-root-folder-123'?folders:[],files:[],attachments,savedFolderId:selected,period:{dueDate:'2026-10-15'},canManage:true,canAuthorize:false}});}
  if(b.action==='task-drive-set-folder'){selected=b.folderId;return route.fulfill({json:{savedFolderId:selected}});}
  if(b.action==='task-drive-create-folder'){expect(b.confirmed).toBe(true);created++;const f={id:'new-folder-month-123',name:b.name,canUpload:true,isAppAuthorized:true};folders.push(f);selected=f.id;return route.fulfill({json:{folder:f}});}
  if(b.action==='task-drive-upload-start'){uploads++;const uploadId='upload-'+uploads;sessions.set(uploadId,b);return route.fulfill({json:{uploadId,uploadUrl:'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id='+uploadId}});}
  if(b.action==='task-drive-upload-finish'){const upload=sessions.get(b.uploadId);let a;if(upload.kind==='original'){a={id:'attachment-'+attachments.length,file_name:upload.name,mime_type:upload.mimeType,file_size:upload.size,google_file_id:b.fileId,google_folder_id:upload.folderId,created_at:new Date().toISOString()};attachments.push(a);}else{a=attachments.find(x=>x.id===upload.attachmentId);a.preview_google_file_id=b.fileId;}return route.fulfill({json:{attachment:a}});}
  if(b.action==='task-drive-preview')return route.fulfill({contentType:'application/octet-stream',headers:{'X-Preview-Mime':'image/webp'},body:Buffer.from('RIFF','ascii')});
  throw Error('Unexpected mutation '+b.action);
 });
 await page.route('https://www.googleapis.com/upload/drive/v3/files?**',route=>{expect(route.request().method()).toBe('PUT');return route.fulfill({json:{id:'google-file-'+uploads+'-123456'}});});
 await login(page);await expect(page).toHaveURL(/dashboard/);await page.goto('/tasks/'+taskId);await page.getByRole('tab',{name:/Arquivos/}).click();
 await expect(page.getByRole('heading',{name:'Arquivos da produção · Google Drive'})).toBeVisible();expect(created).toBe(0);expect(uploads).toBe(0);
 await page.getByRole('button',{name:'+ Criar pasta',exact:true}).click();expect(created).toBe(0);await page.getByLabel('Nome',{exact:true}).fill('NOVEMBRO 2026');await page.getByRole('button',{name:'Confirmar criação',exact:true}).click();await expect(page.getByText(/NOVEMBRO 2026/).first()).toBeVisible();expect(created).toBe(1);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=','base64');
 await page.getByLabel('Selecionar arquivos da produção').setInputFiles([{name:'slide-01.png',mimeType:'image/png',buffer:png},{name:'slide-02.png',mimeType:'image/png',buffer:png}]);
 await expect(page.getByRole('status').filter({hasText:'Enviado'})).toHaveCount(2);expect(attachments).toHaveLength(2);expect(attachments.every(a=>a.google_folder_id==='new-folder-month-123')).toBe(true);expect(created).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
