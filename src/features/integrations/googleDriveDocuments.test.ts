// @vitest-environment node
import {describe,it,expect,vi} from 'vitest';
import {discoverClientDriveDocuments,readClientDriveDocument,readLimitedUtf8,MAX_DRIVE_DOCUMENT_BYTES,isBriefingDocument} from '../../../supabase/functions/google-workspace/documents';
const client='clientFolder12345',docsFolder='briefsFolder12345',document='briefDoc12345678',outside='outsideDoc123456';
const folderMime='application/vnd.google-apps.folder',docMime='application/vnd.google-apps.document';
const json=(value:unknown)=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
const file=(id=document,parents=[client],mimeType=docMime)=>({id,name:'Briefing do cliente',mimeType,parents,version:'1',capabilities:{canDownload:true}});
describe('Private client Drive briefing discovery/read',()=>{
 it('paginates folders, finds briefing/strategy documents and never follows shortcuts',async()=>{
  const visited:string[]=[];const mock=vi.fn(async(input:RequestInfo|URL)=>{const u=new URL(String(input));visited.push(u.href);const q=u.searchParams.get('q')||'';
   if(q.includes(client))return json({files:[{id:docsFolder,name:'02 BRIEFINGS & DOCS',mimeType:folderMime,parents:[client]},{id:'shortcut1234567',name:'Brief externo',mimeType:'application/vnd.google-apps.shortcut',parents:[client]},{...file('outsideBrief1234',['otherClient12345'])}],nextPageToken:u.searchParams.get('pageToken')?undefined:'next'});
   return json({files:[{...file(document,[docsFolder]),name:'Informações.txt',mimeType:'text/plain'}]});});
  const result=await discoverClientDriveDocuments(client,'server-token',mock as typeof fetch);
  expect(result.documents).toHaveLength(1);expect(result.documents[0].path).toBe('02 BRIEFINGS & DOCS/Informações.txt');expect(result.scan.complete).toBe(true);expect(visited.some(u=>u.includes('pageToken=next'))).toBe(true);expect(visited.some(u=>u.includes('shortcut1234567'))).toBe(false);
 });
 it('marks a scan partial when documents or folders exceed bounded limits',async()=>{
  let call=0;const manyDocs=vi.fn(async()=>json({files:Array.from({length:100},(_,i)=>({...file(`brief${String(call*100+i).padStart(12,'0')}`,[client]),name:`Brief ${i}.txt`,mimeType:'text/plain'})),nextPageToken:`page${++call}`}));
  const result=await discoverClientDriveDocuments(client,'server-token',manyDocs as typeof fetch);expect(result.documents).toHaveLength(200);expect(result.scan.complete).toBe(false);expect(result.scan.limitReason).toBe('document_limit');expect(result.scan.requests).toBe(3);
  const manyFolders=vi.fn(async(input:RequestInfo|URL)=>{const q=new URL(String(input)).searchParams.get('q')||'';return json({files:q.includes(client)?Array.from({length:100},(_,i)=>({id:`folder${String(i).padStart(10,'0')}`,name:`Folder${i}`,mimeType:folderMime,parents:[client]})):[]});});
  const partial=await discoverClientDriveDocuments(client,'server-token',manyFolders as typeof fetch);expect(partial.scan.complete).toBe(false);expect(partial.scan.foldersScanned).toBeLessThanOrEqual(100);expect(partial.scan.requests).toBeLessThanOrEqual(100);
 });
 it('rejects a forged document in another client before downloading any bytes',async()=>{
  const mock=vi.fn(async(input:RequestInfo|URL)=>String(input).includes(outside)?json(file(outside,['otherClient12345'])):json({id:'otherClient12345',parents:[]}));
  await expect(readClientDriveDocument(client,outside,'server-token',mock as typeof fetch)).rejects.toThrow('não pertence');expect(mock.mock.calls.some(([u])=>String(u).includes('export')||String(u).includes('alt=media'))).toBe(false);
 });
 it('exports Google Docs as plain text and returns manual review for PDF without parsing it',async()=>{
  const mock=vi.fn(async(input:RequestInfo|URL)=>String(input).includes('/export?')?new Response('Objetivo: gerar contatos'):json(file()));
  const result=await readClientDriveDocument(client,document,'server-token',mock as typeof fetch);expect(result.text).toBe('Objetivo: gerar contatos');expect(result.manualReviewRequired).toBe(false);expect(mock.mock.calls.some(([u])=>String(u).includes('mimeType=text%2Fplain'))).toBe(true);
  const pdfMock=vi.fn(async()=>json(file(document,[client],'application/pdf')));const pdf=await readClientDriveDocument(client,document,'server-token',pdfMock as typeof fetch);expect(pdf.text).toBeNull();expect(pdf.manualReviewRequired).toBe(true);expect(pdfMock).toHaveBeenCalledTimes(1);
 });
 it('rejects shortcuts, oversize streams, invalid UTF-8 and content changes during export',async()=>{
  await expect(readClientDriveDocument(client,document,'server-token',vi.fn(async()=>json(file(document,[client],'application/vnd.google-apps.shortcut'))) as typeof fetch)).rejects.toThrow('inválido');
  await expect(readLimitedUtf8(new Response(new Uint8Array(MAX_DRIVE_DOCUMENT_BYTES+1)))).rejects.toThrow('512 KB');
  await expect(readLimitedUtf8(new Response(new Uint8Array([0xc3,0x28])))).rejects.toThrow('UTF-8');
  let metadataReads=0;const changing=vi.fn(async(input:RequestInfo|URL)=>String(input).includes('/export?')?new Response('Antes'):json({...file(),version:String(++metadataReads)}));
  await expect(readClientDriveDocument(client,document,'server-token',changing as typeof fetch)).rejects.toThrow('mudou');
 });
 it('recognizes documents only, not a similarly named video',()=>{expect(isBriefingDocument({name:'Estratégia de conteúdo',mimeType:docMime},'')).toBe(true);expect(isBriefingDocument({name:'Briefing.mp4',mimeType:'video/mp4'},'02 BRIEFINGS & DOCS')).toBe(false);});
});
