import { test, expect } from '@playwright/test'

test.describe('Dois.Zero — Suíte E2E de Fluxos Críticos Operacionais', () => {
  test('Fluxo 01: Visão Geral do Dashboard & Navegação Operacional', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Dois\.Zero/i)
    await expect(page.getByRole('heading', { name: 'Visão Geral' })).toBeVisible()
    await expect(page.getByText('Status do Workspace')).toBeVisible()
    await expect(page.getByText('Projetos ativos')).toBeVisible()
    await expect(page.getByText('Tarefas pendentes')).toBeVisible()
  })

  test('Fluxo 02: Módulo de Projetos & Tarefas', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: 'Kanban Geral' })).toBeVisible()
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { name: 'Tarefas & Produção' })).toBeVisible()
  })

  test('Fluxo 03: Briefing Studio & Templates Oficiais', async ({ page }) => {
    await page.goto('/briefings')
    await expect(page.getByText(/Briefing Studio/i).first()).toBeVisible()
  })

  test('Fluxo 04: Strategy Studio & Grade Editorial', async ({ page }) => {
    await page.goto('/strategy')
    await expect(page.getByText(/Strategy Studio/i).first()).toBeVisible()
  })


  test('Fluxo 06: Meeting Hub & Pautas Operacionais', async ({ page }) => {
    await page.goto('/meetings')
    await expect(page.getByText(/Meeting Hub/i).first()).toBeVisible()
  })

  test('Fluxo 07: Team Chat & Canais Internos', async ({ page }) => {
    await page.goto('/chat')
    await expect(page.getByText(/Team Chat/i).first()).toBeVisible()
  })

  test('Fluxo 08: Presentation Studio & Decks Criativos', async ({ page }) => {
    await page.goto('/presentations')
    await expect(page.getByText(/Presentation Studio/i).first()).toBeVisible()
  })

  test('Fluxo 09: White Label Studio, Cores & Painel de Diagnóstico', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText(/White Label Studio & System Architecture/i)).toBeVisible()

    await page.goto('/settings/branding')
    await expect(page.getByText(/Logotipos & Identidade de Marca/i)).toBeVisible()

    await page.goto('/settings/diagnostics')
    await expect(page.getByText(/Painel Técnico & Diagnóstico do Sistema/i)).toBeVisible()
  })
})
