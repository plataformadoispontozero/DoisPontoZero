import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { type MaterialDecision } from '../hooks/usePresentationReviews';
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

  const tokenRef=useRef(publicToken);tokenRef.current=publicToken;
  const [loadedToken,setLoadedToken]=useState<string|undefined>(undefined);
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [reviewLoadError,setReviewLoadError]=useState(false);
  const [reviews,setReviews]=useState<Record<string,{decision:MaterialDecision;note:string}>>({});
  const onReview=async(assetId:string,decision:MaterialDecision,note:string)=>{
    if(!supabase||!publicToken) throw new Error('Conexão indisponível.');
    const {data:review,error:reviewError}=await supabase.rpc('submit_showcase_material_review',{p_token:publicToken,p_asset:assetId,p_decision:decision,p_note:note});
    if(reviewError) throw new Error(reviewError.message);
    if(!review?.id) throw new Error('Não foi possível salvar a avaliação.');
    if(tokenRef.current!==publicToken)return;
    setReviews(current=>({...current,[assetId]:{decision:review.decision,note:review.note}}));
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active=true;setLoading(true);setData(null);setReviews({});setError(null);setReviewLoadError(false);
    async function fetchShowcase() {
      if (!publicToken) {
        setError('Token de acesso não fornecido.');
        setLoading(false);
        return;
      }

      try {
        if (!supabase) {
          setLoadedToken(publicToken);setError('Servidor de dados não configurado.');
          setLoading(false);
          return;
        }
        const { data: showcaseResult, error: rpcError } = await supabase.rpc('get_public_showcase', {
          p_token: publicToken,
        });

        if(!active)return;
        if (rpcError) throw rpcError;
        if (!showcaseResult || showcaseResult.error) {
          setError(showcaseResult?.error || 'Apresentação não encontrada ou expirada.');
          setLoading(false);
          return;
        }

        setData(showcaseResult as ShowcaseData);
        setLoadedToken(publicToken);setLoading(false);
        const history=await supabase.rpc('get_showcase_material_reviews',{p_token:publicToken});
        if(!active)return;
        setReviewLoadError(!!history.error);
        const restored:Record<string,{decision:MaterialDecision;note:string}>={};
        if(!history.error&&Array.isArray(history.data)) for(const entry of history.data) if(!restored[entry.asset_id]) restored[entry.asset_id]={decision:entry.decision,note:entry.note};
        setReviews(current=>({...restored,...current}));
      } catch (err: any) {
        if(!active)return;
        console.error('Erro ao buscar showcase público:', err);
        setError('Não foi possível carregar esta apresentação.');
      } finally {
        if(active){setLoading(false);setLoadedToken(publicToken);}
      }
    }

    void fetchShowcase();return()=>{active=false};
  }, [publicToken]);

  if (loading||loadedToken!==publicToken) {
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

  return <div className="min-h-screen bg-[#101012] p-0 sm:p-4">{reviewLoadError&&<p role="alert" className="p-4 text-sm text-orange-300">Não foi possível carregar as avaliações anteriores. Atualize a página para tentar novamente.</p>}<PresentationPreview publicToken={publicToken} presentation={{...data.presentation, client_name:data.client?.name || data.presentation.client_name, client_logo_url:data.client?.logo_url || data.presentation.client_logo_url}} sections={data.sections} assets={data.assets} reviews={reviews} onReview={onReview} /></div>;
};
