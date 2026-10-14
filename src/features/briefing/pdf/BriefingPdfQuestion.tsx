// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: PDF STUDIO
// Question & Answer Component with Page-Break Protection
// ============================================================

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { BriefingPdfQuestionItem, PdfBrandingConfig } from './types'

const styles = StyleSheet.create({
  questionContainer: {
    marginBottom: 10,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    // Avoid orphan questions across pages
    breakInside: 'avoid',
  },
  questionHeader: {
    marginBottom: 4,
  },
  questionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 1.3,
  },
  questionDescription: {
    fontSize: 8.5,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 1.3,
  },
  answerBox: {
    marginTop: 6,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#C74410',
  },
  answerText: {
    fontSize: 10.5,
    color: '#1F2937',
    lineHeight: 1.45,
  },
  emptyAnswerText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
})

export const BriefingPdfQuestion: React.FC<{
  question: BriefingPdfQuestionItem
  branding: PdfBrandingConfig
  index: number
}> = ({ question, branding }) => {
  return (
    <View style={[styles.questionContainer,{width:question.answerText.length<90&&!question.answerText.includes('\n')?'47%':'100%',marginRight:question.answerText.length<90&&!question.answerText.includes('\n')?'3%':0}]} wrap={question.answerText.length>1200}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionLabel}>{question.label}</Text>
        {question.description ? (
          <Text style={styles.questionDescription}>{question.description}</Text>
        ) : null}
      </View>

      <View
        style={[
          styles.answerBox,
          { borderLeftColor: question.hasAnswer ? branding.primaryColor : '#E5E7EB' },
        ]}
      >
        <Text style={question.hasAnswer ? styles.answerText : styles.emptyAnswerText}>
          {question.answerText}
        </Text>
      </View>
    </View>
  )
}
