import {test,expect} from '@playwright/test'
import {accessWorkspace,agency,roles} from './fixtures/access-workspace'

test('configura um perfil por setor, salva e preserva o acesso após recarregar',async({page})=>{
 const {permissionCalls}=await accessWorkspace(page)
 await page.goto('/settings/permissions')
 await expect(page.getByRole('heading',{name:'Acessos por setor'})).toBeVisible()
 await expect(page.getByLabel('Perfil de acesso')).toHaveValue(roles[1].id)
 const access=page.getByLabel('Acesso a Produção e tarefas')
 await expect(access).toHaveValue('none')
 await access.selectOption('read');await page.getByRole('button',{name:'Salvar acessos',exact:true}).click()
 await expect(page.getByRole('button',{name:'Salvar acessos',exact:true})).toBeDisabled()
 expect(permissionCalls).toEqual([{p_agency_id:agency,p_changes:[{role_id:roles[1].id,permission_id:'66666666-6666-4666-8666-666666666666',allowed:true}]}])
 await page.reload();await expect(access).toHaveValue('read')
 await access.selectOption('work');await page.getByRole('button',{name:'Salvar acessos',exact:true}).click();await expect(page.getByRole('button',{name:'Salvar acessos',exact:true})).toBeDisabled()
 await page.reload();await expect(access).toHaveValue('work')
 await page.getByLabel('Perfil de acesso').selectOption(roles[0].id);await expect(access).toBeDisabled()
})
