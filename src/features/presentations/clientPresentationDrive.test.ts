// @vitest-environment node
import {afterEach,describe,expect,it,vi} from 'vitest'
import {verifiedPresentationFiles} from '../../../supabase/functions/google-workspace/presentationDrive'
afterEach(()=>vi.unstubAllGlobals())
const file={id:'file1234567890',name:'Arte.webp',mimeType:'image/webp',parents:['folder12345678'],size:'123'}
describe('materiais de apresentações no Drive',()=>{
 it('busca metadata real e não aceita título/link fornecido pelo navegador',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(file))));const rows=await verifiedPresentationFiles('folder12345678',[file.id,file.id],'token');expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({name:'Arte.webp',size_bytes:123,parent_folder_id:'folder12345678',web_view_link:`https://drive.google.com/file/d/${file.id}/view`});})
 it.each([{...file,parents:['otherClientFolder']},{...file,trashed:true},{...file,mimeType:'application/vnd.google-apps.shortcut'},{...file,mimeType:'application/vnd.google-apps.folder'}])('rejeita materiais externos, excluídos e atalhos',async entry=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify(entry))));await expect(verifiedPresentationFiles('folder12345678',[file.id],'token')).rejects.toThrow('pasta selecionada');})
 it('recusa lotes inválidos antes de chamar o Google',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);await expect(verifiedPresentationFiles('folder12345678',Array(21).fill(file.id),'token')).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();})
 it('não grava metadata de arquivos sem acesso',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:403})));await expect(verifiedPresentationFiles('folder12345678',[file.id],'token')).rejects.toThrow('indisponível');})
 it('preserva apenas miniatura HTTPS do Google, sem binários ou URL externa',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({...file,thumbnailLink:'https://lh3.googleusercontent.com/preview'}))));expect((await verifiedPresentationFiles('folder12345678',[file.id],'token'))[0].thumbnail_reference).toBe('https://lh3.googleusercontent.com/preview');vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({...file,thumbnailLink:'https://outside.invalid/image'}))));expect((await verifiedPresentationFiles('folder12345678',[file.id],'token'))[0].thumbnail_reference).toBeNull()})

})
