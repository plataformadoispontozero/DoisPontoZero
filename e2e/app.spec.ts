import { test, expect } from '@playwright/test'

test.describe('Dois.Zero Application Baseline', () => {
  test('should load dashboard and render branding', async ({ page, isMobile }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Dois\.Zero/i)
    const shell = isMobile ? page.getByRole('banner') : page.getByRole('complementary', { name: 'Navegação Principal', exact: true })
    await expect(shell.getByText('Matriz Criativa', { exact: true })).toBeVisible()
    await expect(page.getByText(/Indicadores Operacionais/i)).toBeVisible()
  })

  test('should navigate between modules', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: 'Projetos & Demandas' })).toBeVisible()
    
    await page.goto('/clients')
    await expect(page.getByRole('heading', { name: 'Clientes & Contas' })).toBeVisible()

    await page.goto('/settings')
    await expect(page.getByText(/White Label Studio & System Architecture/i)).toBeVisible()
  })
})
