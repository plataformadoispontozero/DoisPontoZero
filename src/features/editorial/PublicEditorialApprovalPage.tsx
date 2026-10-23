import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { OfficialBrandLogo } from '@/components/shared/OfficialBrandLogo';
import { Button } from '@/components/ui/Button';
import { formatNames, type MonthlyItem } from './monthlyPlanner';
import { EditorialContentPreview } from './EditorialContentPreview';
import { useEditorialReviewPresence } from './useEditorialReviewPresence';
interface ItemReview { itemIndex: number; decision: 'approve' | 'adjust'; note?: string; copy?: string }
interface Snapshot { client: string; month: string; items: MonthlyItem[]; status: string; expiresAt: string; itemReviews?: ItemReview[] }
export function PublicEditorialApprovalPage() {
  const { token } = useParams();
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ['public-editorial-review', token], retry: false,
    queryFn: async () => {
      if (!supabase || !token || !/^[a-f0-9]{64}$/.test(token)) throw Error('Link indisponível.');
      const response = await supabase.rpc('get_public_editorial', { p_token: token });
      if (response.error || !response.data) throw Error('Este link expirou, foi substituído ou não está disponível. Peça um novo link à agência.');
      return response.data as Snapshot;
    },
  });
  async function send(index: number, decision: 'approve' | 'adjust') {
    if (busy !== null || (decision === 'adjust' && !notes[index]?.trim())) return;
    setBusy(index); setNotice(''); setError('');
    try {
      const response = await supabase!.rpc('submit_public_editorial', { p_token: token, p_index: index, p_decision: decision, p_copy: '', p_note: decision === 'adjust' ? notes[index].trim() : '' });
      if (response.error || response.data !== true) throw Error('Retorno não confirmado.');
      await query.refetch();
      setNotice(decision === 'approve' ? 'Material aprovado. A equipe recebeu sua confirmação.' : 'Ajuste solicitado. A equipe recebeu sua observação.');
      setAdjusting(null);
    } catch { setError('Não foi possível registrar seu retorno. Tente novamente; sua observação continua aqui.'); }
    finally { setBusy(null); }
  }
  useEditorialReviewPresence(token, !!query.data && !query.isError);
  const campaign = query.data;
  const closed = campaign?.status === 'approved' || campaign?.status === 'production';
  const reviews = new Map(campaign?.itemReviews?.map(review => [review.itemIndex, review]));
  const approvedCount = campaign?.items.filter((_, index) => reviews.get(index)?.decision === 'approve').length || 0;
  return <main className="min-h-screen bg-[#101014] px-4 py-8 text-white sm:px-6 sm:py-12">
    <div className="mx-auto max-w-6xl space-y-7">
      <Link to="/" aria-label="2.0 — início" className="inline-block"><OfficialBrandLogo src="/agency/official-logo.webp" name="2.0" /></Link>
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-orange-300">Aprovação editorial</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Vamos revisar o conteúdo?</h1>
        {campaign && <p className="text-lg text-[#e0e0e6]">{campaign.client} · {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${campaign.month.slice(0, 7)}-01T12:00:00Z`))}</p>}
        <p className="max-w-2xl text-sm leading-relaxed text-[#B8B8C0]">Confira cada material e escolha Aprovar ou Solicitar ajuste. As prévias mostram os textos planejados; as artes e os vídeos serão produzidos depois.</p>
      </header>
      {query.isLoading && <p role="status">Carregando calendário…</p>}
      {query.error && <p role="alert" className="rounded-xl border border-red-400/30 p-4">{(query.error as Error).message}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 text-emerald-200">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-red-200">{error}</p>}
      {campaign && <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 px-5 py-4 text-sm">
          <span>{campaign.items.length} materiais para revisão</span>
          <span className="text-[#B8B8C0]">{closed ? 'Revisão concluída' : `${approvedCount} de ${campaign.items.length} aprovados`}</span>
        </div>
        {closed && <p className="rounded-xl border border-emerald-400/30 p-4 text-emerald-200">Este calendário já foi aprovado. A agência recebeu a confirmação.</p>}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {campaign.items.map((item, index) => {
            const review = reviews.get(index);
            const approved = closed || review?.decision === 'approve';
            const needsAdjustment = !approved && review?.decision === 'adjust';
            const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date.split('-').reverse().join('/') : item.date;
            return <article key={`${index}-${item.date}`} aria-labelledby={`material-${index}`} className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-[#141419]">
              <div className="space-y-3 px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium uppercase tracking-wider text-orange-300">{date} · {formatNames[item.format]}</span>
                  <span className={`rounded-full border px-3 py-1 ${approved ? 'border-emerald-400/30 text-emerald-300' : needsAdjustment ? 'border-amber-400/30 text-amber-200' : 'border-white/15 text-[#B8B8C0]'}`}>{approved ? 'Aprovado' : needsAdjustment ? 'Ajuste solicitado' : 'Aguardando revisão'}</span>
                </div>
                <h2 id={`material-${index}`} className="text-lg font-semibold leading-snug">{item.title}</h2>
              </div>
              <EditorialContentPreview item={item} client={campaign.client} />
              <div className="space-y-4 border-t border-white/10 px-5 py-5 sm:px-6">
                {needsAdjustment && review.note && <p className="whitespace-pre-wrap break-words rounded-xl bg-amber-300/5 p-3 text-sm text-amber-100"><span className="mb-1 block font-semibold">Sua solicitação</span>{review.note}</p>}
                {!closed && <>
                  <div className="grid grid-cols-2 gap-3">
                    <Button size="lg" className="border border-emerald-400/30 bg-emerald-600 text-white hover:bg-emerald-700" disabled={busy !== null || approved} loading={busy === index && adjusting !== index} onClick={() => void send(index, 'approve')}><Check size={17} />{approved ? 'Aprovado' : 'Aprovar'}</Button>
                    <Button size="lg" className="px-3 text-sm" disabled={busy !== null} aria-expanded={adjusting === index} aria-controls={`adjust-${index}`} onClick={() => setAdjusting(adjusting === index ? null : index)}><MessageSquare size={16} />Solicitar ajuste</Button>
                  </div>
                  {adjusting === index && <form id={`adjust-${index}`} className="space-y-3" onSubmit={event => { event.preventDefault(); void send(index, 'adjust'); }}>
                    <label htmlFor={`note-${index}`} className="block text-sm font-medium">O que você gostaria de ajustar?</label>
                    <textarea id={`note-${index}`} autoFocus rows={4} maxLength={3000} value={notes[index] ?? ''} onChange={event => setNotes(previous => ({ ...previous, [index]: event.target.value }))} placeholder="Indique a lâmina, cena ou trecho e descreva a mudança desejada." className="block w-full rounded-xl border border-white/20 bg-[#101014] p-3 text-sm text-white placeholder:text-[#91919f] focus:border-orange-400 focus:outline-none" />
                    <div className="flex flex-wrap gap-2"><Button type="submit" variant="primary" size="lg" loading={busy === index} disabled={busy !== null || !notes[index]?.trim()}>Enviar ajuste</Button><Button type="button" variant="ghost" size="lg" disabled={busy !== null} onClick={() => setAdjusting(null)}>Cancelar</Button></div>
                  </form>}
                </>}
              </div>
            </article>;
          })}
        </div>
      </>}
    </div>
  </main>;
}
