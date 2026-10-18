export function officeFlagEnabled(value:string|undefined){return value==='true'}
export function officeRolloutEnabled(value:string|undefined,production:boolean){return officeFlagEnabled(value ?? (production?'true':'false'))}
export const officeEnabled=officeRolloutEnabled(import.meta.env.VITE_ENABLE_DIGITAL_OFFICE,import.meta.env.PROD)

export const officeControlsEnabled=officeEnabled&&officeFlagEnabled(import.meta.env.VITE_ENABLE_OFFICE_CONTROLS)
