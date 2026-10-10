import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, Plus, Calendar, Eye, Download, FileText, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { usePresentations } from '../../presentations/hooks/usePresentations';
import type { Presentation as PresentationType } from '../../../types/presentations';

interface ClientPresentationsTabProps {
  clientId: string;
  clientName: string;
}

export const ClientPresentationsTab: React.FC<ClientPresentationsTabProps> = ({ clientId, clientName }) => {
  const navigate = useNavigate();
  const { presentations, isLoading } = usePresentations();

  const clientPresentations: PresentationType[] = (presentations || []).filter((p: PresentationType) => p.client_id === clientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-content-primary flex items-center">
            <Presentation className="w-5 h-5 mr-2 text-brand-primary" />
            Apresentações de {clientName} ({clientPresentations.length})
          </h3>
          <p className="text-xs text-content-secondary">
            Relatórios de entregas criativas e showcases vinculados a este cliente.
          </p>
        </div>

        <Button size="sm" onClick={() => navigate('/presentations/new')}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Apresentação
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-content-secondary">Carregando apresentações...</div>
      ) : clientPresentations.length === 0 ? (
        <Card className="p-8 text-center space-y-3 border border-dashed border-surface-border">
          <FileText className="w-10 h-10 text-content-tertiary mx-auto" />
          <h4 className="text-sm font-semibold text-content-primary">Nenhuma apresentação para este cliente</h4>
          <p className="text-xs text-content-secondary max-w-sm mx-auto">
            Crie apresentações editoriais para demonstrar a evolução das campanhas e mídias criadas.
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate('/presentations/new')}>
            Criar Primeira Apresentação
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientPresentations.map((pres: PresentationType) => (
            <Card key={pres.id} className="p-5 space-y-4 hover:border-brand-primary/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={pres.status === 'published' ? 'success' : 'neutral'}>
                    {pres.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                  <h4 className="font-bold text-content-primary text-base mt-2">{pres.title}</h4>
                </div>
                <span className="text-xs text-content-tertiary font-mono">
                  {pres.period_month}/{pres.period_year}
                </span>
              </div>

              {pres.description && (
                <p className="text-xs text-content-secondary line-clamp-2">{pres.description}</p>
              )}

              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                <span className="text-content-tertiary">
                  Atualizado em: {new Date(pres.updated_at).toLocaleDateString('pt-BR')}
                </span>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate(`/presentations/${pres.id}`)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Editar Workspace
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
