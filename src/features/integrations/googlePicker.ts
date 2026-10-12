import {nativeApp} from '@/features/app-install/appRuntime';
interface PickerDocument {id?:string;mimeType?:string}
interface PickerData {action?:string;docs?:PickerDocument[]}
interface PickerView {setIncludeFolders(value:boolean):PickerView;setSelectFolderEnabled(value:boolean):PickerView;setMimeTypes(value:string):PickerView}
interface Picker {setVisible(value:boolean):void}
interface PickerBuilder {addView(view:PickerView):PickerBuilder;setOAuthToken(value:string):PickerBuilder;setDeveloperKey(value:string):PickerBuilder;setAppId(value:string):PickerBuilder;setOrigin(value:string):PickerBuilder;setTitle(value:string):PickerBuilder;setCallback(value:(data:PickerData)=>void):PickerBuilder;build():Picker}
interface PickerApi {DocsView:new()=>PickerView;PickerBuilder:new()=>PickerBuilder;Action:{PICKED:string;CANCEL:string}}
type PickerWindow=Window&{gapi?:{load:(name:string,options:{callback:()=>void;onerror:()=>void;timeout:number;ontimeout:()=>void})=>void};google?:{picker?:PickerApi}};
let loading:Promise<PickerApi>|null=null;
function api():Promise<PickerApi>{
 if((window as PickerWindow).google?.picker)return Promise.resolve((window as PickerWindow).google!.picker!);
 if(loading)return loading;
 loading=new Promise<PickerApi>((resolve,reject)=>{
  const fail=()=>reject(Error('Não foi possível carregar o seletor Google. Verifique a conexão e tente novamente.'));
  const load=()=>{const gapi=(window as PickerWindow).gapi;if(!gapi)return fail();gapi.load('picker',{callback:()=>{const picker=(window as PickerWindow).google?.picker;picker?resolve(picker):fail();},onerror:fail,timeout:20000,ontimeout:fail});};
  if((window as PickerWindow).gapi){load();return;}
  const existing=document.querySelector<HTMLScriptElement>('script[data-doiszero-google-picker]');
  if(existing){existing.addEventListener('load',load,{once:true});existing.addEventListener('error',fail,{once:true});return;}
  const script=document.createElement('script');script.src='https://apis.google.com/js/api.js';script.async=true;script.dataset.doiszeroGooglePicker='true';script.onload=load;script.onerror=()=>{script.remove();fail();};document.head.appendChild(script);
 });
 return loading.catch(e=>{loading=null;throw e;});
}
export function selectedFolderMatches(expected:string,documents:PickerDocument[]):boolean {
 return documents.length===1&&documents[0].id===expected&&documents[0].mimeType==='application/vnd.google-apps.folder';
}
export interface PickerSession {accessToken:string;apiKey:string;appId:string;folderId:string}
export async function authorizeClientFolder(session:PickerSession):Promise<void>{
 if(nativeApp())throw Error('Autorize a pasta pelo navegador na página oficial da plataforma. O Google Picker não aceita navegador embutido.');
 if(!session.accessToken||!/^[A-Za-z0-9_-]{20,150}$/.test(session.apiKey)||!/^\d{5,30}$/.test(session.appId)||!/^[A-Za-z0-9_-]{10,200}$/.test(session.folderId))throw Error('Configuração do seletor Google inválida.');
 const pickerApi=await api();
 return new Promise<void>((resolve,reject)=>{
  const view=new pickerApi.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder');
  let picker:Picker;
  const callback=(data:PickerData)=>{
   if(data.action===pickerApi.Action.CANCEL){picker.setVisible(false);reject(Error('Autorização da pasta cancelada.'));}
   if(data.action===pickerApi.Action.PICKED){picker.setVisible(false);if(selectedFolderMatches(session.folderId,data.docs||[]))resolve();else reject(Error('Selecione a pasta vinculada ao cadastro deste cliente. Para trocar a pasta, um gestor precisa editar o cliente primeiro.'));}
  };
  picker=new pickerApi.PickerBuilder().addView(view).setOAuthToken(session.accessToken).setDeveloperKey(session.apiKey).setAppId(session.appId).setOrigin(window.location.origin).setTitle('Autorize a pasta cadastrada para este cliente').setCallback(callback).build();
  picker.setVisible(true);
 });
}
