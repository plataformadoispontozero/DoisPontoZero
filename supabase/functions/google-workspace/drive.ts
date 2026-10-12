export const MAX_DRIVE_UPLOAD_BYTES = 500 * 1024 * 1024;
export const DRIVE_MEDIA_TYPES = new Set(['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']);
export function folderIdFromUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com' || url.username || url.password) return null;
    const id = url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]{10,200})\/?$/)?.[1];
    return id || null;
  } catch { return null; }
}
export function validateDriveUpload(value: {name?: unknown; mimeType?: unknown; size?: unknown}): string | null {
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 200 || /[\x00-\x1f/\\]/.test(value.name)) return 'Nome do arquivo inválido.';
  if (typeof value.mimeType !== 'string' || !DRIVE_MEDIA_TYPES.has(value.mimeType)) return 'Envie uma imagem JPEG, PNG, WebP ou GIF, ou um vídeo MP4, MOV ou WebM.';
  if (typeof value.size !== 'number' || !Number.isSafeInteger(value.size) || value.size < 1 || value.size > MAX_DRIVE_UPLOAD_BYTES) return 'Envie arquivos de até 500 MB.';
  return null;
}
export function isGoogleUploadUrl(value: string): boolean {
  try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'www.googleapis.com' && !u.username && !u.password && u.pathname === '/upload/drive/v3/files' && u.searchParams.get('uploadType') === 'resumable' && !!u.searchParams.get('upload_id'); } catch { return false; }
}
// Follow a bounded parent chain; cycles, missing metadata and excessive depth fail closed.
export async function isFolderDescendant(folderId:string,rootId:string,parents:(id:string)=>Promise<string[]>):Promise<boolean>{
 if(folderId===rootId)return false;
 const visited=new Set<string>();let pending=[folderId];
 for(let depth=0;depth<20&&pending.length;depth++){
  const next:string[]=[];
  for(const id of pending){if(visited.has(id))continue;visited.add(id);if(visited.size>50)return false;const parentIds=await parents(id);if(parentIds.includes(rootId))return true;for(const parent of parentIds)if(!visited.has(parent))next.push(parent);}
  pending=next;
 }
 return false;
}
