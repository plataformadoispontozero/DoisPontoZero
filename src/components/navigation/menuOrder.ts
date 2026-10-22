export function normalizeMenuOrder(saved:unknown,defaults:string[]):string[]{
 const valid=Array.isArray(saved)?saved.filter((id):id is string=>typeof id==='string'&&defaults.includes(id)):[]
 return [...new Set([...valid,...defaults])]
}
export function moveMenuGroup(order:string[],source:string,target:string){
 if(source===target||!order.includes(source)||!order.includes(target))return order
 const result=order.filter(id=>id!==source);result.splice(result.indexOf(target),0,source);return result
}
