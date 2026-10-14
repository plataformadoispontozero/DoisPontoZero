import {Text,View,Image} from '@react-pdf/renderer'
import type {PresentationPdfBranding} from './types'
export function PresentationPdfHeader({branding,periodFormatted}:{branding:PresentationPdfBranding;periodFormatted:string}){
 return <><Text fixed style={{position:'absolute',top:32,left:36,maxWidth:300,fontSize:12,fontWeight:'bold',color:'#101014'}} render={()=>branding.agencyName}/><Text fixed style={{position:'absolute',top:49,left:36,fontSize:8,color:branding.primaryColor}} render={()=>`APRESENTAÇÃO DE ENTREGAS / ${periodFormatted}`}/>{branding.logoUrl?<Image fixed src={branding.logoUrl} style={{position:'absolute',right:36,top:32,width:100,height:24,objectFit:'contain'}}/>:<Text fixed style={{position:'absolute',right:36,top:40,maxWidth:210,fontSize:8,color:'#64748B'}} render={()=>branding.website}/>}<View fixed style={{position:'absolute',top:68,left:36,right:36,borderBottomWidth:1,borderBottomColor:'#E2E8F0'}}/></>
}
