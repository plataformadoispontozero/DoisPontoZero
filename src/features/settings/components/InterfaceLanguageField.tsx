import { useId } from 'react'
import { Select } from '@/components/ui/Select'

export function InterfaceLanguageField({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  const id=useId()
  const previousLabel=value==='en-US'?'Inglês':value==='es-ES'?'Espanhol':value
  return <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[#B8B8C0]">Idioma da interface</label>
    <Select id={id} value={value} aria-describedby={`${id}-help`} onChange={event=>onChange(event.target.value)}>
      {value!=='pt-BR'&&<option value={value} disabled>{previousLabel} — preferência anterior</option>}
      <option value="pt-BR">Português (Brasil)</option>
    </Select>
    <p id={`${id}-help`} className="mt-1 text-xs leading-relaxed text-[#B8B8C0]">A interface está disponível em português (Brasil). Inglês e espanhol ainda não estão disponíveis.{value!=='pt-BR'?' Sua preferência anterior será mantida até você escolher português.':''}</p>
  </div>
}
