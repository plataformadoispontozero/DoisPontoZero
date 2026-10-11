import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Plus,
  Save,
  Trash2,
  Upload,
  Globe,
  Inbox,
} from "lucide-react";
import { useAuth, useAgencyId } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import {
  defaultSiteContent,
  normalizeSiteContent,
  readSiteDraft,
  writeSiteDraft,
  SITE_SLUG,
  safeMediaUrl,
  safeSocialUrl,
  type SiteContent,
  type SiteProject,
} from "./siteContent";
const control =
  "w-full rounded-lg bg-[#101014] border border-[#393844] p-3 text-sm text-[#F8F9FC] focus:outline-[#B8FF65]";
const button =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#484550] px-4 py-2.5 text-sm hover:border-[#B8FF65] disabled:opacity-40";
function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block text-xs text-[#B9B6C7] space-y-2">
      <span>{label}</span>
      {multiline ? (
        <textarea
          className={control}
          maxLength={3000}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={control}
          maxLength={3000}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function Media({
  label,
  value,
  onChange,
  busy,
  upload,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
  upload: (
    e: ChangeEvent<HTMLInputElement>,
    callback: (v: string) => void,
  ) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      <Field label={label} value={value} onChange={onChange} />
      <div className="flex items-center gap-3">
        {safeMediaUrl(value) && (
          <img
            src={safeMediaUrl(value)}
            alt="Prévia da imagem"
            className="h-16 w-24 object-contain rounded bg-[#25232d]"
          />
        )}
        <label className={`${button} cursor-pointer`}>
          <Upload size={15} /> Enviar imagem
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={(e) => void upload(e, onChange)}
          />
        </label>
      </div>
    </div>
  );
}
export function PublicSiteSettingsPage() {
  const auth = useAuth(),
    agencyId = useAgencyId(),
    client = useQueryClient();
  const canManage = auth.isDemo || auth.activeAgency?.roleName === "OWNER";
  const [content, setContent] = useState<SiteContent>(
    () => readSiteDraft(agencyId) || structuredClone(defaultSiteContent),
  );
  const [tab, setTab] = useState("hero"),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [published, setPublished] = useState(false);
  const dirty = useRef(false),
    hydrated = useRef("");
  const publicationDirty = useRef(false);
  const site = useQuery({
    queryKey: ["site-admin", agencyId],
    enabled: Boolean(agencyId && canManage && supabase),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from("agency_public_sites")
        .select("content,published,slug")
        .eq("agency_id", agencyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const leads = useQuery({
    queryKey: ["site-leads", agencyId],
    enabled: Boolean(
      agencyId && canManage && supabase && tab === "briefings" && !site.isError,
    ),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from("agency_site_leads")
        .select(
          "id,name,email,phone,company,services,objective,budget,created_at",
        )
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (hydrated.current !== agencyId) {
      hydrated.current = agencyId;
      dirty.current = false;
      publicationDirty.current = false;
      setPublished(false);
      setContent(
        readSiteDraft(agencyId) || structuredClone(defaultSiteContent),
      );
      setNotice("");
    }
    if (site.data) {
      if (!publicationDirty.current) setPublished(site.data.published);
      if (!dirty.current && !readSiteDraft(agencyId))
        setContent(normalizeSiteContent(site.data.content));
    }
  }, [agencyId, site.data]);
  function change(next: SiteContent) {
    dirty.current = true;
    setContent(next);
    setNotice("");
  }
  function patch(field: keyof SiteContent, value: string) {
    change({ ...content, [field]: value });
  }
  function saveDraft() {
    try {
      writeSiteDraft(agencyId, content);
      setNotice(
        "Rascunho salvo neste navegador. A publicação do site não foi alterada.",
      );
    } catch {
      setNotice("Não foi possível salvar o rascunho neste navegador.");
    }
  }
  async function publish() {
    if (busy || !supabase || !canManage || site.isError) return;
    if (!content.headline.trim() || !content.name.trim()) {
      setNotice("Preencha o nome da agência e o título da hero.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const { data, error } = await supabase
        .from("agency_public_sites")
        .upsert(
          {
            agency_id: agencyId,
            slug: SITE_SLUG,
            content: normalizeSiteContent(content),
            published,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "agency_id" },
        )
        .select("agency_id")
        .single();
      if (error || !data) throw new Error();
      await client.invalidateQueries({ queryKey: ["public-site"] });
      await client.invalidateQueries({ queryKey: ["site-admin", agencyId] });
      setNotice(
        published
          ? "Conteúdo publicado no site público."
          : "Conteúdo salvo no Supabase. O site continua despublicado.",
      );
    } catch {
      setNotice(
        "Não foi possível salvar no Supabase. Confira a preparação do banco e as permissões. Seu rascunho pode ser salvo localmente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(
    e: ChangeEvent<HTMLInputElement>,
    onUrl: (url: string) => void,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setNotice("Use PNG, JPG ou WebP de até 2 MB.");
      return;
    }
    if (!supabase || site.isError) {
      setNotice(
        "O upload depende da ativação do bucket do site no Supabase. Por enquanto, use uma URL HTTPS de imagem.",
      );
      return;
    }
    setBusy(true);
    try {
      const path = `${agencyId}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
      const { error } = await supabase.storage
        .from("agency-site-media")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage
        .from("agency-site-media")
        .getPublicUrl(path);
      onUrl(data.publicUrl);
      setNotice(
        "Imagem enviada. Salve ou publique o conteúdo para utilizá-la no site.",
      );
    } catch {
      setNotice(
        "Não foi possível enviar a imagem. Confira o bucket e as permissões.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!canManage)
    return (
      <div role="alert">
        A edição e os briefings do site público estão disponíveis para o
        proprietário da agência.
      </div>
    );
  const tabs = [
    ["hero", "Hero & identidade"],
    ["portfolio", "Portfólio 3D"],
    ["clients", "Logos de clientes"],
    ["team", "Equipe"],
    ["faq", "FAQ"],
    ["contact", "Contatos"],
    ["briefings", "Briefings recebidos"],
  ];
  return (
    <div className="space-y-6 text-[#F8F9FC]">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Site público da agência</h1>
          <p className="text-sm text-[#A5A1B4] mt-2">
            Edite a página inicial sem alterar a área de trabalho da equipe.
          </p>
        </div>
        <Link className={button} to={`/?draft=${agencyId}`} target="_blank">
          <ExternalLink size={16} /> Ver rascunho
        </Link>
      </div>
      {site.isError && (
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"
          role="status"
        >
          A estrutura do site ainda precisa ser ativada no Supabase. Você pode
          preparar e visualizar o rascunho neste navegador; ele não será
          publicado automaticamente.
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={`${button} whitespace-nowrap ${tab === id ? "bg-[#7952FF] border-[#7952FF]" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-[#35313f] bg-[#1b1922] p-5 sm:p-7 space-y-6">
        {tab === "hero" && (
          <>
            <Field
              label="Nome da agência"
              value={content.name}
              onChange={(v) => patch("name", v)}
            />
            <Media
              busy={busy}
              upload={upload}
              label="Logo centralizada (URL ou upload)"
              value={content.logo}
              onChange={(v) => patch("logo", v)}
            />
            <Field
              label="Texto acima do título"
              value={content.eyebrow}
              onChange={(v) => patch("eyebrow", v)}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Título"
                value={content.headline}
                onChange={(v) => patch("headline", v)}
              />
              <Field
                label="Destaque do título"
                value={content.highlight}
                onChange={(v) => patch("highlight", v)}
              />
            </div>
            <Field
              label="Texto da hero"
              value={content.intro}
              multiline
              onChange={(v) => patch("intro", v)}
            />
            <Field
              label="Texto sobre a agência"
              value={content.about}
              multiline
              onChange={(v) => patch("about", v)}
            />
            <p className="text-xs text-[#aaa6bb]">
              As imagens da hero e da câmera ficam na aba Portfólio 3D, com
              destino separado para evitar repetição.
            </p>
          </>
        )}
        {tab === "portfolio" && (
          <>
            <p className="text-sm text-[#aaa6bb]">
              Escolha Hero para os posters do fundo ou Galeria para a sequência
              de câmera. Na hero, imagens horizontais WebP passam em loop na largura da tela. Use a mesma proporção entre artes (por exemplo 1920 × 1080). Marque estudos conceituais; publique resultados apenas
              quando comprovados.
            </p>
            {content.projects.map((p, i) => {
              const set = (next: SiteProject) =>
                change({
                  ...content,
                  projects: content.projects.map((v, j) =>
                    j === i ? next : v,
                  ),
                });
              return (
                <div
                  key={i}
                  className="p-5 border border-[#443d50] rounded-xl space-y-4"
                >
                  <div className="flex justify-between gap-3">
                    <h2 className="font-medium">Peça {i + 1}</h2>
                    <button
                      type="button"
                      aria-label={`Remover peça ${i + 1}`}
                      onClick={() =>
                        change({
                          ...content,
                          projects: content.projects.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      label="Título"
                      value={p.title}
                      onChange={(v) => set({ ...p, title: v })}
                    />
                    <Field
                      label="Categoria / serviço"
                      value={p.category}
                      onChange={(v) => set({ ...p, category: v })}
                    />
                    <label className="text-xs space-y-2">
                      Destino
                      <select
                        className={control}
                        value={p.placement}
                        onChange={(e) =>
                          set({
                            ...p,
                            placement: e.target
                              .value as SiteProject["placement"],
                          })
                        }
                      >
                        <option value="hero">Hero — fundo</option>
                        <option value="gallery">Galeria — câmera 3D</option>
                      </select>
                    </label>
                    <label className="text-xs space-y-2">
                      Cor do poster sem imagem
                      <select
                        className={control}
                        value={p.tone}
                        onChange={(e) =>
                          set({
                            ...p,
                            tone: e.target.value as SiteProject["tone"],
                          })
                        }
                      >
                        {["lime", "violet", "coral", "silver"].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <Media
                    busy={busy}
                    upload={upload}
                    label="Imagem do projeto"
                    value={p.image}
                    onChange={(v) => set({ ...p, image: v })}
                  />
                  <Field
                    label="Texto de apresentação"
                    multiline
                    value={p.description}
                    onChange={(v) => set({ ...p, description: v })}
                  />
                  <Field label="Cliente (opcional)" value={p.client || ""} onChange={(v) => set({ ...p, client: v })} />
                  <h4>Materiais da página de portfólio</h4>
                  {(p.materials || []).map((material, materialIndex) => (
                    <div key={materialIndex} className="space-y-3 rounded-xl border border-white/10 p-4">
                      <Media busy={busy} upload={upload} label={`Material ${materialIndex + 1}`} value={material.image}
                        onChange={(image) => set({ ...p, materials: (p.materials || []).map((m, j) => j === materialIndex ? { ...m, image } : m) })} />
                      <Field label="Legenda do material" value={material.caption}
                        onChange={(caption) => set({ ...p, materials: (p.materials || []).map((m, j) => j === materialIndex ? { ...m, caption } : m) })} />
                      <button type="button" onClick={() => set({ ...p, materials: (p.materials || []).filter((_, j) => j !== materialIndex) })}>Remover material</button>
                    </div>
                  ))}
                  {(p.materials || []).length < 20 && <button type="button" onClick={() => set({ ...p, materials: [...(p.materials || []), { image: "", caption: "" }] })}>Adicionar material</button>}
                  <Field
                    label="Resultado verificado (opcional)"
                    value={p.result}
                    onChange={(v) => set({ ...p, result: v })}
                  />
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={p.concept}
                      onChange={(e) => set({ ...p, concept: e.target.checked })}
                    />{" "}
                    Estudo autoral / peça conceitual
                  </label>
                </div>
              );
            })}
            <button
              disabled={content.projects.length >= 12}
              className={button}
              onClick={() =>
                change({
                  ...content,
                  projects: [
                    ...content.projects,
                    {
                      id: crypto.randomUUID(),
                      title: "Novo projeto",
                      category: "",
                      image: "",
                      description: "",
                      result: "",
                      tone: "violet",
                      concept: true,
                      placement: "gallery",
                    },
                  ],
                })
              }
            >
              <Plus size={16} /> Adicionar projeto
            </button>
          </>
        )}
        {tab === "clients" && (
          <>
            <p className="text-sm text-[#aaa6bb]">
              Logos apresentados no site atual da agência. Revise as
              autorizações antes de publicar.
            </p>
            {content.clients.map((p, i) => (
              <div
                className="p-4 border border-[#443d50] rounded-lg space-y-3"
                key={i}
              >
                <Field
                  label="Nome do cliente"
                  value={p.name}
                  onChange={(v) =>
                    change({
                      ...content,
                      clients: content.clients.map((c, j) =>
                        j === i ? { ...c, name: v } : c,
                      ),
                    })
                  }
                />
                <Media
                  busy={busy}
                  upload={upload}
                  label="Logo"
                  value={p.logo}
                  onChange={(v) =>
                    change({
                      ...content,
                      clients: content.clients.map((c, j) =>
                        j === i ? { ...c, logo: v } : c,
                      ),
                    })
                  }
                />
                <button
                  className={button}
                  onClick={() =>
                    change({
                      ...content,
                      clients: content.clients.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 size={15} /> Remover
                </button>
              </div>
            ))}
            <button
              className={button}
              disabled={content.clients.length >= 30}
              onClick={() =>
                change({
                  ...content,
                  clients: [...content.clients, { name: "", logo: "" }],
                })
              }
            >
              <Plus size={16} /> Adicionar cliente
            </button>
          </>
        )}
        {tab === "team" && (
          <>
            <p className="text-sm text-[#aaa6bb]">
              Apenas perfis que você adicionar aqui aparecem no site. Esta
              vitrine não expõe a lista de usuários ou permissões do workspace.
            </p>
            {content.team.map((p, i) => (
              <div
                className="p-4 border border-[#443d50] rounded-lg space-y-3"
                key={i}
              >
                <Field
                  label="Nome público"
                  value={p.name}
                  onChange={(v) =>
                    change({
                      ...content,
                      team: content.team.map((c, j) =>
                        j === i ? { ...c, name: v } : c,
                      ),
                    })
                  }
                />
                <Field
                  label="Especialidade / cargo"
                  value={p.role}
                  onChange={(v) =>
                    change({
                      ...content,
                      team: content.team.map((c, j) =>
                        j === i ? { ...c, role: v } : c,
                      ),
                    })
                  }
                />
                <Media
                  busy={busy}
                  upload={upload}
                  label="Foto autorizada"
                  value={p.photo}
                  onChange={(v) =>
                    change({
                      ...content,
                      team: content.team.map((c, j) =>
                        j === i ? { ...c, photo: v } : c,
                      ),
                    })
                  }
                />
                <button
                  className={button}
                  onClick={() =>
                    change({
                      ...content,
                      team: content.team.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 size={15} /> Remover
                </button>
              </div>
            ))}
            <button
              className={button}
              disabled={content.team.length >= 20}
              onClick={() =>
                change({
                  ...content,
                  team: [...content.team, { name: "", role: "", photo: "" }],
                })
              }
            >
              <Plus size={16} /> Adicionar pessoa
            </button>
          </>
        )}
        {tab === "faq" && (
          <>
            {content.faqs.map((p, i) => (
              <div
                className="p-4 border border-[#443d50] rounded-lg space-y-3"
                key={i}
              >
                <Field
                  label="Pergunta"
                  value={p.question}
                  onChange={(v) =>
                    change({
                      ...content,
                      faqs: content.faqs.map((c, j) =>
                        j === i ? { ...c, question: v } : c,
                      ),
                    })
                  }
                />
                <Field
                  label="Resposta"
                  multiline
                  value={p.answer}
                  onChange={(v) =>
                    change({
                      ...content,
                      faqs: content.faqs.map((c, j) =>
                        j === i ? { ...c, answer: v } : c,
                      ),
                    })
                  }
                />
                <button
                  className={button}
                  onClick={() =>
                    change({
                      ...content,
                      faqs: content.faqs.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 size={15} /> Remover
                </button>
              </div>
            ))}
            <button
              className={button}
              disabled={content.faqs.length >= 16}
              onClick={() =>
                change({
                  ...content,
                  faqs: [...content.faqs, { question: "", answer: "" }],
                })
              }
            >
              <Plus size={16} /> Adicionar pergunta
            </button>
          </>
        )}
        {tab === "contact" && (
          <>
            <Field
              label="E-mail público"
              value={content.email}
              onChange={(v) => patch("email", v)}
            />
            <Field
              label="WhatsApp — país, DDD e número"
              value={content.whatsapp}
              onChange={(v) => patch("whatsapp", v)}
            />
            <Field
              label="Instagram (HTTPS)"
              value={content.instagram}
              onChange={(v) => patch("instagram", safeSocialUrl(v) || v)}
            />
            <Field
              label="LinkedIn (HTTPS)"
              value={content.linkedin}
              onChange={(v) => patch("linkedin", v)}
            />
            <Field
              label="Local / endereço público"
              value={content.address}
              onChange={(v) => patch("address", v)}
            />
          </>
        )}
        {tab === "briefings" && (
          <>
            <h2 className="flex items-center gap-2 text-xl">
              <Inbox size={20} /> Briefings comerciais recebidos
            </h2>
            {leads.isLoading ? (
              <p role="status">Carregando briefings…</p>
            ) : leads.isError || site.isError ? (
              <p role="alert">
                O recebimento de briefings na plataforma aguarda ativação do
                banco e da função pública protegida.
              </p>
            ) : leads.data?.length ? (
              leads.data.map((lead) => (
                <details
                  key={lead.id}
                  className="border border-[#443d50] rounded-lg p-4"
                >
                  <summary className="cursor-pointer">
                    {lead.name} · {lead.company || "Nova demanda"} ·{" "}
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </summary>
                  <div className="mt-4 text-sm space-y-3">
                    <p>
                      {lead.email} · {lead.phone}
                    </p>
                    <p>{lead.services.join(" · ")}</p>
                    <p className="whitespace-pre-wrap">{lead.objective}</p>
                    <p>{lead.budget || "Investimento a definir"}</p>
                  </div>
                </details>
              ))
            ) : (
              <p className="text-[#aaa6bb]">Nenhum briefing recebido ainda.</p>
            )}
            <button className={button} onClick={() => void leads.refetch()}>
              Atualizar lista
            </button>
          </>
        )}
      </div>
      {notice && (
        <p
          role="status"
          className="border border-[#7e65b0] bg-[#7952FF]/10 rounded-lg p-4 text-sm"
        >
          {notice}
        </p>
      )}
      <div className="flex flex-wrap gap-3 items-center border-t border-[#39323f] pt-5">
        <button className={button} onClick={saveDraft}>
          <Save size={16} /> Salvar rascunho local
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => {
              publicationDirty.current = true;
              setPublished(e.target.checked);
            }}
          />{" "}
          Site publicado
        </label>
        <button
          className={`${button} bg-[#7952FF]`}
          disabled={busy || !supabase || site.isError || site.isLoading}
          onClick={() => void publish()}
        >
          <Globe size={16} />
          {busy ? "Salvando…" : "Salvar no Supabase"}
        </button>
        <Link className={button} to="/" target="_blank">
          Ver site público <ExternalLink size={15} />
        </Link>
      </div>
    </div>
  );
}
