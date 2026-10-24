import { SiteImageGallery } from "./SiteImageGallery";
import { prepareSiteImage } from "./prepareSiteImage";
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
  draftKey,
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
      <div className="flex flex-wrap items-center gap-3">
        {safeMediaUrl(value) && (
          <img
            src={safeMediaUrl(value)}
            alt="Prévia da imagem"
            className="max-h-56 w-full max-w-sm object-contain rounded-lg bg-[#25232d]"
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
function MotionSettings({ content, patch, kind }: { content: SiteContent; patch: <K extends keyof SiteContent>(field: K, value: SiteContent[K]) => void; kind: "hero" | "logos" }) {
  const hero = kind === "hero";
  const duration = hero ? content.heroDuration ?? 60 : content.logoDuration ?? 38;
  return <fieldset className="space-y-4 rounded-xl border border-white/15 p-4">
    <legend className="px-2 font-medium">{hero ? "Animação das imagens da hero" : "Movimento das logos"}</legend>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm">Efeito<select className={control} value={hero ? content.heroMotion ?? "slide" : content.logoMotion ?? "slide"} onChange={(e) => hero ? patch("heroMotion", e.target.value as SiteContent["heroMotion"]) : patch("logoMotion", e.target.value as SiteContent["logoMotion"])}>
        <option value="slide">Deslizar em loop</option>{!hero && <option value="reverse">Deslizar no sentido inverso</option>}<option value="static">Sem movimento</option>
      </select></label>
      <label className="space-y-2 text-sm">Duração de uma volta: {duration}s<input className="w-full accent-orange-500" type="range" min={hero ? 15 : 10} max={hero ? 180 : 120} step="1" value={duration} onChange={(e) => hero ? patch("heroDuration", Number(e.target.value)) : patch("logoDuration", Number(e.target.value))} /></label>
      {hero && <label className="space-y-2 text-sm">Enquadramento<select className={control} value={content.heroImageFit ?? "contain"} onChange={(e) => patch("heroImageFit", e.target.value as SiteContent["heroImageFit"])}><option value="contain">Imagem inteira · artes lado a lado, sem espaço</option><option value="cover">Preencher área (pode cortar bordas)</option></select></label>}
    </div>
    <p className="text-xs text-[#B8B8C0]">Menos segundos deixam o movimento mais rápido. A preferência de movimento reduzido do visitante é respeitada.</p>
  </fieldset>;
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
  const contentRef=useRef(content); contentRef.current=content;
  const agencyRef=useRef(agencyId); agencyRef.current=agencyId;
  const [uploadProgress,setUploadProgress]=useState("");
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
    contentRef.current=next;
    setContent(next);
    setNotice("");
  }
  function patch<K extends keyof SiteContent>(field: K, value: SiteContent[K]) {
    change({ ...contentRef.current, [field]: value });
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
      const normalized=normalizeSiteContent(contentRef.current);
      if(new TextEncoder().encode(JSON.stringify(normalized)).length>98000)throw Error("O texto e os links ultrapassam o limite de conteúdo do site. Reduza descrições ou materiais antes de salvar.");
      const savedAgency=agencyId;
      const { data, error } = await supabase
        .from("agency_public_sites")
        .upsert(
          {
            agency_id: agencyId,
            slug: SITE_SLUG,
            content: normalized,
            published,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "agency_id" },
        )
        .select("agency_id,content,published,slug")
        .single();
      if (error || !data) throw new Error(error?.message || "O banco não confirmou a gravação.");
      if(agencyRef.current!==savedAgency)return;
      const confirmed=normalizeSiteContent(data.content);
      contentRef.current=confirmed;setContent(confirmed);setPublished(data.published);dirty.current=false;publicationDirty.current=false;
      try{localStorage.removeItem(draftKey(savedAgency))}catch{/* Remote save is confirmed; this browser may block local draft cleanup. */}
      client.setQueryData(["site-admin",savedAgency],{content:confirmed,published:data.published,slug:data.slug});
      await client.invalidateQueries({ queryKey: ["public-site"] });
      await client.invalidateQueries({ queryKey: ["site-admin", agencyId] });
      setNotice(
        published
          ? "Conteúdo publicado no site público."
          : "Conteúdo salvo no Supabase. O site continua despublicado.",
      );
    } catch(error) {
      setNotice(error instanceof Error?`Não foi possível salvar: ${error.message} Seu conteúdo continua nesta tela.`:"Não foi possível salvar. Seu conteúdo continua nesta tela.");
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
    if (!supabase || site.isError) {
      setNotice(
        "O upload depende da ativação do bucket do site no Supabase. Por enquanto, use uma URL HTTPS de imagem.",
      );
      return;
    }
    const uploadAgency=agencyId;
    setBusy(true);
    try {
      setUploadProgress("Preparando imagem…");
      const image=await prepareSiteImage(file);
      if(agencyRef.current!==uploadAgency)return;
      const path = `${uploadAgency}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from("agency-site-media")
        .upload(path, image, { upsert: false, contentType: "image/webp" });
      if (error) throw error;
      const { data } = supabase.storage
        .from("agency-site-media")
        .getPublicUrl(path);
      if(agencyRef.current!==uploadAgency)return;
      onUrl(data.publicUrl);
      setNotice(
        "Imagem enviada. Salve ou publique o conteúdo para utilizá-la no site.",
      );
    } catch(error) {
      setNotice(error instanceof Error?error.message:"Não foi possível enviar a imagem. Confira as permissões.");
    } finally {
      setBusy(false);setUploadProgress("");
    }
  }

  async function uploadGallery(event:ChangeEvent<HTMLInputElement>,placement:SiteProject["placement"]){
    const files=Array.from(event.target.files||[]);event.target.value="";
    if(!files.length||busy||!supabase||site.isError)return;
    const available=60-contentRef.current.projects.length;
    if(files.length>available){setNotice(`A galeria comporta até 60 imagens/projetos no total. Você pode adicionar mais ${Math.max(0,available)}.`);return;}
    const uploadAgency=agencyId;setBusy(true);setNotice("");
    const additions:SiteProject[]=[];const failures:string[]=[];
    try{
      for(let index=0;index<files.length;index++){
        if(agencyRef.current!==uploadAgency)break;
        const file=files[index];setUploadProgress(`Preparando e enviando imagem ${index+1} de ${files.length}…`);
        try{
          const image=await prepareSiteImage(file);
          if(agencyRef.current!==uploadAgency)break;
          const path=`${uploadAgency}/${crypto.randomUUID()}.webp`;
          const result=await supabase.storage.from("agency-site-media").upload(path,image,{upsert:false,contentType:"image/webp"});
          if(result.error)throw Error(result.error.message);
          const {data}=supabase.storage.from("agency-site-media").getPublicUrl(path);
          additions.push({id:crypto.randomUUID(),title:placement==="hero"?file.name.replace(/\.[^.]+$/,""):"",image:data.publicUrl,description:"",client:"",category:"",result:"",concept:true,tone:"violet",placement});
        }catch(error){failures.push(`${file.name}: ${error instanceof Error?error.message:"falha no upload"}`)}
      }
      if(agencyRef.current!==uploadAgency)return;
      if(additions.length)change({...contentRef.current,projects:[...contentRef.current.projects,...additions]});
      setNotice(`${additions.length} imagens adicionadas. Salve as alterações para utilizá-las no site.${failures.length?` ${failures.length} não foram enviadas. ${failures.slice(0,3).join(" · ")}`:""}`);
    }finally{setBusy(false);setUploadProgress("")}
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
    ["portfolio", "Imagens & portfólio"],
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
        <Link className={button} to={`/?draft=${agencyId}`} target="_blank" onClick={(e) => { try { writeSiteDraft(agencyId, content); } catch { e.preventDefault(); setNotice("Não foi possível preparar a prévia local."); } }}>
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
            className={`${button} whitespace-nowrap ${tab === id ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <fieldset disabled={busy} className="rounded-xl border border-[#35313f] bg-[#1b1922] p-5 sm:p-7 space-y-6">
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
            <div className="space-y-3 rounded-xl border border-white/10 p-4">
              <label htmlFor="hero-opacity" className="block text-sm">Opacidade das artes de fundo: {content.heroOpacity ?? 50}%</label>
              <input id="hero-opacity" className="w-full accent-[#FF5A1F]" type="range" min="0" max="100" step="1" value={content.heroOpacity ?? 50}
                onChange={(e) => patch("heroOpacity", Number(e.target.value))} />
              <p className="text-xs text-[#B8B8C0]">As artes da hero ficam em preto e branco. 0% oculta as artes; 100% usa a opacidade máxima. A logo, os textos e os botões não são afetados.</p>
            </div>
            <MotionSettings content={content} patch={patch} kind="hero" />
            <SiteImageGallery projects={content.projects} placement="hero" busy={busy} onChange={projects=>patch("projects",projects)} onUpload={uploadGallery}/>

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
              As imagens de fundo ficam na galeria da hero acima. Os projetos públicos ficam na aba Imagens & portfólio.
            </p>
          </>
        )}
        {tab === "portfolio" && <SiteImageGallery projects={content.projects} placement="gallery" busy={busy} onChange={projects=>patch("projects",projects)} onUpload={uploadGallery}/>}
        {tab === "clients" && (
          <>
            <p className="text-sm text-[#aaa6bb]">
              Logos apresentados no site atual da agência. Revise as
              autorizações antes de publicar.
            </p>
            <MotionSettings content={content} patch={patch} kind="logos" />
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
      </fieldset>
      {uploadProgress&&<p role="status" className="text-sm text-orange-200">{uploadProgress}</p>}
      {notice && (
        <p
          role="status"
          className="border border-[#7e65b0] bg-[#7952FF]/10 rounded-lg p-4 text-sm"
        >
          {notice}
        </p>
      )}
      <div className="flex flex-wrap gap-3 items-center border-t border-[#39323f] pt-5">
        <button className={button} disabled={busy} onClick={saveDraft}>
          <Save size={16} /> Salvar rascunho local
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            disabled={busy}
            onChange={(e) => {
              publicationDirty.current = true;
              setPublished(e.target.checked);
            }}
          />{" "}
          Site publicado
        </label>
        <button
          className={`${button} bg-[var(--color-primary)] text-white`}
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
