// @ts-ignore Deno Edge Functions require explicit TypeScript module extensions.
import {verifiedPresentationFiles} from './presentationDrive.ts'
export async function chatDriveFile(folderId:string,fileId:unknown,token:string){
 const files=await verifiedPresentationFiles(folderId,[fileId],token)
 return files[0]
}
export function chatDriveDownload(file:{google_file_id:string;mime_type:string}){
 if(file.mime_type.startsWith('application/vnd.google-apps.')){
  if(!['application/vnd.google-apps.document','application/vnd.google-apps.presentation','application/vnd.google-apps.spreadsheet','application/vnd.google-apps.drawing'].includes(file.mime_type))throw Error('Este formato Google não permite exportação PDF.')
  return {url:`https://www.googleapis.com/drive/v3/files/${file.google_file_id}/export?mimeType=application%2Fpdf`,mime:'application/pdf'}
 }
 return {url:`https://www.googleapis.com/drive/v3/files/${file.google_file_id}?alt=media&supportsAllDrives=true`,mime:'application/octet-stream'}
}
