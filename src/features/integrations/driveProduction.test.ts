import {describe,it,expect,vi} from 'vitest';
import {recommendDriveFolder,uploadMime,uploadDriveChunks} from './driveProduction';
describe('Production destination and direct transport',()=>{
 it('respects existing monthly names and rejects a folder from another year',()=>{const old={id:'old',name:'10 - OUTUBRO 2025'},current={id:'current',name:'10 - OUTUBRO'};expect(recommendDriveFolder([old,current],'2026-10-12').folder).toEqual(current);expect(recommendDriveFolder([old],'2026-11-01').name).toBe('11 - NOVEMBRO 2026');expect(recommendDriveFolder([],'2026-10-01').name).toBe('OUTUBRO 2026');});
 it('does not confuse an unknown month with January',()=>{expect(recommendDriveFolder([],null).name).toBe('');expect(recommendDriveFolder([],'2026-00-01').name).toBe('');});
 it('supports work files whose browser MIME is absent',()=>{expect(uploadMime(new File(['a'],'source.psd'))).toBe('image/vnd.adobe.photoshop');expect(uploadMime(new File(['a'],'source.ai'))).toBe('application/postscript');});
 it('rejects a forged direct-upload host before transmitting any binary',async()=>{await expect(uploadDriveChunks('https://evil.example/upload',new Blob(['x']),'image/png',vi.fn(),new AbortController().signal)).rejects.toThrow('Endereço');});
});

describe('Resumable binary protocol',()=>{
 it('sends chunk ranges directly to Google without forwarding an OAuth token',async()=>{
  const calls:{headers:Record<string,string>;body:Blob|null;url:string}[]=[];
  class Xhr {status=0;responseText='';timeout=0;headers:Record<string,string>={};url='';upload={onprogress:null};onload:(()=>void)|null=null;onerror:(()=>void)|null=null;ontimeout:(()=>void)|null=null;onabort:(()=>void)|null=null;open(_method:string,url:string){this.url=url;}setRequestHeader(k:string,v:string){this.headers[k]=v;}getResponseHeader(){return calls.length===1?'bytes=0-2097151':null;}abort(){this.onabort?.();}send(body:Blob|null){calls.push({headers:this.headers,body,url:this.url});this.status=calls.length===1?308:200;this.responseText=calls.length===1?'':'{"id":"file-google"}';queueMicrotask(()=>this.onload?.());}}
  vi.stubGlobal('XMLHttpRequest',Xhr);
  try{const progress=vi.fn();const result=await uploadDriveChunks('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=a',new Blob([new Uint8Array(2*1024*1024+7)]),'video/mp4',progress,new AbortController().signal);expect(result.id).toBe('file-google');expect(calls.map(c=>c.headers['Content-Range'])).toEqual(['bytes 0-2097151/2097159','bytes 2097152-2097158/2097159']);expect(calls.map(c=>c.body?.size)).toEqual([2097152,7]);expect(calls.every(c=>!('Authorization' in c.headers))).toBe(true);expect(progress).toHaveBeenLastCalledWith(100);}finally{vi.unstubAllGlobals();}
 });
});
