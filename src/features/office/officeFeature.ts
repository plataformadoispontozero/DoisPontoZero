export function officeFlagEnabled(value:string|undefined){return value==='true'}
export const officeEnabled=true

export const officeControlsEnabled=officeEnabled&&officeFlagEnabled(import.meta.env.VITE_ENABLE_OFFICE_CONTROLS)
