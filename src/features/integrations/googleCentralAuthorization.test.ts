// @vitest-environment node
import {describe,it,expect,vi} from 'vitest';
import ts from 'typescript';
import source from '../../../supabase/functions/google-workspace/index.ts?raw';
import {folderIdFromUrl,validateDriveUpload,isGoogleUploadUrl,isFolderDescendant} from '../../../supabase/functions/google-workspace/drive';
const agency='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
async function productionHandler(){
 let handler:(request:Request)=>Promise<Response>;
 const adminRpc=vi.fn(),providerConfiguration=vi.fn();
 const caller={auth:{getUser:async()=>({data:{user:{id:'designer-user'}},error:null})},rpc:vi.fn(async(name:string)=>({data:name==='has_agency_permission',error:null}))};
 const admin={rpc:adminRpc};
 const script=source.split('\n').filter(line=>!line.startsWith('import ')).join('\n');
 const js=ts.transpileModule(script,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 const runtime={env:{get:(key:string)=>key==='SUPABASE_ANON_KEY'?'anon':key==='GOOGLE_WORKSPACE_TOKEN_KEY'?'token-key':'server-value'},serve:(fn:typeof handler)=>{handler=fn;}};
 new Function('Deno','createClient','providerConfiguration','folderIdFromUrl','validateDriveUpload','isGoogleUploadUrl','corsHeaders','isFolderDescendant',js)(runtime,(_url:string,key:string)=>key==='anon'?caller:admin,providerConfiguration,folderIdFromUrl,validateDriveUpload,isGoogleUploadUrl,{'Access-Control-Allow-Headers':'authorization,content-type'},isFolderDescendant);
 return {handler:handler!,adminRpc,providerConfiguration};
}
describe('Central Google production authorization',()=>{
 it.each(['start','disconnect','drive-list','calendar-list','root-picker-session','client-picker-session'])('does not expose central tokens or full account access through %s to production members',async(action)=>{
  const {handler,adminRpc,providerConfiguration}=await productionHandler();
  const response=await handler(new Request('https://backend.example/google-workspace',{method:'POST',headers:{Authorization:'Bearer user-jwt',Origin:'https://doispontozero.renatodesigner.com.br','Content-Type':'application/json'},body:JSON.stringify({agencyId:agency,clientId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',action})}));
  expect(response.status).toBe(403);const data=await response.json();expect(data.accessToken).toBeUndefined();expect(data.refresh_token).toBeUndefined();expect(data.url).toBeUndefined();expect(adminRpc).not.toHaveBeenCalled();expect(providerConfiguration).not.toHaveBeenCalled();
 });
});
