import type { DepartmentWorkload } from '../types'
interface WorkloadTask { title:string; status:string; due_date?:string|null; archived_at?:string|null; task_assignees?:{user_id:string}[]|null }
const sectors=[
 {id:'design',name:'Design',prefix:'[Design]',path:'/production/design'},
 {id:'video',name:'Vídeo & Motion',prefix:'[Videomaker]',path:'/production/video'},
 {id:'social',name:'Social Media',prefix:'[Social Media]',path:'/social-media'},
 {id:'traffic',name:'Tráfego Pago',prefix:'[Tráfego Pago]',path:'/production/traffic'},
]
export function summarizeDepartmentWorkload(tasks:WorkloadTask[],now=new Date()):DepartmentWorkload[]{
 const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
 return sectors.map(sector=>{const selected=tasks.slice(0,1000).filter(t=>!t.archived_at&&['open','in_progress','review'].includes(t.status)&&t.title.startsWith(sector.prefix));return {id:sector.id,name:sector.name,path:sector.path,pending:selected.length,overdue:selected.filter(t=>t.due_date&&t.due_date.slice(0,10)<today).length,unassigned:selected.filter(t=>!t.task_assignees?.length).length,inProgress:selected.filter(t=>t.status==='in_progress').length,limited:tasks.length>=1000}})
}
