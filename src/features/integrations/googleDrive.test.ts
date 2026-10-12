import { describe,it,expect } from 'vitest';
import {folderIdFromUrl,validateDriveUpload,isGoogleUploadUrl,MAX_DRIVE_UPLOAD_BYTES} from '../../../supabase/functions/google-workspace/drive';
describe('Private Google Drive material contract',()=>{
 it('accepts only actual Google folder links, never arbitrary host/file links',()=>{
  expect(folderIdFromUrl('https://drive.google.com/drive/folders/abcDEF_123456789')).toBe('abcDEF_123456789');
  expect(folderIdFromUrl('https://drive.google.com/drive/u/1/folders/abcDEF_123456789')).toBe('abcDEF_123456789');
  for(const value of ['https://evil.example/drive/folders/abcDEF_123456789','http://drive.google.com/drive/folders/abcDEF_123456789','https://drive.google.com/file/d/abcDEF_123456789',null])expect(folderIdFromUrl(value)).toBeNull();
 });
 it('validates upload names, types and size before obtaining Google upload capability',()=>{
  expect(validateDriveUpload({name:'capa.webp',mimeType:'image/webp',size:400})).toBeNull();
  expect(validateDriveUpload({name:'filme.mp4',mimeType:'video/mp4',size:MAX_DRIVE_UPLOAD_BYTES})).toBeNull();
  for(const input of [{name:'../capa.webp',mimeType:'image/webp',size:400},{name:'arquivo.html',mimeType:'text/html',size:400},{name:'video.mp4',mimeType:'video/mp4',size:MAX_DRIVE_UPLOAD_BYTES+1},{name:'foto.jpg',mimeType:'image/jpeg',size:0}])expect(validateDriveUpload(input)).not.toBeNull();
 });
 it('rejects upload capability redirects to third party hosts or normal URLs',()=>{
  expect(isGoogleUploadUrl('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc')).toBe(true);
  expect(isGoogleUploadUrl('https://www.googleapis.com.evil.example/upload/drive/v3/files?uploadType=resumable&upload_id=abc')).toBe(false);
  expect(isGoogleUploadUrl('https://www.googleapis.com/drive/v3/files?uploadType=resumable&upload_id=abc')).toBe(false);
 });
});
