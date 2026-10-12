import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, ShieldCheck, Image as ImageIcon, Video, AlertCircle, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

interface ShowcaseData {
  presentation: {
    title: string;
    description: string;
    period_month: number;
    period_year: number;
    published_at: string;
    agency_name?: string;
    client_name?: string;
  };
  sections: Array<{
    id: string;
    section_type: string;
    title: string;
    description: string;
    position: number;
    content?: {text?: string; subtitle?: string; list?: string[]};
  }>;
  assets: Array<{
    id: string;
    section_id: string;
    title: string;
    description: string;
    web_view_link?: string;
    thumbnail_reference?: string;
  }>;
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white space-y-4">
        <div className="animate-spin w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400">Carregando apresentação comercial...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-xl font-bold">Link de Apresentação Inválido</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {error || 'Esta apresentação pode ter sido revogada ou expirada.'}
        </p>
      </div>
    );
  }

  const { presentation, sections, assets } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-24">
      {/* Top Banner Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              DOIS.ZERO SHOWCASE
            </span>
          </div>

          <Badge variant="neutral" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Visualização Protegida
          </Badge>
        </div>
      </header>

      {/* Hero Showcase Section */}
      <main className="max-w-4xl mx-auto px-6 pt-12 space-y-16">
        <div className="text-center space-y-6 border-b border-slate-800/80 pb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Mês de Referência: {presentation.period_month} / {presentation.period_year}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {presentation.title}
          </h1>

          {presentation.description && (
            <p className="text-base text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
              {presentation.description}
            </p>
          )}

          <div className="flex justify-center items-center space-x-4 text-xs text-slate-500 pt-2">
            <span>Publicado em: {new Date(presentation.published_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Dynamic Editorial Sections */}
        <div className="space-y-16">
          {sections.map((sec, idx) => {
            const secAssets = assets.filter(a => a.section_id === sec.id);

            return (
              <section key={sec.id} className="space-y-6">
                <div className="space-y-2 border-l-2 border-indigo-500 pl-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    Seção 0{idx + 1} &bull; {sec.section_type}
                  </span>
                  <h2 className="text-2xl font-bold text-white">{sec.title}</h2>
                </div>

                {sec.description && (
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-sm text-slate-300 leading-relaxed font-light">
                    {sec.description}
                  </div>
                )}

                {sec.content?.subtitle && <p className="text-lg text-slate-300">{sec.content.subtitle}</p>}
                {sec.content?.text && <p className="text-sm text-slate-300 whitespace-pre-wrap">{sec.content.text}</p>}
                {Array.isArray(sec.content?.list) && <ul className="list-disc pl-6 text-slate-300">{sec.content.list.map((item, i) => <li key={i}>{item}</li>)}</ul>}
                {/* Section Assets / Media Showcase */}
                {secAssets.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {secAssets.map(asset => (
                      <div
                        key={asset.id}
                        className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 space-y-4"
                      >
                        <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800/60 flex items-center justify-center relative overflow-hidden group-hover:border-indigo-500/30">
                          {asset.thumbnail_reference ? <img src={asset.thumbnail_reference} alt={asset.title} loading="lazy" className="w-full h-full object-contain" /> : <ImageIcon className="w-10 h-10 text-indigo-400/60" />}
                        </div>

                        <div>
                          <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                            {asset.title}
                          </h3>
                          {asset.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{asset.description}</p>
                          )}
                        </div>

                        {asset.web_view_link && (
                          <a
                            href={asset.web_view_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-1"
                          >
                            Abrir no Google Drive <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer info */}
        <footer className="pt-16 border-t border-slate-800/80 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Apresentação comercial gerada via plataforma <span className="text-slate-300 font-semibold">Dois.Zero</span>.
          </p>
        </footer>
      </main>
    </div>
  );
};
