import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, FolderKanban, Calendar, FileText, LayoutTemplate } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { INITIAL_PRESENTATION_TEMPLATES, usePresentations } from './hooks/usePresentations';
import { useClients } from '../clients/hooks/useClients';
import { PresentationTemplate } from '../../types/presentations';
import type { Client } from '../../types/projects';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const NewPresentationPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { createPresentation, isCreating } = usePresentations();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [periodMonth, setPeriodMonth] = useState<number>(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState<number>(new Date().getFullYear());
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate>(INITIAL_PRESENTATION_TEMPLATES[0]);

  const safeClients: Client[] = clients || [];
  const selectedClient = safeClients.find((c: Client) => c.id === selectedClientId);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = safeClients.find((c: Client) => c.id === clientId);
    if (client && !title) {
      setTitle(`Relatório Mensal - ${client.name} - ${MONTHS[periodMonth - 1]} / ${periodYear}`);
    }
  };

  const handleCreate = async () => {
    if (!selectedClientId || !title) return;

    try {
      const created = await createPresentation({
        client_id: selectedClientId,
        title,
        description,
        period_month: periodMonth,
        period_year: periodYear,
        template_id: selectedTemplate.id,
      });

      if (created?.id) {
        navigate(`/presentations/${created.id}`);
      } else {
        navigate('/presentations');
      }
    } catch (err) {
      console.error('Erro ao criar apresentação:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/presentations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-content-primary">Nova Apresentação</h1>
            <p className="text-xs text-content-secondary">Crie relatórios e showcases de entregas criativas para seus clientes</p>
          </div>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <span className={`px-2.5 py-1 rounded-full font-medium ${step === 1 ? 'bg-brand-primary text-white' : 'bg-surface-subtle text-content-secondary'}`}>
            1. Cliente
          </span>
          <span className="text-content-tertiary">&rarr;</span>
          <span className={`px-2.5 py-1 rounded-full font-medium ${step === 2 ? 'bg-brand-primary text-white' : 'bg-surface-subtle text-content-secondary'}`}>
            2. Período
          </span>
          <span className="text-content-tertiary">&rarr;</span>
          <span className={`px-2.5 py-1 rounded-full font-medium ${step === 3 ? 'bg-brand-primary text-white' : 'bg-surface-subtle text-content-secondary'}`}>
            3. Detalhes
          </span>
          <span className="text-content-tertiary">&rarr;</span>
          <span className={`px-2.5 py-1 rounded-full font-medium ${step === 4 ? 'bg-brand-primary text-white' : 'bg-surface-subtle text-content-secondary'}`}>
            4. Template
          </span>
        </div>
      </div>

      {/* Step 1: Select Client */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-content-primary flex items-center">
              <FolderKanban className="w-5 h-5 mr-2 text-brand-primary" />
              Selecione o Cliente
            </h2>
            <p className="text-sm text-content-secondary">Escolha para qual cliente esta apresentação será direcionada.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {safeClients.map((client: Client) => (
              <Card
                key={client.id}
                onClick={() => handleClientSelect(client.id)}
                className={`p-4 cursor-pointer border transition-all ${
                  selectedClientId === client.id
                    ? 'border-brand-primary bg-brand-primary/5 shadow-md'
                    : 'border-surface-border hover:border-brand-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-content-primary">{client.name}</h3>
                    <p className="text-xs text-content-secondary mt-1">{(client as any).company || 'Cliente corporativo'}</p>
                  </div>
                  {selectedClientId === client.id && (
                    <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              disabled={!selectedClientId}
              onClick={() => setStep(2)}
            >
              Próximo Passo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Period */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-content-primary flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-brand-primary" />
              Selecione o Período
            </h2>
            <p className="text-sm text-content-secondary">Defina o mês e ano de referência da entrega criativa.</p>
          </div>

          <Card className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Mês de Referência</label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {MONTHS.map((m, idx) => {
                  const monthNum = idx + 1;
                  const isSelected = periodMonth === monthNum;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setPeriodMonth(monthNum);
                        if (selectedClient) {
                          setTitle(`Relatório Mensal - ${selectedClient.name} - ${m} / ${periodYear}`);
                        }
                      }}
                      className={`p-3 text-sm rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary text-white font-semibold'
                          : 'border-surface-border bg-surface-card hover:border-brand-primary/50 text-content-primary'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Ano de Referência</label>
              <div className="flex space-x-3">
                {[2025, 2026, 2027].map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setPeriodYear(y);
                      if (selectedClient) {
                        setTitle(`Relatório Mensal - ${selectedClient.name} - ${MONTHS[periodMonth - 1]} / ${y}`);
                      }
                    }}
                    className={`px-6 py-2 text-sm rounded-lg border text-center transition-all ${
                      periodYear === y
                        ? 'border-brand-primary bg-brand-primary text-white font-semibold'
                        : 'border-surface-border bg-surface-card hover:border-brand-primary/50 text-content-primary'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => setStep(3)}>
              Próximo Passo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Title & Description */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-content-primary flex items-center">
              <FileText className="w-5 h-5 mr-2 text-brand-primary" />
              Título e Descrição
            </h2>
            <p className="text-sm text-content-secondary">Personalize a apresentação com um título claro para o cliente.</p>
          </div>

          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">Título da Apresentação</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Showcase Criativo - Instagram & TikTok - Outubro 2026"
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">Descrição Explicativa (Opcional)</label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Resumo executivo do escopo apresentado neste documento..."
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-sm focus:outline-none focus:border-brand-primary resize-none"
              />
            </div>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button disabled={!title.trim()} onClick={() => setStep(4)}>
              Próximo Passo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Select Template */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-content-primary flex items-center">
              <LayoutTemplate className="w-5 h-5 mr-2 text-brand-primary" />
              Escolha um Template de Apresentação
            </h2>
            <p className="text-sm text-content-secondary">Cada template traz uma estrutura pré-definida de seções editoriais.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INITIAL_PRESENTATION_TEMPLATES.map(tpl => (
              <Card
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`p-5 cursor-pointer border transition-all flex flex-col justify-between ${
                  selectedTemplate.id === tpl.id
                    ? 'border-brand-primary bg-brand-primary/5 shadow-md'
                    : 'border-surface-border hover:border-brand-primary/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="accent">{tpl.category}</Badge>
                    {selectedTemplate.id === tpl.id && (
                      <div className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-content-primary text-base mb-1">{tpl.name}</h3>
                  <p className="text-xs text-content-secondary leading-relaxed mb-4">{tpl.description}</p>
                </div>

                <div className="pt-3 border-t border-surface-border/50 text-xs text-content-tertiary">
                  {tpl.sections_snapshot?.length || 0} seções inclusas
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <Button
              loading={isCreating}
              onClick={handleCreate}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Apresentação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
