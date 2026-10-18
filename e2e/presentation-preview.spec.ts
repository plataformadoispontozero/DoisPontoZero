import { test, expect } from '@playwright/test'

// Controlled public response: verifies rendering, not live Google permissions.
test.use({ channel: 'chrome' })
test('public presentation displays project sections and original Drive material access', async ({ page }) => {
  await page.route('**/rest/v1/rpc/get_public_showcase', route => route.fulfill({json:{presentation:{title:'Campanha visual de outubro',client_name:'Cliente de teste',period_month:10,period_year:2026},sections:[{id:'sec',title:'Identidade em movimento',section_type:'gallery',position:0,content:{text:'Direção visual: contrastes e composição editorial.'}}],assets:[{id:'asset',section_id:'sec',title:'Peça principal',mime_type:'image/webp',thumbnail_reference:'https://example.com/art.webp',web_view_link:'https://drive.google.com/file/d/test-material/view'}]}}))
  await page.route('https://example.com/art.webp', route => route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#ff5b16"/></svg>'}))
  await page.goto('/showcase/test-presentation')
  await expect(page.getByRole('heading',{name:'Campanha visual de outubro'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Identidade em movimento'})).toBeVisible()
  await expect(page.getByRole('img',{name:'Peça principal'})).toBeVisible()
  await expect(page.getByRole('link',{name:/Drive/})).toHaveCount(0);await page.getByRole('button',{name:'Ampliar Peça principal',exact:true}).click();await expect(page.getByRole('dialog').getByRole('img',{name:'Visualização ampliada de Peça principal'})).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('gallery switches with a swipe and preserves approval and rejection buttons',async({page})=>{
 await page.route('https://audit-auth.supabase.co/**',async route=>{const name=new URL(route.request().url()).pathname.split('/').pop();await route.fulfill({json:name==='get_public_showcase'?{presentation:{title:'Galeria controlada'},sections:[],assets:[{id:'one',title:'Post um',thumbnail_reference:'https://example.com/one.png'},{id:'two',title:'Post dois',thumbnail_reference:'https://example.com/two.png'}]}:[]})});await page.route('https://example.com/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#ca4b15"/></svg>'}));await page.goto('/showcase/CONTROLLED_TEST_LINK_1234567890');const first=page.getByRole('img',{name:'Post um',exact:true});await expect(first).toBeVisible();await first.dispatchEvent('pointerdown',{isPrimary:true,button:0,pointerId:1,clientX:220,clientY:150});await first.dispatchEvent('pointerup',{isPrimary:true,button:0,pointerId:1,clientX:80,clientY:150});await expect(page.getByRole('img',{name:'Post dois',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Aprovar',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'Reprovar',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'Solicitar ajuste'})).toHaveCount(0);await page.getByRole('button',{name:'Imagem anterior'}).click();await expect(page.getByRole('img',{name:'Post um',exact:true})).toBeVisible()
})
