import { EditorialPieceEditor } from "./EditorialPieceEditor";
import { briefingEditorialContext, missingEditorialInputs, suggestEditorialTopics } from "./editorialContext";
import { currentDriveReview,useDriveBriefDocuments,type DriveBriefDocument } from '@/features/briefing/driveDocuments';
import { readClientProfile } from "@/features/clients/clientProfile";
import { useEffect, useRef,useState } from "react";
import { Link, useSearchParams,useLocation,useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAgencyId } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import {
  ENGINE_VERSION,
  editorialQualityWarnings,
  validateEditorialItems,
  forbiddenTerms,
  restructureItem,
} from "./campaignEngine";
import { useCampaignInputs } from "./useCampaignInputs";
import { RepertoireEditor } from "./RepertoireEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  emptyContext,
  formatNames,
  generateMonthlyPlan,
  type EditorialContext,
  type EditorialFormat,
  type MonthlyItem,
} from "./monthlyPlanner";
interface Campaign {
  id: string;
  client_id: string;
  briefing_id: string | null;
  month: string;
  context: EditorialContext;
  items: MonthlyItem[];
  status: string;
  project_id: string | null;
}
interface Feedback {
  id: string;
  campaign_id: string;
  item_index: number;
  decision: string;
  suggested_copy: string;
  note: string;
  created_at: string;
}
const control =
  "w-full rounded-lg border border-white/15 bg-[#17171d] p-3 text-sm text-white";
const statusNames: Record<string, string> = {
  draft: "Rascunho",
  pending: "Aguardando cliente",
  changes_requested: "Ajustes solicitados",
  approved: "Aprovado",
  production: "Em produção",
};
export function MonthlyEditorialPage() {
  const location=useLocation(),navigate=useNavigate(),creating=location.pathname.endsWith('/new');
  const agency = useAgencyId(),
    cache = useQueryClient();
  const [params] = useSearchParams();
  const [client, setClient] = useState(params.get("clientId") || ""),
    [briefing, setBriefing] = useState(""),
    [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [context, setContext] = useState<EditorialContext>(emptyContext),
    [counts, setCounts] = useState({ post: 4, reels: 4, carousel: 2 }),
    [items, setItems] = useState<MonthlyItem[]>([]);
  const [id, setId] = useState<string | null>(null),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [share, setShare] = useState(""),
    [traffic, setTraffic] = useState(false);
  const [pieceSizes, setPieceSizes] = useState<
    Record<number, { size: number; seconds: number }>
  >({});
  const [selectedPiece,setSelectedPiece]=useState<number|null>(null),[formatFilter,setFormatFilter]=useState('all');
  const pieceDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=pieceDialog.current;if(!dialog)return;if(selectedPiece!==null&&!dialog.open)dialog.showModal();else if(selectedPiece===null&&dialog.open)dialog.close();},[selectedPiece]);
  const [topicDraft,setTopicDraft]=useState("");
  const [topicsReviewed,setTopicsReviewed]=useState(false);
  const inputs = useCampaignInputs(agency, client, context.strategyId, id);
  const driveBriefs=useDriveBriefDocuments(client||undefined);
  const identity=useRef('');identity.current=`${agency}:${client}:${id}`;
  async function applyDriveBrief(document:DriveBriefDocument){
    if(document.client_id!==client||document.agency_id!==agency||!currentDriveReview(document)||id)return;
    const key=identity.current;setBusy(true);setNotice('');
    try{const r=await supabase!.functions.invoke('google-workspace',{body:{action:'client-drive-document-read',agencyId:agency,clientId:client,documentId:document.google_file_id}});
      if(r.error||r.data?.error)throw Error('Não foi possível conferir o documento no Drive.');
      if((r.data.document?.version||r.data.version)!==document.reviewed_version){await cache.invalidateQueries({queryKey:['drive-brief-documents',agency]});throw Error('O documento mudou no Drive. Revise novamente na área de Briefings.');}
      if(identity.current!==key)return;
      const reviewed=document.reviewed_context;
      setContext(old=>({...old,objective:reviewed.objective||old.objective,audience:reviewed.audience||old.audience,tone:reviewed.tone||old.tone,positioning:reviewed.positioning||old.positioning,restrictions:reviewed.restrictions||old.restrictions,topics:reviewed.topics?.length?reviewed.topics:old.topics,changeNote:`Contexto revisado do Drive: ${document.name} · documento ${document.id} · versão ${document.reviewed_version}`}));
      setItems([]);setDirty(true);setNotice('Contexto do Drive aplicado ao rascunho. Confira os campos e quantidades antes de gerar.');
    }catch(e){if(identity.current===key)setNotice(e instanceof Error?e.message:'Não foi possível aplicar o documento.');}finally{if(identity.current===key)setBusy(false);}
  }
  const clients = useQuery({
    queryKey: ["editorial-clients", agency],
    enabled: !!agency,
    queryFn: async () => {
      const r = await supabase!
        .from("clients")
        .select("id,name,profile")
        .eq("agency_id", agency)
        .order("name");
      if (r.error) throw r.error;
      return r.data;
    },
  });
  function clientContext(clientId:string){const profile=readClientProfile(clients.data?.find(c=>c.id===clientId)?.profile);return {...emptyContext,objective:profile.monthly_objective||'',audience:profile.target_audience||'',tone:profile.tone||'',positioning:profile.positioning||profile.differential||''};}
  useEffect(()=>{if(client&&!id&&!dirty&&clients.data)setContext(clientContext(client));},[client,id,dirty,clients.data]);
  const historicalBriefs=useQuery({queryKey:['editorial-legacy-briefs',agency,client],enabled:!!client,queryFn:async()=>{const r=await supabase!.from('client_legacy_records').select('id,payload,source_created_at').eq('agency_id',agency).eq('client_id',client).eq('source_kind','briefings').order('source_created_at',{ascending:false});if(r.error)throw r.error;return r.data as {id:string;payload:Record<string,unknown>;source_created_at:string|null}[];}});
  const historicalStrategies=useQuery({queryKey:['editorial-legacy-strategies',agency,client],enabled:!!client,queryFn:async()=>{const r=await supabase!.from('client_legacy_records').select('id,payload,source_created_at').eq('agency_id',agency).eq('client_id',client).eq('source_kind','estrategias_mensais').order('source_created_at',{ascending:false});if(r.error)throw r.error;return r.data as {id:string;payload:Record<string,unknown>}[];}});
  const topicSuggestions=suggestEditorialTopics(readClientProfile(clients.data?.find(c=>c.id===client)?.profile),historicalBriefs.data||[],historicalStrategies.data||[]);
  useEffect(()=>{setTopicDraft('');setTopicsReviewed(false);},[client]);
  useEffect(()=>{if(!client||id||items.length||historicalBriefs.isPending||historicalStrategies.isPending||!topicSuggestions.length)return;setContext(old=>old.topics?.length?old:{...old,topics:topicSuggestions.map(t=>t.text)});},[client,id,items.length,historicalBriefs.data,historicalStrategies.data]);

  function applyHistoricalBrief(record:{id:string;payload:Record<string,unknown>}){const text=(key:string)=>typeof record.payload[key]==='string'?(record.payload[key] as string).slice(0,4000):'';setContext(old=>({...old,objective:text('objetivo_principal')||old.objective,audience:text('persona_descricao')||old.audience,tone:text('tom_de_voz')||old.tone,positioning:text('diferenciais')||old.positioning,restrictions:text('palavras_proibidas')||old.restrictions,changeNote:`Dados revisados do briefing histórico ${record.id}`}));setDirty(true);setNotice('Dados do briefing anterior sugeridos. Confira os campos antes de gerar; o histórico original foi preservado.');}
  const briefs = useQuery({
    queryKey: ["editorial-briefs", agency, client],
    enabled: !!client,
    queryFn: async () => {
      const r = await supabase!
        .from("briefings")
        .select("id,title,description,status")
        .eq("agency_id", agency)
        .eq("client_id", client)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const details = useQuery({
    queryKey: ["editorial-brief-context", agency, client, briefing],
    enabled: !!briefing,
    queryFn: async () => {
      const r = await supabase!.rpc("get_editorial_briefing", {
        p_agency: agency,
        p_client: client,
        p_briefing: briefing,
      });
      if (r.error) throw r.error;
      const result = briefingEditorialContext(r.data?.answers || []);
      return {
        ...result,
        briefingRevision: r.data.revision,
        briefingUpdatedAt: r.data.updatedAt,
      };
    },
  });
  useEffect(()=>{if(client&&!id&&!briefing&&briefs.data?.length)setBriefing(briefs.data[0].id);},[client,id,briefing,briefs.data]);
  const campaigns = useQuery({
    queryKey: ["monthly-editorial", agency],
    enabled: !!agency,
    queryFn: async () => {
      const r = await supabase!
        .from("monthly_editorial_campaigns")
        .select("*")
        .eq("agency_id", agency)
        .order("created_at", { ascending: false })
        .limit(50);
      if (r.error) throw r.error;
      return r.data as Campaign[];
    },
  });
  const linked = useQuery({
    queryKey: ["linked-editorial", agency, params.get("campaignId"), params.get("clientId")],
    enabled: !!agency && !!params.get("campaignId"),
    queryFn: async () => {
      let request = supabase!.from("monthly_editorial_campaigns").select("*").eq("agency_id", agency).eq("id", params.get("campaignId")!);
      if (params.get("clientId")) request = request.eq("client_id", params.get("clientId")!);
      const result = await request.maybeSingle();
      if (result.error) throw result.error;
      return result.data as Campaign | null;
    },
  });
  const feedback = useQuery({
    queryKey: ["editorial-feedback", id],
    enabled: !!id,
    queryFn: async () => {
      const r = await supabase!
        .from("monthly_editorial_feedback")
        .select("*")
        .eq("campaign_id", id)
        .order("created_at", { ascending: false });
      if (r.error) throw r.error;
      return r.data as Feedback[];
    },
  });
  useEffect(() => {
    if (details.data && !id) {
      setContext(old=>({...old,...details.data}));
      setDirty(true);
    }
  }, [details.data, id]);
  const versions = useQuery({
    queryKey: ["editorial-versions", agency, id],
    enabled: !!id,
    queryFn: async () => {
      const r = await supabase!
        .from("editorial_campaign_versions")
        .select("revision,created_at,engine_version,context")
        .eq("agency_id", agency)
        .eq("campaign_id", id!)
        .order("revision", { ascending: false });
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const active = campaigns.data?.find((c) => c.id === id) || (linked.data?.id === id ? linked.data : null),
    locked = !!active?.project_id;
  function newCampaign() {
    setId(null);
    setItems([]);
    setPieceSizes({});
    setShare("");
    setDirty(false);
    setNotice("");
    setContext(emptyContext);
  }
  function load(c: Campaign) {
    setSelectedPiece(null);
    setId(c.id);
    setClient(c.client_id);
    setBriefing(c.briefing_id || "");
    setMonth(c.month.slice(0, 7));
    setContext(c.context);
    setItems(c.items);
    setPieceSizes({});
    setCounts({
      post: c.items.filter((i) => i.format === "post").length,
      reels: c.items.filter((i) => i.format === "reels").length,
      carousel: c.items.filter((i) => i.format === "carousel").length,
    });
    setShare("");
    setDirty(false);
    setNotice("");
  }
  useEffect(() => {
    const requested = params.get("campaignId");
    const target = linked.data || campaigns.data?.find(c => c.id === requested);
    if (target && id !== target.id && !dirty) load(target);
  }, [params, campaigns.data, linked.data]);
  async function save(generatedItems?:MonthlyItem[],generatedContext?:EditorialContext) {
    if (!supabase || !agency) throw Error("Conexão indisponível.");
    const savingItems=generatedItems||items,savingContext=generatedContext||context;
    validateEditorialItems(savingItems, savingContext);
    const r = await supabase.rpc("save_monthly_editorial", {
      p_id: id,
      p_agency: agency,
      p_client: client,
      p_briefing: briefing || null,
      p_month: month + "-01",
      p_context: { ...savingContext, forbiddenTerms: forbiddenTerms(savingContext) },
      p_items: savingItems,
    });
    if (r.error) throw r.error;
    setId(r.data);
    setDirty(false);
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["monthly-editorial", agency] }),
      cache.invalidateQueries({ queryKey: ["editorial-versions", agency] }),
      cache.invalidateQueries({
        queryKey: ["campaign-history", agency, client],
      }),
    ]);
    return r.data as string;
  }
  async function action(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setNotice(
        e && typeof e==='object' && 'message' in e
          ? String(e.message)
          : "Não foi possível concluir. Verifique as permissões e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  const name = clients.data?.find((c) => c.id === client)?.name || "";
  return (
    <div className="space-y-6">
      <PageHeader
        title={creating?'Criar calendário editorial':'Calendários e demandas'}
        subtitle={creating?'Defina cliente, estratégia, formatos e quantidades. A geração salva um rascunho para revisão.':'Conteúdos organizados por campanha. Abra uma demanda para revisar copy, roteiro e direção visual.'}
      />
      {notice && (
        <p role="status" className="rounded-xl border border-orange-400/30 p-4">
          {notice}
        </p>
      )}
      {(clients.isError ||
        briefs.isError ||
        details.isError ||
        campaigns.isError ||
        feedback.isError || historicalBriefs.isError || historicalStrategies.isError) && (
        <p role="alert">
          Não foi possível carregar dados. Nenhum conteúdo de demonstração
          substitui essa falha.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button onClick={()=>{newCampaign();navigate(`/editorial/new${client?'?clientId='+client:''}`);}}>Criar calendário</Button>
        {creating&&<Link className="text-sm text-orange-200 underline" to="/editorial">Voltar aos calendários</Link>}
        {campaigns.isFetching && (
          <span role="status">Atualizando campanhas…</span>
        )}
      </div>
      {creating&&<div className="grid md:grid-cols-2 gap-6">
        <section className="space-y-4 rounded-2xl border border-white/10 p-5">
          <label className="block">
            Cliente
            <select
              aria-label="Cliente"
              className={control}
              value={client}
              disabled={!!id||busy}
              onChange={(e) => {
                setClient(e.target.value);
                setBriefing("");
                setContext(clientContext(e.target.value));
                setItems([]);
                setDirty(true);
              }}
            >
              <option value="">Selecione um cliente</option>
              {clients.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {client&&<section className="space-y-3 rounded-xl border border-orange-500/25 p-4" aria-label="Preparar temas do calendário">
            <h2 className="font-semibold">Preparar temas do mês</h2>
            <p className="text-sm text-zinc-300">O cadastro não define sozinho uma linha editorial. Revise as sugestões de temas antes de usá-las; elas não são fatos ou resultados aprovados.</p>
            {(historicalBriefs.isFetching||historicalStrategies.isFetching)?<p role="status">Consultando fontes históricas…</p>:null}
            {topicSuggestions.length>0&&<><ul className="space-y-2 text-sm">{topicSuggestions.map(s=><li key={s.text}>{s.text}<span className="block text-xs text-zinc-400">{s.source}</span></li>)}</ul><Button disabled={locked||historicalBriefs.isFetching||historicalStrategies.isFetching} onClick={()=>{setTopicDraft(topicSuggestions.map(s=>s.text).join('\n'));setTopicsReviewed(false);}}>Preparar sugestões para revisão</Button></>}
            <label className="block text-sm">Temas sugeridos para revisar<textarea aria-label="Temas sugeridos para revisar" className={control} rows={4} value={topicDraft} disabled={locked} onChange={e=>{setTopicDraft(e.target.value);setTopicsReviewed(false);}}/></label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={topicsReviewed} disabled={locked} onChange={e=>setTopicsReviewed(e.target.checked)}/>Revisei os temas e quero usá-los neste rascunho</label>
            <Button disabled={locked||!topicsReviewed||!topicDraft.trim()} onClick={()=>{setContext(old=>({...old,topics:[...new Set([...(old.topics||[]),...topicDraft.split('\n').map(t=>t.trim()).filter(Boolean)])],changeNote:'Temas sugeridos pelo cadastro/histórico revisados pela equipe'}));setItems([]);setDirty(true);setNotice('Temas revisados aplicados. Confira objetivo, público, restrições e quantidades antes de gerar.');}}>Aplicar temas revisados</Button>
          </section>}
          {client&&<p className="text-xs text-orange-200">O cadastro sugere objetivo, público, tom e posicionamento. Revise estes dados e complete as lacunas antes de gerar.</p>}
          {client&&<section className="space-y-2 rounded-xl border border-orange-500/20 p-4"><h2 className="font-semibold">Contexto dos briefs no Drive</h2><p className="text-sm text-zinc-300">Escolha um documento revisado para orientar esta campanha. A aplicação confere se a versão no Drive continua igual.</p>{driveBriefs.isError?<p role="alert">Não foi possível consultar os briefs espelhados.</p>:driveBriefs.data?.filter(d=>d.client_id===client&&currentDriveReview(d)).map(d=><Button key={d.id} disabled={busy||!!id||locked} onClick={()=>void applyDriveBrief(d)}>Usar contexto de {d.name}</Button>)}<Link className="block text-sm text-orange-200 underline" to={`/clients/${client}`}>Consultar e revisar briefs na ficha do cliente</Link></section>}
          {!!historicalBriefs.data?.length&&<div className="rounded-lg border border-orange-500/20 p-3 space-y-2"><p className="text-sm">Briefings importados da plataforma anterior</p>{historicalBriefs.data.map(record=><button key={record.id} type="button" disabled={!!id||busy} className="block text-sm text-orange-200 underline disabled:opacity-50" onClick={()=>applyHistoricalBrief(record)}>Usar dados do briefing {record.source_created_at?new Date(record.source_created_at).toLocaleDateString('pt-BR'):''}</button>)}<p className="text-xs text-zinc-300">A aplicação substitui apenas os campos presentes no documento. Revise os dados e complete temas, fatos e restrições.</p></div>}
          <label className="block">
            Briefing do cliente
            <select
              aria-label="Briefing do cliente"
              className={control}
              value={briefing}
              disabled={!!id||busy}
              onChange={(e) => {
                setBriefing(e.target.value);
                setDirty(true);
              }}
            >
              <option value="">
                Selecione o briefing ou preencha a estratégia abaixo
              </option>
              {briefs.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Mês da campanha
            <Input
              type="month"
              value={month}
              disabled={!!id||busy}
              onChange={(e) => {
                setMonth(e.target.value);
                setDirty(true);
              }}
            />
          </label>
          <p className="text-sm text-[#B8B8C0]">
            Os campos reconhecidos do briefing são importados. Confira as
            respostas e complete o que faltar; a geração usa regras de
            planejamento, sem inventar fatos do cliente.
          </p>
          {(
            [
              "objective",
              "audience",
              "tone",
              "positioning",
              "restrictions",
            ] as const
          ).map((k, i) => (
            <label className="block" key={k}>
              {
                [
                  "Objetivo",
                  "Público-alvo",
                  "Tom de voz",
                  "Posicionamento / diferencial",
                  "Restrições",
                ][i]
              }
              <textarea
                maxLength={3000}
                className={control}
                value={context[k]}
                disabled={locked}
                onChange={(e) => {
                  setContext({ ...context, [k]: e.target.value });
                  setDirty(true);
                }}
              />
            </label>
          ))}
        </section>
        <section className="space-y-4 rounded-2xl border border-white/10 p-5">
          <h2 className="text-xl">Quantidades do mês</h2>
          <label className="block">
            Estratégia do cliente
            <select
              aria-label="Estratégia do cliente"
              className={control}
              value={context.strategyId || ""}
              disabled={locked}
              onChange={(e) => {
                const selected = inputs.strategies.data?.find(
                  (s) => s.id === e.target.value,
                );
                setContext({
                  ...context,
                  strategyId: e.target.value,
                  objective: context.objective || selected?.objective || "",
                  audience: context.audience || selected?.target_audience || "",
                  tone: context.tone || selected?.tone_of_voice || "",
                  positioning:
                    context.positioning || selected?.brand_positioning || "",
                  restrictions: [
                    context.restrictions,
                    Array.isArray(selected?.restrictions)
                      ? selected.restrictions.join("\n")
                      : selected?.restrictions,
                  ]
                    .filter(Boolean)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .join("\n"),
                });
                setItems([]);
                setDirty(true);
              }}
            >
              <option value="">Temas preenchidos pela social media</option>
              {inputs.strategies.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {context.strategyId && (
            <p className="text-xs">
              Pilares elegíveis:{" "}
              {inputs.pillars.data?.map((p) => p.name).join(", ") ||
                "Nenhum pilar com temas carregado."}
              . O briefing permanece a fonte principal; a estratégia fornece
              pilares e temas.
            </p>
          )}
          {briefing && (
            <p className="text-xs break-all">
              Versão do briefing:{" "}
              {context.briefingRevision || "Carregando versão…"}
            </p>
          )}
          {briefing && (
            <Button
              disabled={locked || details.isFetching}
              onClick={async () => {
                const r = await details.refetch();
                if (r.data) {
                  setContext({ ...context, ...r.data });
                  setDirty(true);
                  setNotice(
                    "Briefing reimportado. Revise as peças existentes ou gere nova prévia.",
                  );
                }
              }}
            >
              Reimportar briefing vigente
            </Button>
          )}
          {(
            [
              "topics",
              "approvedFacts",
              "forbiddenTerms",
              "avoidedTopics",
            ] as const
          ).map((key) => (
            <label className="block" key={key}>
              {
                {
                  topics: "Temas aprovados para este mês",
                  approvedFacts: "Informações factuais aprovadas",
                  forbiddenTerms: "Termos proibidos",
                  avoidedTopics: "Temas a evitar",
                }[key]
              }
              <textarea
                className={control}
                rows={3}
                disabled={locked}
                placeholder="Um item por linha"
                value={(context[key] || []).join("\n")}
                onChange={(e) => {
                  setContext({
                    ...context,
                    [key]: e.target.value.split("\n").filter((v) => v.trim()),
                  });
                  setDirty(true);
                }}
              />
            </label>
          ))}
          <p className="text-xs text-[var(--color-text-secondary)]">
            Informações factuais devem ser confirmadas no briefing ou por fonte
            aprovada. Sem fatos fornecidos, o motor marca os pontos para
            complementação; não inventa conteúdo.
          </p>
          <label className="block">
            Diretrizes visuais aprovadas
            <textarea
              className={control}
              rows={2}
              value={context.visualGuidance || ""}
              disabled={locked}
              onChange={(e) => {
                setContext({ ...context, visualGuidance: e.target.value });
                setDirty(true);
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              Slides por carrossel
              <Input
                type="number"
                min={3}
                max={10}
                value={context.carouselSlides ?? 7}
                disabled={locked}
                onChange={(e) => {
                  setContext({
                    ...context,
                    carouselSlides: Number(e.target.value),
                  });
                  setDirty(true);
                }}
              />
            </label>
            <label>
              Cenas por reel
              <Input
                type="number"
                min={3}
                max={10}
                value={context.reelsScenes ?? 3}
                disabled={locked}
                onChange={(e) => {
                  setContext({
                    ...context,
                    reelsScenes: Number(e.target.value),
                  });
                  setDirty(true);
                }}
              />
            </label>
            <label>
              Duração do reel (segundos)
              <Input
                type="number"
                min={10}
                max={90}
                value={context.reelsSeconds ?? 30}
                disabled={locked}
                onChange={(e) => {
                  setContext({
                    ...context,
                    reelsSeconds: Number(e.target.value),
                  });
                  setDirty(true);
                }}
              />
            </label>
          </div>
          {(inputs.history.isError ||
            inputs.repertoire.isError ||
            inputs.pillars.isError ||
            inputs.strategies.isError) && (
            <p role="alert">
              Não foi possível carregar estratégia, repertório ou histórico.
              Geração bloqueada para não ignorar dados do cliente.
            </p>
          )}
          {inputs.repertoire.data && (
            <RepertoireEditor
              key={agency + ":" + inputs.repertoire.data.version}
              agency={agency}
              version={inputs.repertoire.data.version}
              families={inputs.repertoire.data.families}
            />
          )}
          {(["post", "reels", "carousel"] as EditorialFormat[]).map((f) => (
            <label className="block" key={f}>
              {formatNames[f]}
              <Input
                type="number"
                min="0"
                max="30"
                step="1"
                value={counts[f]}
                disabled={locked}
                onChange={(e) =>
                  setCounts({ ...counts, [f]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <Button
            disabled={
              busy ||
              !client ||
              locked ||
              details.isFetching ||
              inputs.history.isFetching ||
              inputs.history.isError ||
              inputs.repertoire.isFetching ||
              inputs.repertoire.isError ||
              inputs.strategies.isFetching ||
              inputs.strategies.isError ||
              historicalBriefs.isFetching || historicalStrategies.isFetching || historicalBriefs.isError || historicalStrategies.isError ||
              (!!context.strategyId &&
                (inputs.pillars.isFetching || inputs.pillars.isError))
            }
            variant="primary"
            onClick={() => void action(async() => {
                const effectiveContext={...context,topics:context.topics?.length?context.topics:topicSuggestions.map(t=>t.text)};
                const missing=missingEditorialInputs(effectiveContext,inputs.pillars.data||[]);
                if(missing.length)throw Error(`Antes de gerar, complete: ${missing.join("; ")}. Use a área Preparar temas do mês para revisar sugestões.`);
                const engineContext = {
                  ...effectiveContext,
                  engineVersion: ENGINE_VERSION,
                  repertoireVersion: inputs.repertoire.data?.version || 0,
                  requestedCounts: { ...counts },
                };
                const generated=generateMonthlyPlan(month, name, engineContext, counts, {
                    clientId: client,
                    pillars: inputs.pillars.data || [],
                    history: inputs.history.data || [],
                    repertoire: inputs.repertoire.data?.families,
                  });
                setItems(generated);setContext(engineContext);setDirty(true);
                const campaignId=await save(generated,engineContext);
                setItems(generated);
                setContext(engineContext);
                setPieceSizes({});
                setDirty(false);
                setShare("");
                setNotice(
                  "Calendário gerado como rascunho. Revise temas, datas e copies antes da aprovação.",
                );
                setSelectedPiece(null);
                navigate(`/editorial?clientId=${client}&campaignId=${campaignId}`);
            })}
          >
            Gerar calendário mensal
          </Button>
          {items.length>0&&!id&&<p className="text-sm text-orange-200">Prévia gerada com {items.length} demandas. Se a gravação falhou, confira a mensagem e gere novamente para tentar salvar; suas entradas foram mantidas.</p>}
          <p className="text-sm text-[#B8B8C0]">
            As quantidades são ajustáveis para cada campanha; nenhum pacote fixo
            é imposto ao cliente.
          </p>
          {id && (
            <label className="block">
              Motivo desta revisão
              <Input
                value={context.changeNote || ""}
                disabled={locked}
                placeholder="Ex.: ajuste de tom solicitado pelo cliente"
                onChange={(e) => {
                  setContext({ ...context, changeNote: e.target.value });
                  setDirty(true);
                }}
              />
            </label>
          )}
          <h2 className="text-xl">Campanhas salvas</h2>
          {campaigns.data?.length === 0 && <p>Nenhuma campanha cadastrada.</p>}
          {campaigns.data?.map((c) => (
            <button
              type="button"
              className="block w-full rounded-lg border border-white/10 p-3 text-left"
              key={c.id}
              onClick={() => {load(c);navigate(`/editorial?clientId=${c.client_id}&campaignId=${c.id}`);}}
            >
              {clients.data?.find((x) => x.id === c.client_id)?.name ||
                "Cliente"}{" "}
              — {c.month.slice(0, 7)}
              <span className="block text-xs text-orange-300">
                {statusNames[c.status]}
              </span>
            </button>
          ))}
        </section>
      </div>}
      {!creating&&<section className="space-y-3"><h2 className="text-xl font-semibold">Campanhas do cliente</h2>{campaigns.isError?<p role="alert">Não foi possível carregar as campanhas.</p>:campaigns.isPending?<p>Carregando campanhas…</p>:!campaigns.data?.length?<p>Nenhum calendário salvo. Crie uma campanha para organizar as demandas.</p>:<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{campaigns.data.map(c=><button key={c.id} aria-pressed={c.id===id} className={`rounded-xl border p-4 text-left ${c.id===id?'border-orange-500 bg-orange-500/10':'border-white/10'}`} onClick={()=>{load(c);setSelectedPiece(null);navigate(`/editorial?clientId=${c.client_id}&campaignId=${c.id}`);}}><p className="font-semibold">{clients.data?.find(x=>x.id===c.client_id)?.name||'Cliente'} · {c.month.slice(0,7)}</p><p className="text-sm text-orange-200">{statusNames[c.status]||c.status} · {c.items.length} conteúdos</p></button>)}</div>}</section>}
      {!creating&&items.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl">
              {items.length} conteúdos —{" "}
              {dirty
                ? "Rascunho com alterações"
                : active
                  ? statusNames[active.status]
                  : "Rascunho"}
            </h2>
            <Button
              disabled={busy || locked || (!dirty && !!id)}
              onClick={() =>
                void action(async () => {
                  await save();
                  setNotice("Campanha salva.");
                })
              }
            >
              Salvar calendário
            </Button>
            <Button
              disabled={busy || locked}
              onClick={() =>
                void action(async () => {
                  const campaignId = dirty || !id ? await save() : id;
                  const token = Array.from(
                    crypto.getRandomValues(new Uint8Array(32)),
                    (v) => v.toString(16).padStart(2, "0"),
                  ).join("");
                  const r = await supabase!.rpc("share_monthly_editorial", {
                    p_campaign: campaignId,
                    p_token: token,
                  });
                  if (r.error) throw r.error;
                  setShare(
                    window.location.origin + "/approve-calendar/" + token,
                  );
                  await cache.invalidateQueries({
                    queryKey: ["monthly-editorial", agency],
                  });
                  setNotice(
                    "Link de aprovação criado por 30 dias. Links anteriores foram revogados.",
                  );
                })
              }
            >
              Gerar link de aprovação
            </Button>
            {id && (
              <Button
                onClick={() =>
                  void Promise.all([
                    cache.invalidateQueries({
                      queryKey: ["editorial-feedback", id],
                    }),
                    cache.invalidateQueries({
                      queryKey: ["monthly-editorial", agency],
                    }),
                  ])
                }
              >
                Atualizar observações
              </Button>
            )}
          </div>
          {share && (
            <div className="rounded-xl border border-orange-400/30 p-4 space-y-2">
              <label className="block">
                Link do cliente
                <Input readOnly value={share} />
              </label>
              <Button
                onClick={() =>
                  void navigator.clipboard
                    .writeText(share)
                    .then(() => setNotice("Link copiado."))
                    .catch(() => setNotice("Selecione e copie o link acima."))
                }
              >
                Copiar link
              </Button>
              <a
                className="ml-4 text-orange-300"
                href={share}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir revisão
              </a>
            </div>
          )}
          {items.some((i) => i.editorial) && (
            <section className="rounded-xl border border-orange-400/30 p-4">
              <h2 className="font-semibold">
                Prévia estratégica · {ENGINE_VERSION}
              </h2>
              <p className="text-sm">
                {items.length} propostas;{" "}
                {items.filter((i) => i.format === "post").length} posts,{" "}
                {items.filter((i) => i.format === "carousel").length} carrosséis
                e {items.filter((i) => i.format === "reels").length} reels.
                Distribuição:{" "}
                {[...new Set(items.map((i) => i.editorial?.pillar))]
                  .map(
                    (p) =>
                      `${p}: ${items.filter((i) => i.editorial?.pillar === p).length}`,
                  )
                  .join(" · ")}
                .
              </p>
              <p className="text-sm mt-2">
                Nada é aprovado ou publicado automaticamente. Revise lacunas,
                linguagem, direções visuais e similaridade antes de
                salvar/enviar.
              </p>
            </section>
          )}
          <div className="flex flex-wrap gap-2">{['all','post','carousel','reels'].map(format=><Button key={format} onClick={()=>setFormatFilter(format)} aria-pressed={formatFilter===format}>{format==='all'?'Todas as demandas':formatNames[format as MonthlyItem['format']]}</Button>)}</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item,index)=>(formatFilter==='all'||item.format===formatFilter)&&<button key={index} aria-label={`Abrir demanda ${index+1}`} onClick={()=>setSelectedPiece(index)} className="rounded-xl border border-white/10 p-5 text-left transition hover:border-orange-500"><p className="text-xs text-orange-300">{item.date} · {formatNames[item.format]}</p><h3 className="mt-3 font-semibold">{item.title}</h3><p className="mt-2 text-sm text-zinc-400">{item.editorial?.pillar}</p><p className="mt-4 text-sm">Revisar copy e direção visual ↗</p></button>)}</div>
          <dialog aria-labelledby="editorial-piece-heading" ref={pieceDialog} onCancel={e=>{e.preventDefault();setSelectedPiece(null);}} className="fixed m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-2xl border border-white/15 bg-zinc-900 p-5 text-white backdrop:bg-black/80">
          <div className="sticky top-0 z-10 mb-4 flex justify-between gap-3 bg-zinc-900 py-2"><h2 id="editorial-piece-heading" className="text-xl font-semibold">Revisar demanda</h2><Button onClick={()=>setSelectedPiece(null)}>Fechar</Button></div>
          {items.map((item, index) => selectedPiece===index&&(

            <article
              key={index}
              className="space-y-3 rounded-xl border border-white/10 p-5"
            >
              <div className="flex flex-wrap gap-3">
                <span className="text-orange-300">
                  {index + 1}. {formatNames[item.format]}
                </span>
                <Input
                  type="date"
                  value={item.date}
                  disabled={locked}
                  onChange={(e) => {
                    setItems(
                      items.map((v, i) =>
                        i === index ? { ...v, date: e.target.value } : v,
                      ),
                    );
                    setDirty(true);
                  }}
                />
              </div>
              {item.editorial && item.format !== "post" && (
                <div className="rounded-lg border border-white/10 p-3 space-y-2">
                  <p className="text-xs">
                    Estrutura desta peça: ajuste a quantidade e remonte antes de
                    completar os textos. Blocos excedentes serão removidos ao
                    reduzir.
                  </p>
                  <label>
                    {item.format === "carousel"
                      ? "Slides desta peça"
                      : "Cenas desta peça"}
                    <Input
                      aria-label={`Quantidade de ${item.format === "carousel" ? "slides" : "cenas"} do conteúdo ${index + 1}`}
                      type="number"
                      min={3}
                      max={10}
                      disabled={locked}
                      value={
                        pieceSizes[index]?.size ??
                        (item.editorial.slides?.length ||
                          item.editorial.scenes?.length ||
                          3)
                      }
                      onChange={(e) =>
                        setPieceSizes({
                          ...pieceSizes,
                          [index]: {
                            size: Number(e.target.value),
                            seconds:
                              pieceSizes[index]?.seconds ??
                              context.reelsSeconds ??
                              30,
                          },
                        })
                      }
                    />
                  </label>
                  {item.format === "reels" && (
                    <label>
                      Duração desta peça
                      <Input
                        type="number"
                        min={10}
                        max={90}
                        disabled={locked}
                        value={
                          pieceSizes[index]?.seconds ??
                          item.editorial.scenes?.reduce(
                            (n, s) => n + s.seconds,
                            0,
                          ) ??
                          30
                        }
                        onChange={(e) =>
                          setPieceSizes({
                            ...pieceSizes,
                            [index]: {
                              size:
                                pieceSizes[index]?.size ??
                                item.editorial?.scenes?.length ??
                                3,
                              seconds: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  )}
                  <Button
                    disabled={locked}
                    onClick={() => {
                      try {
                        const replacement = restructureItem(
                          item,
                          pieceSizes[index]?.size ??
                            (item.editorial?.slides?.length ||
                              item.editorial?.scenes?.length ||
                              3),
                          pieceSizes[index]?.seconds ??
                            context.reelsSeconds ??
                            30,
                        );
                        setItems(
                          items.map((v, i) => (i === index ? replacement : v)),
                        );
                        setDirty(true);
                        setShare("");
                        setNotice(
                          "Estrutura remontada. Revise blocos e direções antes de salvar.",
                        );
                      } catch (e) {
                        setNotice((e as Error).message);
                      }
                    }}
                  >
                    Remontar estrutura da peça
                  </Button>
                </div>
              )}
              {item.editorial && (
                <details className="text-sm space-y-2">
                  <summary className="cursor-pointer">
                    Ficha estratégica e direção visual
                  </summary>
                  <p>
                    {item.editorial.pillar} · {item.editorial.family} ·{" "}
                    {item.editorial.angle} · {item.editorial.journey}
                  </p>
                  <p>
                    Objetivo: {item.editorial.objective}. Público:{" "}
                    {item.editorial.audience}.
                  </p>
                  {item.editorial.humanEdited && (
                    <p>
                      Texto revisado manualmente. A ficha preserva a proposta de
                      origem; a copy acima é a versão de trabalho.
                    </p>
                  )}
                  <p>{item.editorial.visual}</p>
                  {item.editorial.slides?.map((slide, i) => (
                    <p key={i}>
                      Slide {i + 1}: {slide.visual}
                    </p>
                  ))}
                  {item.editorial.scenes?.map((scene, i) => (
                    <p key={i}>
                      Cena {i + 1} ({scene.seconds}s): {scene.visual}
                    </p>
                  ))}
                  <ul>
                    {item.editorial.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                  <p className="text-xs">
                    Regras: {item.editorial.rules.join(", ")}. Origem:{" "}
                    {item.editorial.sources.join("; ")}.
                  </p>
                </details>
              )}
              <Input
                aria-label={`Tema do conteúdo ${index + 1}`}
                maxLength={200}
                value={item.title}
                disabled={locked}
                onChange={(e) => {
                  setItems(
                    items.map((v, i) =>
                      i === index
                        ? {
                            ...v,
                            title: e.target.value,
                            editorial: v.editorial
                              ? { ...v.editorial, humanEdited: true }
                              : undefined,
                          }
                        : v,
                    ),
                  );
                  setDirty(true);
                }}
              />
              {editorialQualityWarnings(item).length > 0 && (
                <ul
                  className="text-sm text-orange-200"
                  aria-label={`Revisão de qualidade do conteúdo ${index + 1}`}
                >
                  {editorialQualityWarnings(item).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              <EditorialPieceEditor item={item} disabled={locked||busy} onChange={changed=>{setItems(items.map((v,i)=>i===index?changed:v));setDirty(true);setShare('');}}/>
              <Button disabled={locked||busy||!dirty} onClick={()=>void action(async()=>{await save();})}>Salvar alterações</Button>
            </article>
          ))}
          </dialog>
          {versions.data && (
            <details className="rounded-xl border border-white/10 p-4">
              <summary>Histórico de versões ({versions.data.length})</summary>
              {versions.data.map((v) => (
                <p key={v.revision} className="mt-2 text-sm">
                  Versão {v.revision} · {v.created_at} · {v.engine_version} ·{" "}
                  {(v.context as EditorialContext).changeNote ||
                    "Registro de geração/revisão"}
                </p>
              ))}
            </details>
          )}
          {feedback.data && feedback.data.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl">Retorno do cliente</h2>
              {feedback.data.map((f) => (
                <article
                  key={f.id}
                  className="rounded-lg border border-white/10 p-4"
                >
                  <p>
                    {f.decision === "approve"
                      ? "Calendário aprovado"
                      : f.item_index < 0
                        ? "Observação geral"
                        : `Ajuste do conteúdo ${f.item_index + 1}`}
                  </p>
                  {f.note && <p className="whitespace-pre-wrap">{f.note}</p>}
                  {f.suggested_copy && (
                    <>
                      <p className="whitespace-pre-wrap">{f.suggested_copy}</p>
                      <Button
                        disabled={locked || f.item_index < 0}
                        onClick={() => {
                          setItems(
                            items.map((v, i) =>
                              i === f.item_index
                                ? { ...v, copy: f.suggested_copy }
                                : v,
                            ),
                          );
                          setDirty(true);
                          setNotice(
                            "Sugestão aplicada ao rascunho. Salve e gere um novo link para aprovação.",
                          );
                        }}
                      >
                        Aplicar copy sugerida
                      </Button>
                    </>
                  )}
                </article>
              ))}
            </section>
          )}
          <div className="rounded-xl border border-white/10 p-5 space-y-3">
            <h2 className="text-xl">Demandas de produção</h2>
            <p>
              Após a aprovação, crie um projeto com tarefas de Design para
              posts/carrosséis e Videomaker para reels. A operação não duplica
              demandas se repetida.
            </p>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={traffic}
                onChange={(e) => setTraffic(e.target.checked)}
              />
              Incluir tarefa de planejamento de Tráfego Pago
            </label>
            {active?.project_id ? (
              <Link
                className="text-orange-300"
                to={"/projects/" + active.project_id}
              >
                Abrir projeto de produção
              </Link>
            ) : (
              <Button
                disabled={busy || dirty || active?.status !== "approved"}
                variant="primary"
                onClick={() =>
                  void action(async () => {
                    const r = await supabase!.rpc("produce_monthly_editorial", {
                      p_campaign: id,
                      p_include_traffic: traffic,
                    });
                    if (r.error) throw r.error;
                    await cache.invalidateQueries({
                      queryKey: ["monthly-editorial", agency],
                    });
                    setNotice("Projeto e demandas criados com sucesso.");
                  })
                }
              >
                Gerar demandas aprovadas
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
