import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
interface Monitor { generatedAt: string | null; sentAt: string | null; firstViewAt: string | null; lastSeenAt: string | null; online: boolean; expiresAt: string | null; revoked: boolean; total: number; approved: number; adjust: number; reviewed: number; trackingLabel: string; archivedAt: string | null }
function date(value: string | null) { return value ? new Date(value).toLocaleString('pt-BR') : 'Ainda não registrado'; }
export function EditorialReviewMonitor({ campaignId, archived, compact = false }: { campaignId: string; archived?: boolean; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const query = useQuery({ queryKey: ['editorial-review-monitor', campaignId], refetchInterval: 30000, refetchIntervalInBackground: false, queryFn: async () => {
    const result = await supabase!.rpc('get_editorial_review_monitor', { p_campaign: campaignId });
    if (result.error) throw result.error;
    return result.data as Monitor;
  } });
  if (query.isPending) return <p className="text-xs text-zinc-400">Atualizando revisão…</p>;
  if (query.isError || !query.data) return <p className="text-xs text-amber-200">Monitoramento indisponível no momento.</p>;
  const monitor = query.data;
  return <section aria-label="Acompanhamento da aprovação" className={compact ? 'mt-3 space-y-2 text-sm' : 'space-y-4 rounded-xl border border-white/15 p-5'}>
    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-orange-400/30 px-3 py-1 text-xs text-orange-200">{monitor.trackingLabel}</span>{monitor.online && !archived && <span className="text-xs text-emerald-300">Página de revisão ativa recentemente</span>}{monitor.revoked && <span className="text-xs text-zinc-400">Link revogado</span>}</div>
    <p className="text-sm text-zinc-300">{monitor.approved} aprovados · {monitor.adjust} para ajuste · {monitor.reviewed}/{monitor.total} avaliados</p>
    {!compact && <><dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">{[['Link gerado', monitor.generatedAt], ['Marcado como enviado', monitor.sentAt], ['Primeira visita', monitor.firstViewAt], ['Última atividade', monitor.lastSeenAt]].map(([label, value]) => <div key={label}><dt className="text-xs text-zinc-400">{label}</dt><dd className="mt-1">{date(value)}</dd></div>)}</dl>
      <p className="text-xs text-zinc-400">A presença é estimada pela atividade de uma página visível nos últimos 75 segundos. Não identifica quem abriu o link. Gerar ou copiar o link não confirma o envio.</p>
      {monitor.generatedAt && !monitor.revoked && !archived && <Button disabled={busy || !!monitor.sentAt} onClick={async () => {
        if (!window.confirm('Confirmar que você já enviou este link ao cliente? Esta ação apenas registra o envio feito por você.')) return;
        setBusy(true); setError('');
        try { const result = await supabase!.rpc('mark_editorial_review_sent', { p_campaign: campaignId }); if (result.error || result.data !== true) throw Error(); await query.refetch(); }
        catch { setError('Não foi possível registrar o envio. Tente novamente.'); }
        finally { setBusy(false); }
      }}>{monitor.sentAt ? 'Envio registrado' : 'Marcar como enviado'}</Button>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </>}
  </section>;
}
