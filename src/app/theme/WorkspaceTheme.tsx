import {useEffect} from 'react'
import {useAgencyBranding} from '@/features/settings/hooks/useAgencySettings'
import type {ThemeMode} from '@/types/whitelabel'

export function applyWorkspaceTheme(mode:ThemeMode,systemDark:boolean){
 const resolved=mode==='system'?(systemDark?'dark':'light'):mode
 document.documentElement.dataset.workspaceTheme=resolved
 document.documentElement.style.colorScheme=resolved
 return resolved
}
export function WorkspaceTheme(){
 const {branding,isLoading,isError}=useAgencyBranding()
 const mode:ThemeMode=!isLoading&&!isError?branding.theme_mode||'dark':'dark'
 useEffect(()=>{
  const media=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: dark)'):null
  const apply=()=>applyWorkspaceTheme(mode,media?.matches??true)
  apply();media?.addEventListener('change',apply)
  return()=>{media?.removeEventListener('change',apply);delete document.documentElement.dataset.workspaceTheme;document.documentElement.style.removeProperty('color-scheme')}
 },[mode,branding.agency_id])
 return null
}
