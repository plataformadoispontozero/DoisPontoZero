import {calculateContrastRatio} from '@/lib/contrast'
export const brandHex=(value:unknown,fallback:string)=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback
export function onBrand(color:string){return calculateContrastRatio('#ffffff',color).ratio>=calculateContrastRatio('#101014',color).ratio?'#ffffff':'#101014'}
export function readableBrand(color:string,background:string){
 if(calculateContrastRatio(color,background).ratio>=4.5)return color
 const target=onBrand(background),from=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),to=[1,3,5].map(i=>parseInt(target.slice(i,i+2),16))
 for(let step=1;step<=20;step++){const value='#'+from.map((v,i)=>Math.round(v+(to[i]-v)*step/20).toString(16).padStart(2,'0')).join('');if(calculateContrastRatio(value,background).ratio>=4.5)return value}
 return target
}
