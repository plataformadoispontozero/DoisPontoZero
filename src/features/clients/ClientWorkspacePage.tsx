import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAgencyId, usePermission } from "@/features/auth/AuthProvider";
import { useClient } from "./hooks/useClients";
import { supabase } from "@/lib/supabase/client";
import { DriveBriefingsPanel } from '@/features/briefing/DriveBriefingsPanel';
interface RecordItem {
  id: string;
  name?: string;
  title?: string;
  status: string;
  month?: string;
  due_date?: string;
  project_id?: string | null;
}
const names: Record<string, string> = {
  draft: "Rascunho / revisão interna",
  sent: "Enviado",
  submitted: "Respondido",
  under_review: "Em revisão",
  approved: "Aprovado",
  active: "Ativo",
  pending: "Aguardando cliente",
  changes_requested: "Ajustes solicitados",
  production: "Em produção",
  completed: "Concluído",
  planning: "Planejamento",
  on_hold: "Em pausa",
  archived: "Arquivado",
};
export default function ClientWorkspacePage() {
  const { clientId } = useParams(),
    agency = useAgencyId(),
    client = useClient(clientId);
  const briefsAllowed = usePermission("briefings.view"),
    strategyAllowed = usePermission("strategy.view"),
    projectsAllowed = usePermission("projects.view");
  const presentationsAllowed=usePermission('presentations.view'),productionAllowed=usePermission('tasks.view');
  const briefs = useRecords("briefings", briefsAllowed),
    strategies = useRecords("content_strategies", strategyAllowed),
    campaigns = useRecords("monthly_editorial_campaigns", strategyAllowed),
    projects = useRecords("projects", projectsAllowed);
  function useRecords(table: string, allowed: boolean) {
    return useQuery({
      queryKey: ["client-journey", agency, clientId, table, allowed],
      enabled: !!agency && !!clientId && !!supabase && allowed,
      queryFn: async () => {
        const columns: string =
          table === "monthly_editorial_campaigns"
            ? "id,status,month,project_id"
            : table === "briefings"
              ? "id,title,status"
              : table === "projects"
                ? "id,name,status,due_date"
                : "id,name,status";
        const r = await supabase!
          .from(table)
          .select(columns)
          .eq("agency_id", agency)
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (r.error) throw r.error;
        return r.data as unknown as RecordItem[];
      },
    });
  }
  const errored = [briefs, strategies, campaigns, projects].some(
    (q) => q.isError,
  );
  const steps = [
    {
      title: "Briefing",
      data: briefs,
      allowed: briefsAllowed,
      url: (r: RecordItem) => `/briefings/${r.id}/responses`,
    },
    {
      title: "Estratégia",
      data: strategies,
      allowed: strategyAllowed,
      url: (r: RecordItem) => `/strategy/${r.id}`,
    },
    {
      title: "Calendário e aprovação",
      data: campaigns,
      allowed: strategyAllowed,
      url: (r: RecordItem) =>
        `/editorial?clientId=${clientId}&campaignId=${r.id}`,
    },
    {
      title: "Produção e entrega",
      data: projects,
      allowed: projectsAllowed,
      url: (r: RecordItem) => `/projects/${r.id}`,
    },
  ];
  const latest = campaigns.data?.[0],
    next = !briefs.data?.length
      ? "Preencher o briefing"
      : !strategies.data?.some((s) => s.status === "active")
        ? "Revisar a estratégia"
        : !latest
          ? "Planejar a campanha mensal"
          : latest.status === "pending"
            ? "Aguardar a análise do cliente"
            : latest.status === "changes_requested"
              ? "Revisar os ajustes do cliente"
              : latest.status === "approved"
                ? "Gerar a produção a partir da campanha aprovada"
                : latest.status === "production"
                  ? "Acompanhar as entregas no projeto"
                  : "Revisar a campanha antes de enviar ao cliente";
  return (
    <section className="space-y-6">
      <Link to={`/clients/${clientId}`}>← Voltar ao cliente</Link>
      <h1 className="text-3xl font-bold">
        {client.data?.name || "Workspace do cliente"}
      </h1>
      {client.isError && (
        <p role="alert">Não foi possível carregar este cliente.</p>
      )}
      <p>
        Briefing → estratégia → calendário → aprovação → produção → entrega.
        Cada etapa abre o registro original e mantém o cliente selecionado.
      </p>
      {errored ? (
        <p role="alert">
          Parte da jornada não pôde ser carregada. Confira as permissões e a
          conexão.
        </p>
      ) : steps.some((s) => s.allowed && s.data.isPending) && supabase ? (
        <p>Carregando jornada…</p>
      ) : briefsAllowed && strategyAllowed && projectsAllowed && supabase ? (
        <div className="border border-orange-700 rounded-xl p-4">
          <strong>Próxima ação:</strong> {next}
        </div>
      ) : (
        <p>
          A jornada mostra somente os módulos permitidos. Dados reais dependem
          da conexão com a agência.
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {steps.map((step) => (
          <article
            className="rounded-xl border border-white/15 p-5 space-y-3"
            key={step.title}
          >
            <h2 className="text-xl font-semibold">{step.title}</h2>
            {!step.allowed ? (
              <p>Você não tem acesso a esta etapa.</p>
            ) : step.data.isError ? (
              <p>Dados indisponíveis.</p>
            ) : step.data.isPending && supabase ? (
              <p>Carregando…</p>
            ) : !step.data.data?.length ? (
              <p>Nenhum registro encontrado.</p>
            ) : (
              step.data.data.map((r) => (
                <Link
                  key={r.id}
                  to={step.url(r)}
                  className="block border-b border-white/10 py-3"
                >
                  <strong>
                    {r.name || r.title || `Campanha ${r.month?.slice(0, 7)}`}
                  </strong>
                  <p>
                    {names[r.status] || r.status}
                    {r.due_date ? ` · Prazo ${r.due_date}` : ""}
                  </p>
                  {r.project_id && (
                    <p>
                      Produção vinculada ao projeto. Abra a campanha para
                      acompanhar o vínculo.
                    </p>
                  )}
                </Link>
              ))
            )}
          </article>
        ))}
      </div>
      {briefsAllowed&&clientId&&<DriveBriefingsPanel clientId={clientId}/>}
      <div className="flex flex-wrap gap-3" aria-label="Atalhos da jornada do cliente">
        {strategyAllowed&&<Link className="rounded-lg border border-orange-500/30 p-3" to={`/strategy/new?clientId=${clientId}`}>Criar estratégia deste cliente</Link>}
        {presentationsAllowed&&<Link className="rounded-lg border border-orange-500/30 p-3" to={`/presentations/new?clientId=${clientId}`}>Criar apresentação deste cliente</Link>}
        {productionAllowed&&['design','video','traffic'].map(department=><Link key={department} className="rounded-lg border border-orange-500/30 p-3" to={`/production/${department}?clientId=${clientId}`}>{department==='design'?'Design':department==='video'?'Vídeo e Motion':'Tráfego pago'}</Link>)}
      </div>
      <p>
        A aprovação da campanha autoriza a geração de produção. Sugestões de
        copy e observações ficam no calendário original. “Rascunho / revisão
        interna” indica o estado atual; não há aprovação interna separada nesta
        versão.
      </p>
      {strategyAllowed && (
        <Link
          className="inline-block rounded-lg bg-[#c84408] p-3"
          to={`/editorial/new?clientId=${clientId}`}
        >
          Planejar calendário deste cliente
        </Link>
      )}
    </section>
  );
}
