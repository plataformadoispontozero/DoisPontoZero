import { test, expect } from '@playwright/test'

test.describe('Dois.Zero Application Baseline', () => {
  test('should load dashboard and render branding', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Dois\.Zero/i)
    await expect(page.getByText(/Matriz Criativa/i).first()).toBeVisible()
    await expect(page.getByText(/Indicadores Operacionais/i)).toBeVisible()
  })

  test('should navigate between modules', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: /Projetos/i })).toBeVisible()
    
    await page.goto('/clients')
    await expect(page.getByRole('heading', { name: /Clientes/i })).toBeVisible()

    await page.goto('/settings')
    await expect(page.getByText(/White Label Studio & System Architecture/i)).toBeVisible()
  })
})
