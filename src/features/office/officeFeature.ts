export function officeFlagEnabled(value:string|undefined){return value==='true'}
export const officeEnabled=officeFlagEnabled(import.meta.env.VITE_ENABLE_DIGITAL_OFFICE)
