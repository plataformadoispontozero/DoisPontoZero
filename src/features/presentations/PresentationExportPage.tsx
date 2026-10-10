import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useSinglePresentation } from './hooks/usePresentations';
import { generatePresentationPdf } from './pdf/generatePresentationPdf';
import { defaultBranding } from '../../config/branding';

export const PresentationExportPage: React.FC = () => {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();

  const { presentation, sections, assets, isLoading } = useSinglePresentation(presentationId);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (isLoading || !presentation) {
    return (
      <div className="p-12 text-center text-content-secondary">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
        Carregando dados para exportação...
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);
    try {
      await generatePresentationPdf({
        presentation,
        sections,
        assets,
        branding: defaultBranding
      });
      setDownloadSuccess(true);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
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

      <Card className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="accent">PDF EDITORIAL WHITE LABEL</Badge>
            <h2 className="text-lg font-bold text-content-primary mt-2">Documento de Apresentação Comercial</h2>
            <p className="text-xs text-content-secondary mt-1">
              Gere um arquivo PDF formatado com layout profissional de imprensa e portfólio.
            </p>
          </div>
          <FileText className="w-12 h-12 text-brand-primary/40" />
        </div>

        <div className="space-y-3 p-4 bg-surface-subtle rounded-lg border border-surface-border text-xs text-content-secondary">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-content-primary">Cliente:</span>
            <span>{presentation.client_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-content-primary">Período:</span>
            <span>{presentation.period_month} / {presentation.period_year}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-content-primary">Total de Seções:</span>
            <span>{sections.length} seções</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-content-primary">Total de Materiais:</span>
            <span>{assets.length} arquivos vinculados</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-content-secondary leading-relaxed">
          <h4 className="font-bold text-content-primary flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-primary" />
            Recursos inclusos no PDF:
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Capa com identificação da Agência e Cliente.</li>
            <li>Marca-d&apos;água centralizada com baixa opacidade.</li>
            <li>Rodapé e paginação automatizados.</li>
            <li>Links seguros para vídeos e arquivos hospedados no Drive.</li>
          </ul>
        </div>

        <div className="pt-4 flex flex-col space-y-3">
          <Button
            loading={isExporting}
            onClick={handleDownloadPdf}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF Agora
          </Button>

          {downloadSuccess && (
            <div className="p-3 bg-status-success/10 border border-status-success/30 rounded-lg text-xs text-status-success flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>PDF gerado e baixado com sucesso!</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
