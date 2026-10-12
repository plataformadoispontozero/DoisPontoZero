import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Eye, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useSinglePresentation } from './hooks/usePresentations';
import { defaultBranding } from '../../config/branding';
import { toast } from '../../components/ui/Toast';


export const PresentationExportPage: React.FC = () => {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();

  const { presentation, sections, assets, isLoading } = useSinglePresentation(presentationId);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (isLoading || !presentation) {
    return (
      <div className="p-12 text-center text-content-secondary">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm">Carregando dados para exportação...</p>
      </div>
    );
  }

  const buildPdfModel = async () => {
    const { transformPresentationToPdfModel } = await import('./pdf/transformPresentationToPdfModel')
    return transformPresentationToPdfModel(
      { ...presentation, sections: sections ?? [], assets: assets ?? [] } as any,
      defaultBranding as any
    )
  }

  const handleDownloadPdf = async () => {
    setIsExporting(true)
    setDownloadSuccess(false)
    try {
      const { downloadPresentationPdf } = await import('./pdf/generatePresentationPdf')
      const model = await buildPdfModel()
      await downloadPresentationPdf(model)
      setDownloadSuccess(true)
      toast.success('PDF da apresentação gerado com sucesso!')
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      toast.error(`Erro ao gerar PDF: ${String(err)}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePreview = async () => {
    setIsPreviewing(true)
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl)
    try {
      const { generatePresentationPdfBlob } = await import('./pdf/generatePresentationPdf')
      const model = await buildPdfModel()
      const res = await generatePresentationPdfBlob(model)
      setPreviewBlobUrl(res.blobUrl)
      toast.success('Prévia da apresentação carregada!')
    } catch (err) {
      console.error('Erro ao gerar prévia:', err)
      toast.error(`Erro ao renderizar prévia: ${String(err)}`)
    } finally {
      setIsPreviewing(false)
    }
  }


  // Resolve a human-readable client identifier
  const clientDisplay = (presentation as any).client_name || (presentation as any).client?.name || presentation.client_id;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-3 border-b border-surface-border pb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/presentations/${presentation.id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Workspace
        </Button>
        <div>
          <h1 className="text-xl font-bold text-content-primary">Exportar Apresentação em PDF</h1>
          <p className="text-xs text-content-secondary">{presentation.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Details + Actions */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="accent">PDF EDITORIAL WHITE LABEL</Badge>
                <h2 className="text-base font-bold text-content-primary mt-2">Documento de Apresentação Comercial</h2>
                <p className="text-xs text-content-secondary mt-1">
                  Layout profissional com marca-d'água, capa e paginação automática.
                </p>
              </div>
              <FileText className="w-10 h-10 text-brand-primary/40 shrink-0" />
            </div>

            <div className="space-y-2 p-4 bg-surface-subtle rounded-lg border border-surface-border text-xs text-content-secondary">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-content-primary">Cliente:</span>
                <span className="text-right">{clientDisplay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-content-primary">Período:</span>
                <span>{presentation.period_month} / {presentation.period_year}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-content-primary">Seções:</span>
                <span>{sections.length} seções</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-content-primary">Materiais:</span>
                <span>{assets.length} arquivos</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-content-secondary leading-relaxed">
              <h4 className="font-bold text-content-primary flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-primary" />
                Recursos inclusos:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Capa com identificação da Agência e Cliente.</li>
                <li>Marca-d&apos;água centralizada com baixa opacidade.</li>
                <li>Rodapé e paginação automatizados.</li>
                <li>Links para vídeos e arquivos no Drive.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePreview}
                disabled={isPreviewing || isExporting}
                className="w-full"
              >
                {isPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                {isPreviewing ? 'Carregando prévia...' : 'Visualizar Prévia'}
              </Button>
              <Button
                loading={isExporting}
                onClick={handleDownloadPdf}
                disabled={isExporting || isPreviewing}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Gerando PDF...' : 'Baixar PDF Agora'}
              </Button>
            </div>

            {downloadSuccess && (
              <div className="p-3 bg-status-success/10 border border-status-success/30 rounded-lg text-xs text-status-success flex items-center justify-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>PDF gerado e baixado com sucesso!</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right: PDF Preview */}
        <Card className="lg:col-span-3 min-h-[560px] flex flex-col overflow-hidden">
          <div className="p-3 bg-surface-subtle border-b border-surface-border flex items-center justify-between">
            <span className="text-xs font-bold text-content-primary">Visualização do Documento PDF</span>
            {previewBlobUrl && (
              <Button variant="primary" size="sm" onClick={handleDownloadPdf} disabled={isExporting}>
                <Download className="w-3.5 h-3.5 mr-1" />
                Download
              </Button>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center bg-[#111116]">
            {previewBlobUrl ? (
              <iframe
                src={previewBlobUrl}
                className="w-full h-[560px] border-none"
                title="Prévia da Apresentação PDF"
              />
            ) : (
              <div className="p-12 text-center max-w-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1C1C24] border border-[#30303B] flex items-center justify-center text-brand-primary mx-auto shadow-xl">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-content-primary">Pronto para Renderizar</h4>
                  <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                    Clique em <strong>Visualizar Prévia</strong> para renderizar o PDF no navegador,
                    ou em <strong>Baixar PDF Agora</strong> para fazer o download direto.
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={handlePreview} disabled={isPreviewing}>
                  {isPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                  Carregar Prévia na Tela
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

