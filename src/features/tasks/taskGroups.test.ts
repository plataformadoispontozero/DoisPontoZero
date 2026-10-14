import { describe, expect, it } from 'vitest';
import {groupTasksByClient} from './taskGroups';
describe('client demand groups',()=>{
 it('groups projects of one client by ID and never merges clients with the same name',()=>{
 const task=(client_id:string,name:string)=>({project:{client_id,client:{id:client_id,name}}});
 const groups=groupTasksByClient([task('a','Mesmo nome'),task('a','Mesmo nome'),task('b','Mesmo nome'),{project:null}]);
 expect(groups.find(g=>g.id==='a')?.tasks).toHaveLength(2);expect(groups.find(g=>g.id==='b')?.tasks).toHaveLength(1);expect(groups.find(g=>g.id==='without-client')?.name).toBe('Projetos sem cliente');
 });
});
