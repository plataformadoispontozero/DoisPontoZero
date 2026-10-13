import {PresentationMaterialReviews} from './PresentationMaterialReviews';
import {usePresentationReviews,latestMaterialReviews} from './hooks/usePresentationReviews';
import React, { useState } from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Select} from '@/components/ui/Select';
import {PresentationSectionEditor} from './PresentationSectionEditor';
import {PresentationPreview} from './PresentationPreview';
import {ClientPresentationDrivePicker} from './ClientPresentationDrivePicker';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, History, Plus, Trash2, ChevronUp, ChevronDown,
  Globe, Copy, ExternalLink, RefreshCw, FolderPlus, Image as ImageIcon, Video,
  AlertCircle, FileText, Sparkles, Layers, ShieldCheck, Download,
  Search, Link as LinkIcon, HardDrive, Check
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { toast } from '../../components/ui/Toast';
import { useSinglePresentation, SECTION_TYPES } from './hooks/usePresentations';

import { PresentationSectionType, PresentationSection, PresentationAsset } from '../../types/presentations';


export const PresentationWorkspacePage: React.FC = () => {
  const { presentationId } = useParams<{ presentationId: string }>();
  const navigate = useNavigate();
  const cache = useQueryClient();

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
    removeAsset,
    publishPresentation,
    createPublicLink,
    isPublishing,
    isCreatingLink
  } = useSinglePresentation(presentationId);


  // Tab State: 'editor' | 'preview' | 'publish' | 'versions'
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'publish' | 'versions'>('editor');

  // Preview device mode
  const materialReviews=usePresentationReviews(presentationId);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Selected Section for editing
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // New section dialog
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newPresentationSectionType, setNewPresentationSectionType] = useState<PresentationSectionType>('custom');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Add Drive File dialog
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
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
    try { await publishPresentation(); toast.success('Apresentação publicada.'); }
    catch (err) { toast.error((err as {message?: string})?.message || 'Não foi possível publicar.'); }
  };

  const handleGenerateLink = async () => {
    try {
    const token = await createPublicLink();
    if (token) {
      const fullUrl = `${window.location.origin}/showcase/${token}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(fullUrl);
      setTimeout(() => setCopiedLink(null), 4000);
    }
    } catch (err) { toast.error((err as {message?: string})?.message || 'Não foi possível gerar ou copiar o link.'); }
  };

  return (
    <div className="space-y-6 pb-16">
      <PresentationMaterialReviews reviews={materialReviews.data||[]} assets={assets} error={materialReviews.isError}/>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent p-4 text-sm"><span className="font-semibold text-orange-300">{presentation.client_name || 'Apresentação do cliente'}</span><span className="text-zinc-400">{sections.length} seções · {assets.length} materiais</span><Button variant="ghost" size="sm" onClick={()=>setActiveTab('preview')}>Ver apresentação <Eye className="ml-2 h-4 w-4"/></Button></div>
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
              {presentation.client_name || 'Cliente'} &bull; Período: {presentation.period_month}/{presentation.period_year}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex max-w-full flex-wrap items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-all ${
              activeTab === 'editor'
                ? 'bg-surface-card text-brand-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Editar apresentação
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
          <div className="lg:col-span-3 space-y-4 min-w-0">
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
                      {SECTION_TYPES.find(t=>t.type===sec.section_type)?.label||sec.section_type}
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
          <div className="lg:col-span-6 min-w-0 space-y-4">
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

                <PresentationSectionEditor key={selectedSection.id} section={selectedSection} onSave={updates=>updateSection({sectionId:selectedSection.id,updates})}/>

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
                      Selecione uma pasta do cliente para adicionar imagens, vídeos e documentos a esta seção.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {activeSectionAssets.map((asset: PresentationAsset) => (
                        <div key={asset.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {asset.file_reference?.thumbnail_reference && <img src={asset.file_reference.thumbnail_reference} alt={asset.title} loading="lazy" className="mb-3 h-40 w-full rounded-xl object-contain bg-black/20"/>}
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
          <div className="lg:col-span-3 space-y-4 min-w-0">
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
                Organize a narrativa, confira a prévia e publique quando os materiais estiverem prontos.
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
              className={`bg-surface-card border border-surface-border rounded-xl shadow-2xl transition-all duration-300 min-w-0 overflow-hidden ${
                previewDevice === 'desktop'
                  ? 'w-full max-w-5xl'
                  : previewDevice === 'tablet'
                  ? 'w-full max-w-[768px]'
                  : 'w-full max-w-[390px]'
              }`}
            >
              <PresentationPreview presentation={presentation} sections={sections} assets={assets} reviews={latestMaterialReviews(materialReviews.data||[])}/>
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
                  Gere um link seguro para apresentar este material diretamente ao seu cliente.
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
            <Select style={{colorScheme: 'dark'}}
              value={newPresentationSectionType}
              onChange={e => setNewPresentationSectionType(e.target.value as PresentationSectionType)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
            >
              {SECTION_TYPES.map((st) => (
                <option key={st.type} value={st.type}>{st.label}</option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddSectionOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddSectionSubmit} disabled={!newSectionTitle.trim()}>Adicionar</Button>
          </div>
        </div>
      </Dialog>

      {/* DIALOG: ADD ASSET FROM DRIVE */}
      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen} className="max-w-3xl">
        <div className="max-h-[80vh] overflow-y-auto space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-content-primary flex items-center">
                <HardDrive className="w-5 h-5 mr-2 text-brand-primary" />
                Importar Material do Google Drive
              </h3>
              <p className="text-xs text-content-secondary mt-1">
                Navegue pela pasta do cliente e escolha os materiais para esta seção.
              </p>
            </div>
          </div>

          {selectedSection && <ClientPresentationDrivePicker clientId={presentation.client_id} presentationId={presentation.id} sectionId={selectedSection.id} onCancel={()=>setIsAddAssetOpen(false)} onLinked={()=>{void cache.invalidateQueries({queryKey:['presentation',presentation.agency_id,presentation.id]});void cache.invalidateQueries({queryKey:['presentations',presentation.agency_id]});setIsAddAssetOpen(false)}}/>}

        </div>
      </Dialog>
    </div>
  );
};
