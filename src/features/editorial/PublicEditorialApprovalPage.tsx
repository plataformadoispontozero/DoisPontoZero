import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { OfficialBrandLogo } from "@/components/shared/OfficialBrandLogo";
import { Button } from "@/components/ui/Button";
import { formatNames, type MonthlyItem } from "./monthlyPlanner";
interface Snapshot {
  client: string;
  month: string;
  items: MonthlyItem[];
  status: string;
  expiresAt: string;
}
const control =
  "block w-full rounded-xl border border-white/20 bg-[#17171d] p-3 text-white";
export function PublicEditorialApprovalPage() {
  const { token } = useParams(),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [copies, setCopies] = useState<Record<number, string>>({}),
    [notes, setNotes] = useState<Record<number, string>>({}),
    [general, setGeneral] = useState("");
  const query = useQuery({
    queryKey: ["public-editorial-review", token],
    retry: false,
    queryFn: async () => {
      if (!supabase || !token || !/^[a-f0-9]{64}$/.test(token))
        throw Error("Link indisponível.");
      const r = await supabase.rpc("get_public_editorial", { p_token: token });
      if (r.error || !r.data)
        throw Error(
          "Este link expirou, foi substituído ou não está disponível. Peça um novo link à agência.",
        );
      return r.data as Snapshot;
    },
  });
  async function send(index: number, decision: "approve" | "adjust") {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const r = await supabase!.rpc("submit_public_editorial", {
        p_token: token,
        p_index: index,
        p_decision: decision,
        p_copy: decision === "adjust" ? copies[index] || "" : "",
        p_note:
          decision === "adjust"
            ? index === -1
              ? general
              : notes[index] || ""
            : "",
      });
      if (r.error) throw r.error;
      if (r.data !== true)
        throw Error("Não foi possível confirmar seu retorno.");
      setNotice(
        decision === "approve"
          ? "Calendário aprovado. A agência recebeu sua confirmação."
          : "Sua sugestão foi registrada para a equipe revisar.",
      );
      await query.refetch();
    } catch {
      setNotice(
        "Não foi possível registrar. Confira o link e, em caso de ajustes, escreva sua sugestão ou observação.",
      );
    } finally {
      setBusy(false);
    }
  }
  const c = query.data,
    closed = c?.status === "approved" || c?.status === "production";
  return (
    <main className="min-h-screen bg-[#101014] px-5 py-12 text-white">
      <div className="mx-auto max-w-4xl space-y-7">
        <Link to="/" aria-label="Dois.Zero — início">
          <OfficialBrandLogo
            src="/agency/official-logo.webp"
            name="Dois.Zero"
          />
        </Link>
        <h1 className="text-3xl font-semibold">
          Revisão do calendário editorial
        </h1>
        {query.isLoading && <p role="status">Carregando calendário…</p>}
        {query.error && <p role="alert">{(query.error as Error).message}</p>}
        {notice && (
          <p
            role="status"
            className="rounded-xl border border-orange-400/40 p-4"
          >
            {notice}
          </p>
        )}
        {c && (
          <>
            <p className="text-xl">
              {c.client} — {c.month.slice(0, 7)}
            </p>
            <p className="text-[#B8B8C0]">
              Confira temas, datas e textos. Você pode sugerir uma nova copy ou
              deixar observações sem criar uma conta. As sugestões são revisadas
              pela agência.
            </p>
            {closed && (
              <p className="rounded-xl border border-green-400/30 p-4">
                Revisão concluída. Este calendário já foi aprovado.
              </p>
            )}
            {c.items.map((item, index) => (
              <article
                className="space-y-3 rounded-2xl border border-white/15 p-5"
                key={index}
              >
                <p className="text-orange-300">
                  {item.date} / {formatNames[item.format]}
                </p>
                <h2 className="text-xl">{item.title}</h2>
                <p className="whitespace-pre-wrap text-[#e0e0e4]">
                  {item.copy}
                </p>
                {!closed && (
                  <>
                    <label className="block">
                      Sugestão de copy
                      <textarea
                        className={control}
                        rows={4}
                        maxLength={3000}
                        value={copies[index] ?? ""}
                        placeholder="Escreva aqui se quiser alterar o texto"
                        onChange={(e) =>
                          setCopies({ ...copies, [index]: e.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      Observação para ajuste
                      <textarea
                        className={control}
                        maxLength={3000}
                        value={notes[index] ?? ""}
                        onChange={(e) =>
                          setNotes({ ...notes, [index]: e.target.value })
                        }
                      />
                    </label>
                    <Button
                      disabled={
                        busy || !(copies[index]?.trim() || notes[index]?.trim())
                      }
                      onClick={() => void send(index, "adjust")}
                    >
                      Enviar sugestão deste conteúdo
                    </Button>
                  </>
                )}
              </article>
            ))}
            {!closed && (
              <section className="space-y-4 rounded-2xl border border-orange-400/30 p-5">
                <label className="block">
                  Observação geral
                  <textarea
                    className={control}
                    maxLength={3000}
                    value={general}
                    onChange={(e) => setGeneral(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={busy || !general.trim()}
                    onClick={() => void send(-1, "adjust")}
                  >
                    Solicitar ajustes no calendário
                  </Button>
                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Aprovar todas as datas, formatos e copies deste calendário?",
                        )
                      )
                        void send(-1, "approve");
                    }}
                  >
                    Aprovar calendário completo
                  </Button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
