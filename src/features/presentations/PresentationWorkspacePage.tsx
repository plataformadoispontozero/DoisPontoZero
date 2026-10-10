import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, Send, FileCode, History, Plus, Trash2, ChevronUp, ChevronDown,
  Globe, Copy, Lock, ExternalLink, RefreshCw, FolderPlus, Image as ImageIcon, Video,
  CheckCircle, AlertCircle, FileText, Sparkles, Layers, ShieldCheck, Download
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useSinglePresentation, SECTION_TYPES } from './hooks/usePresentations';
import { useDrive } from '../drive/hooks/useDrive';
import { PresentationSectionType, PresentationSection, PresentationAsset } from '../../types/presentations';
import type { DriveFileReference } from '../../types/drive';

export const PresentationWorkspacePage: React.FC = () => {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();

  const {
    presentation,
    sections,
    assets,
    versions,
    isLoading,
    isError,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addAsset,
    removeAsset,
    publishPresentation,
    createPublicLink,
    isPublishing,
    isCreatingLink
  } = useSinglePresentation(presentationId);

  const { driveFiles } = useDrive();

  // Tab State: 'editor' | 'preview' | 'publish' | 'versions'
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'publish' | 'versions'>('editor');

  // Preview device mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Selected Section for editing
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // New section dialog
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newPresentationSectionType, setNewPresentationSectionType] = useState<PresentationSectionType>('custom');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Add Drive File dialog
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [selectedDriveFileId, setSelectedDriveFileId] = useState('');

  // Public link notification
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-content-secondary">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
        Carregando apresentação...
      </div>
    );
  }

  if (isError || !presentation) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-status-error mx-auto" />
        <h2 className="text-xl font-bold text-content-primary">Apresentação não encontrada</h2>
        <Button variant="ghost" onClick={() => navigate('/presentations')}>
          Voltar para Apresentações
        </Button>
      </div>
    );
  }

  const selectedSection = sections.find((s: PresentationSection) => s.id === selectedSectionId) || sections[0];
  const activeSectionAssets = selectedSection ? assets.filter((a: PresentationAsset) => a.section_id === selectedSection.id) : [];

  const handleAddSectionSubmit = async () => {
    if (!newSectionTitle.trim()) return;
    await addSection({
      section_type: newPresentationSectionType,
      title: newSectionTitle,
      description: '',
      content: {},
      position: sections.length
    });
    setNewSectionTitle('');
    setIsAddSectionOpen(false);
  };

  const handleAddAssetSubmit = async () => {
    if (!selectedSection || !selectedDriveFileId) return;
    const driveFile = driveFiles.find((f: DriveFileReference) => f.id === selectedDriveFileId);
    await addAsset({
      section_id: selectedSection.id,
      file_reference_id: selectedDriveFileId,
      title: driveFile?.name || 'Arquivo do Drive',
      description: driveFile?.mime_type || '',
      position: activeSectionAssets.length
    });
    setSelectedDriveFileId('');
    setIsAddAssetOpen(false);
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const sectionIds = newSections.map(s => s.id);
    await reorderSections(sectionIds);
  };

  const handlePublish = async () => {
    await publishPresentation();
  };

  const handleGenerateLink = async () => {
    const token = await createPublicLink();
    if (token) {
      const fullUrl = `${window.location.origin}/showcase/${token}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(fullUrl);
      setTimeout(() => setCopiedLink(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/presentations')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-content-primary">{presentation.title}</h1>
              <Badge variant={presentation.status === 'published' ? 'success' : 'neutral'}>
                {presentation.status === 'published' ? 'Publicado' : 'Rascunho'}
              </Badge>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              Cliente ID: {presentation.client_id} &bull; Período: {presentation.period_month}/{presentation.period_year}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-surface-subtle p-1 rounded-lg border border-surface-border space-x-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-all ${
              activeTab === 'editor'
                ? 'bg-surface-card text-brand-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Builder Visual
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-all ${
              activeTab === 'preview'
                ? 'bg-surface-card text-brand-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Pré-visualização
          </button>

          <button
            onClick={() => setActiveTab('publish')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-all ${
              activeTab === 'publish'
                ? 'bg-surface-card text-brand-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Globe className="w-3.5 h-3.5 mr-1.5" />
            Publicação
          </button>

          <button
            onClick={() => setActiveTab('versions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-all ${
              activeTab === 'versions'
                ? 'bg-surface-card text-brand-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            Versões
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/presentations/${presentation.id}/export`)}>
            <Download className="w-4 h-4 mr-1.5" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* TAB 1: VISUAL BUILDER */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Sections Structure */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-content-primary flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-brand-primary" />
                Seções ({sections.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsAddSectionOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {sections.map((sec: PresentationSection, idx: number) => (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    (selectedSection?.id === sec.id)
                      ? 'border-brand-primary bg-brand-primary/10 shadow-sm'
                      : 'border-surface-border bg-surface-card hover:border-brand-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                      {sec.section_type}
                    </span>
                    <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-surface-subtle rounded text-content-tertiary disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 hover:bg-surface-subtle rounded text-content-tertiary disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-content-primary mt-1 line-clamp-1">{sec.title}</h4>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setIsAddSectionOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Nova Seção
            </Button>
          </div>

          {/* Center Column: Section Canvas Editor */}
          <div className="lg:col-span-6 space-y-4">
            {selectedSection ? (
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div>
                    <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">
                      Editando Seção #{selectedSection.position + 1}
                    </span>
                    <h2 className="text-lg font-bold text-content-primary">{selectedSection.title}</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-status-error hover:bg-status-error/10"
                    onClick={() => deleteSection(selectedSection.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">Título da Seção</label>
                    <input
                      type="text"
                      value={selectedSection.title}
                      onChange={e => updateSection({ sectionId: selectedSection.id, updates: { title: e.target.value } })}
                      className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">Tipo de Layout</label>
                    <select
                      value={selectedSection.section_type}
                      onChange={e => updateSection({ sectionId: selectedSection.id, updates: { section_type: e.target.value as PresentationSectionType } })}
                      className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
                    >
                      {SECTION_TYPES.map((st) => (
                        <option key={st.type} value={st.type}>
                          {st.label} - {st.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">Contexto Criativo / Texto Explicativo</label>
                    <textarea
                      rows={5}
                      value={selectedSection.description || ''}
                      onChange={e => updateSection({ sectionId: selectedSection.id, updates: { description: e.target.value } })}
                      placeholder="Esta peça foi desenvolvida para reforçar a presença de marca..."
                      className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary resize-none"
                    />
                  </div>
                </div>

                {/* Section Assets */}
                <div className="pt-4 border-t border-surface-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                      Materiais e Arquivos Vinculados ({activeSectionAssets.length})
                    </h4>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => setIsAddAssetOpen(true)}>
                      <FolderPlus className="w-3.5 h-3.5 mr-1" />
                      Importar do Drive
                    </Button>
                  </div>

                  {activeSectionAssets.length === 0 ? (
                    <div className="p-6 border border-dashed border-surface-border rounded-lg text-center text-xs text-content-tertiary">
                      Nenhum material do Google Drive vinculado a esta seção ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {activeSectionAssets.map((asset: PresentationAsset) => (
                        <div key={asset.id} className="p-3 border border-surface-border rounded-lg bg-surface-subtle flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-1 text-brand-primary mb-1">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="text-xs font-semibold truncate max-w-[140px]">{asset.title}</span>
                            </div>
                            <p className="text-[10px] text-content-tertiary">{asset.description || 'Google Drive'}</p>
                          </div>
                          <button
                            onClick={() => removeAsset(asset.id)}
                            className="text-status-error hover:bg-status-error/10 p-1 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-content-secondary">
                Selecione uma seção à esquerda para começar a editar.
              </Card>
            )}
          </div>

          {/* Right Column: Properties & Tips */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-brand-primary" />
                Diretrizes de Design Editorial
              </h3>
              <ul className="text-xs text-content-secondary space-y-2 list-disc pl-4 leading-relaxed">
                <li>Destaque grandes visualizações de imagens e vídeos de entregas.</li>
                <li>Mantenha textos objetivos, sem promessas não-verificadas.</li>
                <li>Vincule arquivos autorizados do Google Drive para visualização contínua.</li>
              </ul>
            </Card>

            <Card className="p-4 space-y-3 bg-brand-primary/5 border-brand-primary/20">
              <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                Status da Publicação
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Esta apresentação é visualizada com a identidade White Label da sua agência e do cliente.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setActiveTab('publish')}
              >
                Configurar Publicação
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PREVIEW MODE */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Responsive switcher */}
          <div className="flex items-center justify-center space-x-2 bg-surface-subtle p-2 rounded-lg max-w-xs mx-auto border border-surface-border">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                previewDevice === 'desktop' ? 'bg-brand-primary text-white' : 'text-content-secondary'
              }`}
            >
              Desktop (1440px)
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                previewDevice === 'tablet' ? 'bg-brand-primary text-white' : 'text-content-secondary'
              }`}
            >
              Tablet (768px)
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                previewDevice === 'mobile' ? 'bg-brand-primary text-white' : 'text-content-secondary'
              }`}
            >
              Mobile (390px)
            </button>
          </div>

          {/* Frame simulator */}
          <div className="flex justify-center">
            <div
              className={`bg-surface-card border border-surface-border rounded-xl shadow-2xl transition-all duration-300 p-8 space-y-12 ${
                previewDevice === 'desktop'
                  ? 'w-full max-w-5xl'
                  : previewDevice === 'tablet'
                  ? 'w-[768px]'
                  : 'w-[390px]'
              }`}
            >
              {/* Cover Slide Header */}
              <div className="border-b border-surface-border pb-8 text-center space-y-3">
                <Badge variant="accent">DOIS.ZERO SHOWCASE</Badge>
                <h1 className="text-2xl font-extrabold text-content-primary tracking-tight">{presentation.title}</h1>
                <p className="text-sm text-content-secondary">
                  Período: {presentation.period_month}/{presentation.period_year}
                </p>
                {presentation.description && (
                  <p className="text-xs text-content-tertiary max-w-lg mx-auto italic">{presentation.description}</p>
                )}
              </div>

              {/* Sections list */}
              {sections.map((sec: PresentationSection) => {
                const secAssets = assets.filter((a: PresentationAsset) => a.section_id === sec.id);
                return (
                  <div key={sec.id} className="space-y-4 border-b border-surface-border/60 pb-8 last:border-b-0">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{sec.section_type}</span>
                      <h2 className="text-lg font-bold text-content-primary">{sec.title}</h2>
                    </div>

                    {sec.description && (
                      <p className="text-xs text-content-secondary leading-relaxed bg-surface-subtle p-4 rounded-lg border border-surface-border">
                        {sec.description}
                      </p>
                    )}

                    {secAssets.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {secAssets.map((ast: PresentationAsset) => (
                          <div key={ast.id} className="p-4 border border-surface-border rounded-lg bg-surface-subtle text-center space-y-2">
                            <ImageIcon className="w-8 h-8 text-brand-primary mx-auto" />
                            <h4 className="text-xs font-semibold text-content-primary">{ast.title}</h4>
                            <span className="text-[10px] text-content-tertiary">{ast.description || 'Google Drive File'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PUBLICATION & PUBLIC LINKS */}
      {activeTab === 'publish' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center space-x-3 border-b border-surface-border pb-4">
              <Globe className="w-6 h-6 text-brand-primary" />
              <div>
                <h2 className="text-lg font-bold text-content-primary">Publicação e Link de Compartilhamento</h2>
                <p className="text-xs text-content-secondary">
                  Gere um link seguro e imutável para apresentar este material diretamente ao seu cliente.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-subtle rounded-lg border border-surface-border">
                <div>
                  <h4 className="text-sm font-semibold text-content-primary">Status Atual</h4>
                  <p className="text-xs text-content-secondary mt-0.5">
                    {presentation.status === 'published'
                      ? 'Apresentação publicada e acessível via link tokenizado.'
                      : 'Em rascunho interno.'}
                  </p>
                </div>

                <Button
                  loading={isPublishing}
                  onClick={handlePublish}
                  variant={presentation.status === 'published' ? 'outline' : 'primary'}
                >
                  {presentation.status === 'published' ? 'Re-publicar Snapshot' : 'Publicar Agora'}
                </Button>
              </div>

              {/* Public Link Generator */}
              <div className="pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-content-primary flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-primary" />
                  Gerar Novo Link de Acesso Público
                </h4>

                <Button
                  loading={isCreatingLink}
                  onClick={handleGenerateLink}
                  className="bg-brand-primary hover:bg-brand-primary/90"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Gerar Link Tokenizado
                </Button>

                {copiedLink && (
                  <div className="p-3 bg-status-success/10 border border-status-success/30 rounded-lg text-xs text-status-success flex items-center justify-between">
                    <span>Link seguro copiado para a área de transferência!</span>
                    <a
                      href={copiedLink}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-semibold flex items-center"
                    >
                      Abrir <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: VERSIONS */}
      {activeTab === 'versions' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-content-primary flex items-center">
              <History className="w-5 h-5 mr-2 text-brand-primary" />
              Histórico de Versões Imutáveis
            </h2>
            <p className="text-xs text-content-secondary">
              Cada publicação registra um snapshot dos conteúdos e mídias sem alterar versões anteriores compartilhadas.
            </p>

            {versions.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-surface-border rounded-lg text-xs text-content-tertiary">
                Nenhuma versão imutável foi publicada ainda.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {versions.map((v: any) => (
                  <div key={v.id} className="p-4 border border-surface-border rounded-lg bg-surface-subtle flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-brand-primary uppercase">Versão #{v.version_number}</span>
                      <p className="text-xs text-content-secondary mt-0.5">
                        Registrada em: {new Date(v.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="neutral">Imutável</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* DIALOG: ADD SECTION */}
      <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-content-primary">Adicionar Nova Seção</h3>
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Título</label>
            <input
              type="text"
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              placeholder="Ex: Entrega 01 - Visual Identity"
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Tipo de Layout</label>
            <select
              value={newPresentationSectionType}
              onChange={e => setNewPresentationSectionType(e.target.value as PresentationSectionType)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
            >
              {SECTION_TYPES.map((st) => (
                <option key={st.type} value={st.type}>{st.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddSectionOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddSectionSubmit} disabled={!newSectionTitle.trim()}>Adicionar</Button>
          </div>
        </div>
      </Dialog>

      {/* DIALOG: ADD ASSET FROM DRIVE */}
      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-content-primary">Importar Material do Google Drive</h3>
          <p className="text-xs text-content-secondary">
            Selecione um arquivo sincronizado a partir das suas contas e pastas autorizadas.
          </p>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Arquivo Sincronizado</label>
            <select
              value={selectedDriveFileId}
              onChange={e => setSelectedDriveFileId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
            >
              <option value="">Selecione um arquivo do Drive...</option>
              {driveFiles.map((file: DriveFileReference) => (
                <option key={file.id} value={file.id}>
                  {file.name} ({file.mime_type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddAssetOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddAssetSubmit} disabled={!selectedDriveFileId}>Vincular Arquivo</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
