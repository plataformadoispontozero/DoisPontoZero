import { legacyCalendarHistory } from "./editorialContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  DEFAULT_REPERTOIRE,
  type RepertoireFamily,
  type PillarInput,
  type HistoryEntry,
} from "./campaignEngine";
import type { MonthlyItem } from "./monthlyPlanner";
export function useCampaignInputs(
  agency: string,
  client: string,
  strategyId?: string,
  campaignId?: string | null,
) {
  const strategies = useQuery({
    queryKey: ["campaign-strategies", agency, client],
    enabled: !!agency && !!client,
    queryFn: async () => {
      const r = await supabase!
        .from("content_strategies")
        .select(
          "id,name,objective,target_audience,tone_of_voice,brand_positioning,restrictions,updated_at",
        )
        .eq("agency_id", agency)
        .eq("client_id", client)
        .is("archived_at", null)
        .order("name");
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const pillars = useQuery({
    queryKey: ["campaign-pillars", agency, client, strategyId],
    enabled: !!strategyId && !!client && strategies.isSuccess,
    queryFn: async () => {
      if (!strategies.data?.some((s) => s.id === strategyId))
        throw Error("Selecione uma estratégia deste cliente.");
      const r = await supabase!
        .from("editorial_pillars")
        .select("id,name,percentage,example_topics,content_formats")
        .eq("agency_id", agency)
        .eq("strategy_id", strategyId!);
      if (r.error) throw r.error;
      return r.data.map((p) => ({
        ...p,
        percentage: p.percentage || 0,
        example_topics: p.example_topics || [],
        content_formats: p.content_formats || [],
      })) as PillarInput[];
    },
  });
  const history = useQuery({
    queryKey: ["campaign-history", agency, client, campaignId],
    enabled: !!agency && !!client,
    queryFn: async () => {
      const all: HistoryEntry[] = [];
      for (let page = 0; page < 100; page++) {
        const r = await supabase!
          .from("editorial_idea_registry")
          .select(
            "campaign_id,first_item,monthly_editorial_campaigns(month,status)",
          )
          .eq("agency_id", agency)
          .eq("client_id", client)
          .order("id")
          .range(page * 500, page * 500 + 499);
        if (r.error) throw r.error;
        for (const row of r.data || []) {
          const c = Array.isArray(row.monthly_editorial_campaigns)
            ? row.monthly_editorial_campaigns[0]
            : row.monthly_editorial_campaigns;
          all.push({
            clientId: client,
            campaignId: row.campaign_id,
            month: c?.month,
            state: c?.status,
            item: row.first_item as unknown as MonthlyItem,
          });
        }
        if ((r.data || []).length < 500) break;
        if (page === 99)
          throw Error(
            "Histórico excede o limite de consulta; geração bloqueada para evitar leitura incompleta.",
          );
      }
      // Imported calendar status is historical; all original structured topics remain in reuse checks.
      for(let page=0;page<100;page++){
        const result=await supabase!.from('client_legacy_records').select('id,payload').eq('agency_id',agency).eq('client_id',client).eq('source_kind','calendarios').order('id').range(page*100,page*100+99);
        if(result.error)throw result.error;
        all.push(...legacyCalendarHistory(client,result.data||[]));
        if((result.data||[]).length<100)break;
        if(page===99)throw Error('Histórico importado excede o limite de consulta; geração bloqueada para evitar repetição.');
      }
      // Include discarded/archived ideas through all client strategies, not just the selected strategy.
      const sr = await supabase!
        .from("content_strategies")
        .select("id")
        .eq("agency_id", agency)
        .eq("client_id", client);
      if (sr.error) throw sr.error;
      if (sr.data?.length) {
        for (let page = 0; page < 100; page++) {
          const r = await supabase!
            .from("content_ideas")
            .select("id,title,description,content_format,status")
            .eq("agency_id", agency)
            .in(
              "strategy_id",
              sr.data.map((s) => s.id),
            )
            .order("id")
            .range(page * 500, page * 500 + 499);
          if (r.error) throw r.error;
          all.push(
            ...(r.data || []).map((i) => ({
              clientId: client,
              campaignId: i.id,
              state: i.status,
              item: {
                date: "",
                format: "post" as const,
                title: i.title,
                copy: i.description || "",
              },
            })),
          );
          if ((r.data || []).length < 500) break;
          if (page === 99)
            throw Error(
              "Banco de ideias excede o limite; histórico incompleto.",
            );
        }
      }
      return all;
    },
  });
  const repertoire = useQuery({
    queryKey: ["campaign-repertoire", agency],
    enabled: !!agency,
    queryFn: async () => {
      const r = await supabase!
        .from("editorial_repertoire_versions")
        .select("version,families")
        .eq("agency_id", agency)
        .order("version", { ascending: false })
        .limit(1);
      if (r.error) throw r.error;
      return r.data?.[0]
        ? {
            version: r.data[0].version,
            families: (r.data[0].families as unknown as RepertoireFamily[]).map(
              (f) => ({
                ...f,
                requiresFact: ["differential", "process"].includes(f.id),
              }),
            ),
          }
        : { version: 0, families: DEFAULT_REPERTOIRE };
    },
  });
  return { strategies, pillars, history, repertoire };
}
