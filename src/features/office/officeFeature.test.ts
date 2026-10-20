import {describe,it,expect} from 'vitest'
import {officeEnabled,officeFlagEnabled} from './officeFeature'
import {routePermission} from '@/features/auth/access'
import {navItems} from '@/components/navigation/NavLinks'
describe('Escritório Digital',()=>{
 it('is enabled with a working office navigation entry',()=>{
  expect(officeEnabled).toBe(true)
  expect(navItems.find(item=>item.id==='chat')).toMatchObject({label:'Escritório Digital',path:'/office'})
 })
 it('keeps explicit enablement for separately controlled features',()=>{
  expect(officeFlagEnabled(undefined)).toBe(false)
  expect(officeFlagEnabled('false')).toBe(false)
  expect(officeFlagEnabled('1')).toBe(false)
  expect(officeFlagEnabled('true')).toBe(true)
 })
 it('uses the existing chat permission for all office routes',()=>{
  for(const path of ['/office','/office/lobby','/office/room/test','/chat','/chat/channels/test','/chat/direct/test'])expect(routePermission(path)).toBe('chat.access')
 })
})
