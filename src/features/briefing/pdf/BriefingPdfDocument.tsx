// ============================================================
// DOIS.ZERO | 2.0
// FASE 06: PDF STUDIO
// Master PDF Document Component
// ============================================================

import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { BriefingPdfModel } from './types'
import { BriefingPdfHeader } from './BriefingPdfHeader'
import { BriefingPdfWatermark } from './BriefingPdfWatermark'
import { BriefingPdfSection } from './BriefingPdfSection'
import { BriefingPdfFooter } from './BriefingPdfFooter'

const styles = StyleSheet.create({
  contentPage: {
    size: 'A4',
    paddingTop: 90,    // 25mm ~ 70pt
    paddingBottom: 56, // 20mm ~ 56pt
    paddingLeft: 44,   // 20mm ~ 56pt
    paddingRight: 44,  // 20mm ~ 56pt
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
})

export const BriefingPdfDocument: React.FC<{ model: BriefingPdfModel }> = ({ model }) => {
  return (
    <Document
      title={`${model.title} — ${model.clientName}`}
      author={model.branding.agencyName}
      subject={`Briefing Criativo: ${model.title}`}
      keywords="briefing, creative, agency, pdf, dois.zero"
    >
      {/* 1. Cover Page */}


      {/* 2. Content Pages */}
      <Page size={model.branding.pageFormat === "Letter" ? "LETTER" : "A4"} style={[styles.contentPage,{fontFamily:model.branding.documentFont || "Helvetica"}]}>
        {/* Centered Watermark across all pages (fixed) */}
        <BriefingPdfWatermark branding={model.branding} />

        {/* Running Header (fixed) */}
        <BriefingPdfHeader branding={model.branding} />

        {/* Document Content */}
        <View style={styles.contentContainer}>
          <View wrap={false} style={{marginBottom:20}}>
            <Text style={{fontSize:10,color:model.branding.primaryColor,fontWeight:'bold',letterSpacing:1}}>BRIEFING ESTRATÉGICO</Text>
            <Text style={{fontSize:25,fontWeight:'bold',color:'#171717',marginTop:7,marginBottom:5}}>{model.clientName}</Text>
            <Text style={{fontSize:9,color:'#737373',marginBottom:12}}>{model.categoryLabel} · {model.formattedDate}</Text>
            <View style={{height:4,backgroundColor:'#e5e7eb',marginBottom:7}}><View style={{height:4,width:`${model.metadata.completionRate}%`,backgroundColor:model.branding.primaryColor}}/></View>
            <Text style={{fontSize:8,color:'#737373'}}>{model.metadata.answeredQuestions} de {model.metadata.totalQuestions} respostas · {model.metadata.completionRate}% preenchido</Text>
            <View style={{flexDirection:'row',gap:8,marginTop:12}}>{[['DOCUMENTO',model.documentId],['STATUS',model.statusLabel],['VERSÃO',`V${model.version}`]].map(([label,value])=><View key={label} style={{flexGrow:1,backgroundColor:'#f5f5f5',borderLeftWidth:2,borderLeftColor:model.branding.primaryColor,padding:9}}><Text style={{fontSize:7,color:'#737373',marginBottom:4}}>{label}</Text><Text style={{fontSize:9,color:'#262626'}}>{value}</Text></View>)}</View>
          </View>
          {model.sections.map((section, sIdx) => (
            <BriefingPdfSection
              key={section.id}
              section={section}
              branding={model.branding}
              index={sIdx}
            />
          ))}
        </View>

        {/* Running Footer (fixed) */}
        <BriefingPdfFooter model={model} />
      </Page>
    </Document>
  )
}
