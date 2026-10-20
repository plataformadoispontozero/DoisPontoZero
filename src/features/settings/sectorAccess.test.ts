import {expect,it} from 'vitest'
import {accessSectors,sectorLevel,readPermission} from './sectorAccess'
const permissions=[{id:'view',permission_key:'tasks.view'},{id:'edit',permission_key:'tasks.edit'},{id:'delete',permission_key:'tasks.delete'}]
it('recognizes read, work, none and preserves custom grants',()=>{
 expect(sectorLevel(permissions,'r',{})).toBe('none')
 expect(sectorLevel(permissions,'r',{r_view:true})).toBe('read')
 expect(sectorLevel(permissions,'r',{r_edit:true})).toBe('custom')
 expect(sectorLevel(permissions,'r',{r_view:true,r_edit:true,r_delete:true})).toBe('work')
 expect(readPermission({id:'x',permission_key:'permissions.manage'})).toBe(false)
})
it('separates administrative access and does not offer read-only chat',()=>{
 const groups=accessSectors([{id:'s',permission_key:'settings.view',module:'settings'},{id:'p',permission_key:'permissions.manage',module:'settings'},{id:'c',permission_key:'chat.access',module:'chat'},{id:'old',permission_key:'proposals.view',module:'proposals'}])
 expect(groups.map(g=>g.id)).toEqual(expect.arrayContaining(['settings','permissions','chat']))
 expect(groups.find(g=>g.id==='chat')?.readOnlySupported).toBe(false)
 expect(groups.some(g=>g.id==='proposals')).toBe(false)
})
