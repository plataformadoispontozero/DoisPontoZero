import {test,expect} from '@playwright/test'
import {accessWorkspace,agency} from './fixtures/access-workspace'

test('adiciona um proprietário e transfere a gestão com confirmação explícita',async({page})=>{
 const {ownershipCalls}=await accessWorkspace(page)
 await page.goto('/settings/team')
 const panel=page.getByRole('region',{name:'Proprietários da agência'})
 await expect(panel).toBeVisible()
 await panel.getByLabel('Novo proprietário').selectOption({label:'Colega QA'})
 await expect(panel.getByRole('button',{name:'Adicionar proprietário',exact:true})).toBeDisabled()
 await panel.getByRole('checkbox').check()
 await panel.getByRole('button',{name:'Adicionar proprietário',exact:true}).click()
 await expect(panel.getByRole('status')).toHaveText('Proprietário adicionado. Você mantém seu acesso.')
 expect(ownershipCalls).toEqual([{p_agency:agency,p_member:'99999999-9999-4999-8999-999999999999',p_action:'add'}])
 await panel.getByLabel('Operação de propriedade').selectOption('transfer')
 await panel.getByLabel('Novo proprietário').selectOption({label:'Colega QA'})
 await expect(panel.getByText(/Meu perfil passará a Administrador/)).toBeVisible()
 await panel.getByRole('checkbox').check()
 await panel.getByRole('button',{name:'Transferir gestão',exact:true}).click()
 await expect(panel).toHaveCount(0)
 expect(ownershipCalls).toHaveLength(2)
 expect(ownershipCalls[1]).toEqual({p_agency:agency,p_member:'99999999-9999-4999-8999-999999999999',p_action:'transfer'})
 await page.reload();await expect(panel).toHaveCount(0)
})
