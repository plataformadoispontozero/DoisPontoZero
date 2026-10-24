/** Isolated production-bundle regression. Run after build and `vite preview`.
 * No authenticated account, backend writes or customer records are used.
 */
import { readdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
const asset = (await readdir('dist/assets')).find(name => /^generateBriefingPdf-.*\.js$/.test(name))
assert.ok(asset, 'Build the platform before this regression')
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
try {
  const page = await browser.newPage()
  const warnings = []
  page.on('console', message => {
    if (/Buffer is not defined|Cannot read properties|Unknown image format/i.test(message.text())) warnings.push(message.text())
  })
  await page.goto(process.env.PDF_TEST_ORIGIN || 'http://127.0.0.1:4173')
  const results = await page.evaluate(async assetName => {
    const { generateBriefingPdfBlob } = await import(`/assets/${assetName}`)
    const results = []
    for (const [font, pageFormat] of [['Helvetica', 'A4'], ['Times-Roman', 'Letter'], ['Courier', 'A4']]) {
      const result = await generateBriefingPdfBlob({
        briefingId: 'preview-only', documentId: 'PRÉVIA', title: 'Direção estratégica', clientName: 'Cliente',
        category: 'social_media', categoryLabel: 'Social Media', version: 1, statusLabel: 'Prévia não salva', formattedDate: '22/10/2026',
        branding: { agencyName: 'Dois.Zero', logoUrl: '/pdf-brand/wordmark.jpg', symbolUrl: '/pdf-brand/symbol.jpg', primaryColor: '#C74410', secondaryColor: '#333333', showLogo: true, showWatermark: true, watermarkOpacity: 0.05, documentFont: font, pageFormat },
        metadata: { totalQuestions: 2, answeredQuestions: 2, completionRate: 100, generatedAt: '2026-10-22' },
        sections: [{ id: 'preview-section', title: 'Contexto do cliente', questions: [
          { id: 'objective', label: 'Objetivo', questionType: 'text', answerText: 'Apresentar o objetivo da campanha e as informações confirmadas no briefing.', hasAnswer: true },
          { id: 'audience', label: 'Público e comunicação', questionType: 'text', answerText: 'Organizar o público-alvo, o tom de voz e a direção visual aprovados para o cliente.', hasAnswer: true },
        ] }],
      })
      const bytes = new Uint8Array(await result.blob.arrayBuffer())
      const text = new TextDecoder('latin1').decode(bytes)
      results.push({ font, pageFormat, size: bytes.length, pdf: text.startsWith('%PDF-'), images: (text.match(/\/Subtype \/Image/g) || []).length })
      URL.revokeObjectURL(result.blobUrl)
    }
    return results
  }, asset)
  for (const result of results) {
    assert.equal(result.pdf, true)
    assert.ok(result.size > 10000, 'Expected a nonempty generated document')
    assert.ok(result.images >= 2, 'Official logo and watermark must be embedded, not silently omitted')
  }
  assert.deepEqual(warnings, [])
  console.log(JSON.stringify({ status: 'PASS', results }, null, 2))
} finally { await browser.close() }
