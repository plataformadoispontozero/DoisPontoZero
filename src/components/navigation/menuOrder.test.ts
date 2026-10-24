import {describe,it,expect} from 'vitest'
import {normalizeMenuOrder,moveMenuGroup} from './menuOrder'
describe('personal navigation order',()=>{
 it('rejects unknown/duplicate stored ids and appends new destinations',()=>{expect(normalizeMenuOrder(['b','b','removed'],['a','b','c'])).toEqual(['b','a','c'])})
 it('moves only a known group',()=>{expect(moveMenuGroup(['a','b','c'],'c','a')).toEqual(['c','a','b']);expect(moveMenuGroup(['a','b'],'outside','a')).toEqual(['a','b'])})
})
