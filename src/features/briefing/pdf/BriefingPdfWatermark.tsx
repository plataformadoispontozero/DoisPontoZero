import React from 'react'
import {View,Image,StyleSheet} from '@react-pdf/renderer'
import type {PdfBrandingConfig} from './types'
const styles=StyleSheet.create({container:{position:'absolute',top:0,left:0,right:0,bottom:0,alignItems:'center',justifyContent:'center',zIndex:-1},image:{width:320,height:380,opacity:0.05,objectFit:'contain'}})
export const BriefingPdfWatermark:React.FC<{branding:PdfBrandingConfig}>=({branding})=>branding.symbolUrl?<View style={styles.container} fixed><Image src={branding.symbolUrl} style={styles.image}/></View>:null
