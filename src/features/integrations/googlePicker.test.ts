import {describe,it,expect} from 'vitest';
import {selectedFolderMatches} from './googlePicker';
describe('Google Picker tenant/client folder boundary',()=>{
 it('accepts exactly the folder already linked to this client',()=>{expect(selectedFolderMatches('folder12345678',[{id:'folder12345678',mimeType:'application/vnd.google-apps.folder'}])).toBe(true);});
 it('rejects another client folder, normal file, missing MIME and multi-selection',()=>{
  expect(selectedFolderMatches('folder12345678',[{id:'otherFolder12345',mimeType:'application/vnd.google-apps.folder'}])).toBe(false);
  expect(selectedFolderMatches('folder12345678',[{id:'folder12345678',mimeType:'image/webp'}])).toBe(false);
  expect(selectedFolderMatches('folder12345678',[{id:'folder12345678'}])).toBe(false);
  expect(selectedFolderMatches('folder12345678',[{id:'folder12345678',mimeType:'application/vnd.google-apps.folder'},{id:'anotherfolder123',mimeType:'application/vnd.google-apps.folder'}])).toBe(false);
 });
});
