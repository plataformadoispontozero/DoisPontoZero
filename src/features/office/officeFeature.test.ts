import {describe,it,expect} from 'vitest'
import {officeFlagEnabled} from './officeFeature'
import {routePermission} from '@/features/auth/access'
describe('Office phase 01 rollout',()=>{it('requires explicit enablement and stays off by default',()=>{expect(officeFlagEnabled(undefined)).toBe(false);expect(officeFlagEnabled('false')).toBe(false);expect(officeFlagEnabled('1')).toBe(false);expect(officeFlagEnabled('true')).toBe(true)});it('uses the existing chat permission for all office routes',()=>{for(const path of ['/office','/office/lobby','/office/room/test','/chat','/chat/channels/test','/chat/direct/test'])expect(routePermission(path)).toBe('chat.access')})})
