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
  await expect(page.getByRole('link',{name:'Abrir material no Drive'})).toHaveAttribute('href','https://drive.google.com/file/d/test-material/view')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
