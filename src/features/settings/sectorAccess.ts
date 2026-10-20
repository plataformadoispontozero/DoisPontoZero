export interface AccessPermission {id:string;permission_key:string;module?:string;description?:string|null}
export type AccessLevel='none'|'read'|'work'|'custom'
export const roleLabel=(name:string)=>({OWNER:'Proprietário',ADMIN:'Administrador',MANAGER:'Gestor',MEMBER:'Colaborador',VIEWER:'Somente leitura'}[name]||name)
const labels:Record<string,string>={dashboard:'Visão geral',clients:'Clientes',projects:'Projetos e Kanban',tasks:'Produção e tarefas',squads:'Squads',briefings:'Briefings',strategy:'Estratégia e Social Media',drive:'Google Drive',presentations:'Apresentações',meetings:'Agenda e reuniões',chat:'Escritório Digital',team:'Equipe',branding:'Marca e aparência',settings:'Configurações da agência',integrations:'Integrações',permissions:'Gestão de acessos',security:'Segurança e diagnósticos',finance:'Financeiro'}
export function accessSectors(permissions:AccessPermission[]){
 const groups=new Map<string,AccessPermission[]>()
 for(const permission of permissions){
  const prefix=permission.permission_key.split('.')[0]
  if(prefix==='proposals')continue
  const key=prefix==='activity'?'dashboard':prefix==='members'?'team':['diagnostics','security'].includes(prefix)?'security':labels[prefix]?prefix:permission.module||prefix
  groups.set(key,[...(groups.get(key)||[]),permission])
 }
 return [...groups].map(([id,items])=>({id,label:labels[id]||'Outros acessos',permissions:items,readOnlySupported:id!=='chat'})).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'))
}
export function readPermission(permission:AccessPermission){return /\.(view(?:_.*)?|export)$/.test(permission.permission_key)}
export function sectorLevel(permissions:AccessPermission[],roleId:string,matrix:Record<string,boolean>):AccessLevel{
 const enabled=permissions.filter(p=>!!matrix[`${roleId}_${p.id}`])
 if(!enabled.length)return 'none'
 const read=permissions.filter(readPermission)
 if(read.length>0&&permissions.every(p=>!!matrix[`${roleId}_${p.id}`]===readPermission(p)))return 'read'
 if(enabled.length===permissions.length)return 'work'
 return 'custom'
}
