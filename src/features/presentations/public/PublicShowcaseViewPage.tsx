import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { PresentationPreview, type PreviewPresentation, type PreviewSection, type PreviewAsset } from '../PresentationPreview';

interface ShowcaseData {
  client?: {name?: string; logo_url?: string};
  presentation: PreviewPresentation;
  sections: PreviewSection[];
  assets: PreviewAsset[];
}

export const PublicShowcaseViewPage: React.FC = () => {
  const { publicToken } = useParams<{ publicToken: string }>();

  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShowcase() {
      if (!publicToken) {
        setError('Token de acesso não fornecido.');
        setLoading(false);
        return;
      }

      try {
        if (!supabase) {
          setError('Servidor de dados não configurado.');
          setLoading(false);
          return;
        }
        const { data: showcaseResult, error: rpcError } = await supabase.rpc('get_public_showcase', {
          p_token: publicToken,
        });

        if (rpcError) throw rpcError;
        if (!showcaseResult || showcaseResult.error) {
          setError(showcaseResult?.error || 'Apresentação não encontrada ou expirada.');
          setLoading(false);
          return;
        }

        setData(showcaseResult as ShowcaseData);
      } catch (err: any) {
        console.error('Erro ao buscar showcase público:', err);
        setError('Não foi possível carregar esta apresentação.');
      } finally {
        setLoading(false);
      }
    }

    fetchShowcase();
  }, [publicToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101012] flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400">Carregando apresentação...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#101012] flex flex-col items-center justify-center p-6 text-white text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-xl font-bold">Link de Apresentação Inválido</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {error || 'Esta apresentação pode ter sido revogada ou expirada.'}
        </p>
      </div>
    );
  }

  return <div className="min-h-screen bg-[#101012] p-0 sm:p-4"><PresentationPreview presentation={{...data.presentation, client_name:data.client?.name || data.presentation.client_name, client_logo_url:data.client?.logo_url || data.presentation.client_logo_url}} sections={data.sections} assets={data.assets} /></div>;
};
