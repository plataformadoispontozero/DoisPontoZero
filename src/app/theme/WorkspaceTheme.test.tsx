import {render,act} from '@testing-library/react'
import {describe,it,expect,vi,afterEach} from 'vitest'
import {WorkspaceTheme} from './WorkspaceTheme'
const state=vi.hoisted(()=>({mode:'system'}))
vi.mock('@/features/auth/AuthProvider',()=>({useAuth:()=>({user:{id:'workspace-theme-fixture'}})}))
vi.mock('@/features/settings/hooks/useAgencySettings',()=>({useAgencyBranding:()=>({branding:{agency_id:'agency',theme_mode:state.mode},isLoading:false,isError:false})}))
afterEach(()=>{vi.unstubAllGlobals();state.mode='system'})
describe('workspace theme',()=>{
 it('follows live system changes and removes workspace style on exit',()=>{
  let listener=()=>{};const media={matches:false,addEventListener:vi.fn((_event:string,fn:()=>void)=>listener=fn),removeEventListener:vi.fn()}
  vi.stubGlobal('matchMedia',()=>media)
  const view=render(<WorkspaceTheme/>);expect(document.documentElement.dataset.workspaceTheme).toBe('light')
  act(()=>{media.matches=true;listener()});expect(document.documentElement.dataset.workspaceTheme).toBe('dark')
  view.unmount();expect(document.documentElement.dataset.workspaceTheme).toBeUndefined();expect(media.removeEventListener).toHaveBeenCalled()
 })
 it('keeps explicit preference despite system changes',()=>{
  state.mode='light';vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
  const view=render(<WorkspaceTheme/>);expect(document.documentElement.dataset.workspaceTheme).toBe('light');expect(document.documentElement.style.colorScheme).toBe('light');view.unmount()
 })
})
