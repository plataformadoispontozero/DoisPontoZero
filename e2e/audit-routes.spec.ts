import { test, expect } from '@playwright/test'

const routes = ['/dashboard', '/calendar', '/clients', '/projects', '/tasks', '/squads', '/briefings', '/strategy', '/proposals', '/drive', '/presentations', '/meetings', '/chat', '/notifications', '/settings']

for (const route of routes) {
  test(`render and refresh ${route}`, async ({ page }, testInfo) => {
    const crashes: string[] = []
    page.on('pageerror', error => crashes.push(error.message))
    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('main')).not.toContainText('Unexpected Application Error')
    await expect(page).toHaveURL(new RegExp(`${route}$`))
    await page.reload()
    await expect(page.locator('main')).toBeVisible()
    expect(crashes).toEqual([])
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
    expect(overflow).toBe(false)
    await page.screenshot({ path: testInfo.outputPath('route.png'), fullPage: true })
  })
}

test('agenda alias preserves the existing calendar route', async ({ page }) => {
  await page.goto('/agenda')
  await expect(page).toHaveURL(/\/calendar$/)
})

test('permission preview cannot announce a persisted matrix', async ({ page }) => {
  await page.goto('/settings/permissions')
  await expect(page.getByRole('button', { name: 'Salvar Matriz' })).toBeDisabled()
  await expect(page.getByText('RLS não homologada')).toBeVisible()
})
