import {brandHex,onBrand,readableBrand} from './brandTokens'
import {ALLOWED_GOOGLE_FONTS} from '@/lib/contrast'
import {useEffect} from 'react'
import {usePersonalTheme} from './usePersonalTheme'
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
 const {preference}=usePersonalTheme()
 const workspaceMode:ThemeMode=!isLoading&&!isError?branding.theme_mode||'dark':'dark'
 const mode:ThemeMode=preference==='workspace'?workspaceMode:preference
 useEffect(()=>{
  const media=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: dark)'):null
  const values:Record<string,string>={}
  const apply=()=>{
   const resolved=applyWorkspaceTheme(mode,media?.matches??true),light=resolved==='light'
   const primary=brandHex(branding.primary_color,'#C74410'),accent=brandHex(branding.accent_color,'#FF8759'),background=light?'#f3f4f8':brandHex(branding.background_color,'#101014'),surface=light?'#ffffff':brandHex(branding.surface_color,'#1C1C24')
   Object.assign(values,{'--color-primary':primary,'--color-primary-hover':`color-mix(in srgb, ${primary} 85%, #000)`,'--color-accent':accent,'--color-accent-hover':`color-mix(in srgb, ${accent} 85%, #000)`,'--color-on-primary':onBrand(primary),'--color-on-accent':onBrand(accent),'--color-brand-readable':readableBrand(primary,background),'--color-accent-readable':readableBrand(accent,background),'--color-bg':background,'--color-surface':surface,'--color-surface-elevated':light?'#e9ecf3':`color-mix(in srgb, ${surface} 85%, white)`,'--color-text-primary':light?'#191b24':readableBrand(brandHex(branding.text_color,'#F8F9FC'),background),'--color-text-secondary':light?'#464f60':readableBrand(brandHex(branding.secondary_color,'#B8B8C0'),background)})
   const heading=ALLOWED_GOOGLE_FONTS.find(font=>font.name===branding.heading_font),body=ALLOWED_GOOGLE_FONTS.find(font=>font.name===branding.body_font)
   values['--font-heading']=heading?.family||"'Space Grotesk',sans-serif";values['--font-sans']=body?.family||'Inter,sans-serif'
   Object.entries(values).forEach(([key,value])=>document.documentElement.style.setProperty(key,value))
  }
  apply();media?.addEventListener('change',apply)
  return()=>{media?.removeEventListener('change',apply);delete document.documentElement.dataset.workspaceTheme;document.documentElement.style.removeProperty('color-scheme');Object.keys(values).forEach(key=>document.documentElement.style.removeProperty(key))}
 },[mode,branding])

 useEffect(()=>{
  const fonts=[branding.heading_font,branding.body_font].filter(name=>ALLOWED_GOOGLE_FONTS.some(font=>font.name===name))
  if(!fonts.length)return
  const link=document.createElement('link');link.rel='stylesheet';link.href='https://fonts.googleapis.com/css2?'+[...new Set(fonts)].map(name=>'family='+encodeURIComponent(name).replace(/%20/g,'+')+':wght@400;500;600;700').join('&')+'&display=swap'
  document.head.appendChild(link);return()=>link.remove()
 },[branding.heading_font,branding.body_font])
 useEffect(()=>{
  if(!branding.favicon_path||!/^(https:\/\/|\/agency\/)/.test(branding.favicon_path))return
  const previous=document.head.querySelector<HTMLLinkElement>('link[rel="icon"]'),href=previous?.getAttribute('href'),icon=previous||document.createElement('link');icon.rel='icon';icon.href=branding.favicon_path;if(!previous)document.head.appendChild(icon)
  return()=>{if(previous&&href!==null&&href!==undefined)previous.setAttribute('href',href);else icon.remove()}
 },[branding.favicon_path])
 return null
}
