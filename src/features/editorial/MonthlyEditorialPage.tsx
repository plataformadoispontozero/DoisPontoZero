import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAgencyId } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
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
  const agency = useAgencyId(),
    cache = useQueryClient();
  const [client, setClient] = useState(""),
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
  const clients = useQuery({
    queryKey: ["editorial-clients", agency],
    enabled: !!agency,
    queryFn: async () => {
      const r = await supabase!
        .from("clients")
        .select("id,name")
        .eq("agency_id", agency)
        .order("name");
      if (r.error) throw r.error;
      return r.data;
    },
  });
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
    queryKey: ["editorial-brief-context", agency, briefing],
    enabled: !!briefing,
    queryFn: async () => {
      const r = await supabase!
        .from("briefing_answers")
        .select("answer_value,briefing_questions(question_key,label)")
        .eq("agency_id", agency)
        .eq("briefing_id", briefing);
      if (r.error) throw r.error;
      const result = { ...emptyContext };
      for (const a of r.data || []) {
        const q = Array.isArray(a.briefing_questions)
          ? a.briefing_questions[0]
          : a.briefing_questions;
        const key = (
          (q?.question_key || "") +
          " " +
          (q?.label || "")
        ).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const v =
          typeof a.answer_value === "string"
            ? a.answer_value
            : Array.isArray(a.answer_value)
              ? a.answer_value.join(", ")
              : "";
        if (/objetivo|objective|meta|goals/.test(key)) result.objective = v;
        if (/audience|publico|persona/.test(key)) result.audience = v;
        if (/tom_|tone|linguagem/.test(key)) result.tone = v;
        if (/posicion|position|diferencial/.test(key)) result.positioning = v;
        if (/restri|limit|proibi/.test(key)) result.restrictions = v;
      }
      return result;
    },
  });
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
      setContext(details.data);
      setDirty(true);
    }
  }, [details.data, id]);
  const active = campaigns.data?.find((c) => c.id === id),
    locked = !!active?.project_id;
  function newCampaign() {
    setId(null);
    setItems([]);
    setShare("");
    setDirty(false);
    setNotice("");
    setContext(emptyContext);
  }
  function load(c: Campaign) {
    setId(c.id);
    setClient(c.client_id);
    setBriefing(c.briefing_id || "");
    setMonth(c.month.slice(0, 7));
    setContext(c.context);
    setItems(c.items);
    setCounts({
      post: c.items.filter((i) => i.format === "post").length,
      reels: c.items.filter((i) => i.format === "reels").length,
      carousel: c.items.filter((i) => i.format === "carousel").length,
    });
    setShare("");
    setDirty(false);
    setNotice("");
  }
  async function save() {
    if (!supabase || !agency) throw Error("Conexão indisponível.");
    const r = await supabase.rpc("save_monthly_editorial", {
      p_id: id,
      p_agency: agency,
      p_client: client,
      p_briefing: briefing || null,
      p_month: month + "-01",
      p_context: context,
      p_items: items,
    });
    if (r.error) throw r.error;
    setId(r.data);
    setDirty(false);
    await cache.invalidateQueries({ queryKey: ["monthly-editorial", agency] });
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
        e instanceof Error
          ? e.message
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
        title="Calendário editorial mensal"
        subtitle="Cliente, briefing e quantidades por formato. Revise a estratégia antes de enviar ao cliente."
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
        feedback.isError) && (
        <p role="alert">
          Não foi possível carregar dados. Nenhum conteúdo de demonstração
          substitui essa falha.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button onClick={newCampaign}>Nova campanha</Button>
        {campaigns.isFetching && (
          <span role="status">Atualizando campanhas…</span>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="space-y-4 rounded-2xl border border-white/10 p-5">
          <label className="block">
            Cliente
            <select
              aria-label="Cliente"
              className={control}
              value={client}
              disabled={!!id}
              onChange={(e) => {
                setClient(e.target.value);
                setBriefing("");
                setContext(emptyContext);
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
          <label className="block">
            Briefing do cliente
            <select
              aria-label="Briefing do cliente"
              className={control}
              value={briefing}
              disabled={!!id}
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
              disabled={!!id}
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
            disabled={busy || !client || locked || details.isFetching}
            variant="primary"
            onClick={() => {
              try {
                setItems(generateMonthlyPlan(month, name, context, counts));
                setDirty(true);
                setShare("");
                setNotice(
                  "Calendário gerado como rascunho. Revise temas, datas e copies antes da aprovação.",
                );
              } catch (e) {
                setNotice((e as Error).message);
              }
            }}
          >
            Gerar calendário mensal
          </Button>
          <p className="text-sm text-[#B8B8C0]">
            As quantidades são ajustáveis para cada campanha; nenhum pacote fixo
            é imposto ao cliente.
          </p>
          <h2 className="text-xl">Campanhas salvas</h2>
          {campaigns.data?.length === 0 && <p>Nenhuma campanha cadastrada.</p>}
          {campaigns.data?.map((c) => (
            <button
              type="button"
              className="block w-full rounded-lg border border-white/10 p-3 text-left"
              key={c.id}
              onClick={() => load(c)}
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
      </div>
      {items.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl">
              {items.length} conteúdos —{" "}
              {active ? statusNames[active.status] : "Rascunho"}
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
          {items.map((item, index) => (
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
              <Input
                aria-label={`Tema do conteúdo ${index + 1}`}
                maxLength={200}
                value={item.title}
                disabled={locked}
                onChange={(e) => {
                  setItems(
                    items.map((v, i) =>
                      i === index ? { ...v, title: e.target.value } : v,
                    ),
                  );
                  setDirty(true);
                }}
              />
              <label className="block">
                Copy do conteúdo {index + 1}
                <textarea
                  className={control}
                  maxLength={3000}
                  rows={5}
                  value={item.copy}
                  disabled={locked}
                  onChange={(e) => {
                    setItems(
                      items.map((v, i) =>
                        i === index ? { ...v, copy: e.target.value } : v,
                      ),
                    );
                    setDirty(true);
                  }}
                />
              </label>
            </article>
          ))}
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
