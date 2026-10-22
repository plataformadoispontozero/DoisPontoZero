import {Text} from '@react-pdf/renderer'
import {BriefingPdfHeader} from '@/features/briefing/pdf/BriefingPdfHeader'
import type {PresentationPdfBranding} from './types'
export function PresentationPdfHeader({branding,periodFormatted}:{branding:PresentationPdfBranding;periodFormatted:string}){
 return <><BriefingPdfHeader branding={{...branding,secondaryColor:'#64748B'}}/><Text fixed style={{position:'absolute',top:79,left:36,right:36,fontSize:8,color:branding.primaryColor,textAlign:'center'}} render={()=>`APRESENTAÇÃO DE ENTREGAS / ${periodFormatted}`}/></>
}
