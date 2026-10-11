import { describe, expect, it } from 'vitest'
import { memberRoleOptions } from './memberRoleOptions'
describe('Assignable agency security roles', () => {
  it('preserves server IDs and excludes OWNER from invitations', () => {
    expect(memberRoleOptions([{id:'owner-id', name:'OWNER'}, {id:'real-admin-id', name:'ADMIN'}])).toEqual([{value:'real-admin-id',label:'Administrador'}])
  })
  it('handles empty agencies without inventing roles or IDs', () => { expect(memberRoleOptions([])).toEqual([]) })
  it('preserves custom roles and descriptions', () => {
    expect(memberRoleOptions([{id:'custom-id',name:'REVIEWER',description:'Revisa entregas'}])).toEqual([{value:'custom-id',label:'REVIEWER — Revisa entregas'}])
  })
})
