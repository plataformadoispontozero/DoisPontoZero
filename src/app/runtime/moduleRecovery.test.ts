import {describe,it,expect,vi} from 'vitest'
import {isModuleLoadError,recoverModuleLoad,registerModuleRecovery} from './moduleRecovery'
const error=new TypeError('Failed to fetch dynamically imported module: /assets/Profile-old.js')
function environment(){const data=new Map<string,string>();return {storage:{getItem:(key:string)=>data.get(key)||null,setItem:(key:string,value:string)=>{data.set(key,value)}},reload:vi.fn(),online:true,now:()=>100_000}}
describe('module recovery',()=>{
 it('recognizes supported browser import errors without matching business errors',()=>{expect(isModuleLoadError(error)).toBe(true);expect(isModuleLoadError(new TypeError('Importing a module script failed.'))).toBe(true);expect(isModuleLoadError('Unable to preload CSS for /assets/page.css')).toBe(true);expect(isModuleLoadError(Error('Failed to fetch'))).toBe(false)})
 it('reloads once and prevents loops across the whole tab',()=>{const env=environment();expect(recoverModuleLoad(error,env)).toBe(true);expect(recoverModuleLoad(error,env)).toBe(false);expect(env.reload).toHaveBeenCalledTimes(1)})
 it('allows a later independent recovery but does not reload offline',()=>{const env=environment();recoverModuleLoad(error,env);env.now=()=>200_000;expect(recoverModuleLoad(error,env)).toBe(true);env.online=false;expect(recoverModuleLoad(error,env)).toBe(false)})
 it('does not clear data or reload when storage is blocked',()=>{const env=environment();env.storage.setItem=()=>{throw Error('blocked')};expect(recoverModuleLoad(error,env)).toBe(false);expect(env.reload).not.toHaveBeenCalled()})
 it('ignores unrelated errors and registers a removable listener',()=>{const env=environment();expect(recoverModuleLoad(Error('Permission denied'),env)).toBe(false);const add=vi.spyOn(window,'addEventListener'),remove=vi.spyOn(window,'removeEventListener');const cleanup=registerModuleRecovery();expect(add).toHaveBeenCalledWith('vite:preloadError',expect.any(Function));cleanup();expect(remove).toHaveBeenCalledWith('vite:preloadError',expect.any(Function));add.mockRestore();remove.mockRestore()})
})
