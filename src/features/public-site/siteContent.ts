export interface SiteProject {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  result: string;
  concept: boolean;
  tone: "lime" | "violet" | "coral" | "silver";
  placement: "hero" | "gallery";
}
export interface SiteClient {
  name: string;
  logo: string;
}
export interface SitePerson {
  name: string;
  role: string;
  photo: string;
}
export interface SiteFaq {
  question: string;
  answer: string;
}
export interface SiteContent {
  name: string;
  logo: string;
  eyebrow: string;
  headline: string;
  highlight: string;
  intro: string;
  about: string;
  email: string;
  whatsapp: string;
  instagram: string;
  linkedin: string;
  address: string;
  projects: SiteProject[];
  clients: SiteClient[];
  team: SitePerson[];
  faqs: SiteFaq[];
}
export const SITE_SLUG = import.meta.env.VITE_PUBLIC_SITE_SLUG || "dois-zero";
export const defaultSiteContent: SiteContent = {
  name: "Dois.Zero",
  logo: "/agency/dois.zero-logotipo2.png.webp",
  eyebrow: "ESTRATÉGIA + CRIATIVIDADE + PERFORMANCE",
  headline: "Sua marca merece",
  highlight: "o próximo nível.",
  intro:
    "Conectamos estratégia, design e marketing para construir marcas que as pessoas lembram — e negócios que seguem em frente.",
  about:
    "Somos a Dois.Zero. Uma agência de marketing que conecta pensamento estratégico e execução criativa. Da primeira ideia à presença digital, trabalhamos para dar direção, consistência e personalidade à sua marca.",
  email: "contato@doispontozeroagencia.com",
  whatsapp: "5584999542292",
  instagram: "https://www.instagram.com/dois.zerooficial/",
  linkedin: "",
  address: "Natal, RN · Tirol Office",
  projects: [
    {
      id: "hero-1",
      title: "Fora do comum.",
      category: "BRANDING",
      description: "",
      image: "",
      result: "",
      concept: true,
      tone: "violet",
      placement: "hero",
    },
    {
      id: "hero-2",
      title: "MAKE SOME NOISE",
      category: "DIREÇÃO DE ARTE",
      description: "",
      image: "",
      result: "",
      concept: true,
      tone: "lime",
      placement: "hero",
    },
    {
      id: "hero-3",
      title: "O futuro tem forma.",
      category: "DIGITAL",
      description: "",
      image: "",
      result: "",
      concept: true,
      tone: "coral",
      placement: "hero",
    },
    {
      id: "gallery-1",
      title: "Presença que fica.",
      category: "IDENTIDADE & POSICIONAMENTO",
      description:
        "Uma identidade é mais do que um símbolo. É a forma como a sua marca ocupa o mundo.",
      image: "",
      result: "",
      concept: true,
      tone: "lime",
      placement: "gallery",
    },
    {
      id: "gallery-2",
      title: "Ideias em movimento.",
      category: "CONTEÚDO & CAMPANHAS",
      description:
        "Do conceito à tela: linguagem visual e conteúdo trabalhando juntos para criar conexão.",
      image: "",
      result: "",
      concept: true,
      tone: "violet",
      placement: "gallery",
    },
    {
      id: "gallery-3",
      title: "O próximo clique.",
      category: "EXPERIÊNCIAS DIGITAIS",
      description:
        "Sites que apresentam o seu negócio com clareza, personalidade e um próximo passo simples.",
      image: "",
      result: "",
      concept: true,
      tone: "coral",
      placement: "gallery",
    },
  ],
  clients: [
    { name: "Tirol Office", logo: "/agency/tirol-office.png.webp" },
    { name: "Wound", logo: "/agency/wound.png.webp" },
    { name: "Ótica Diniz", logo: "/agency/OTICA-DINIZ.png.webp" },
    { name: "Sal da Terra", logo: "/agency/sal-da-terra.png.webp" },
    { name: "Mooty", logo: "/agency/mooty.png.webp" },
    { name: "Belatec", logo: "/agency/belatec.png.webp" },
    { name: "Clinicar", logo: "/agency/clinicar.png.webp" },
    { name: "H3", logo: "/agency/H3.png.webp" },
  ],
  team: [],
  faqs: [
    {
      question: "Por onde começamos?",
      answer:
        "Pelo seu negócio. Preencha o briefing rápido com o que você precisa, seu momento e seus objetivos. Nossa equipe entra em contato para entender o cenário e conversar sobre os próximos passos.",
    },
    {
      question: "Quais serviços podemos combinar?",
      answer:
        "Podemos conectar branding, identidade visual, social media, assessoria de marketing, tráfego pago e criação de websites. O escopo é definido de acordo com o seu objetivo.",
    },
    {
      question: "Vocês atendem empresas fora de Natal?",
      answer:
        "O primeiro contato e o briefing podem ser feitos online. Conte onde a sua empresa está e o que precisa; vamos avaliar juntos o formato de atendimento.",
    },
    {
      question: "O briefing já fecha uma contratação?",
      answer:
        "Não. Ele é um primeiro contato para entendermos sua demanda. O escopo, os prazos e o investimento são apresentados em uma proposta antes de qualquer contratação.",
    },
  ],
};
export const siteServices = [
  {
    name: "Branding & identidade",
    detail: "Uma marca com direção, personalidade e consistência.",
    number: "01",
  },
  {
    name: "Social media & conteúdo",
    detail: "Planejamento e criação para conversas que fazem sentido.",
    number: "02",
  },
  {
    name: "Tráfego pago",
    detail: "Campanhas orientadas ao seu público e ao seu objetivo.",
    number: "03",
  },
  {
    name: "Websites & experiências",
    detail: "Seu negócio no digital, do primeiro olhar ao próximo clique.",
    number: "04",
  },
  {
    name: "Assessoria de marketing",
    detail: "Estratégia para conectar sua comunicação e seu negócio.",
    number: "05",
  },
];
export function safeMediaUrl(value: string) {
  if (!value) return "";
  if (/^\/[^/\\]/.test(value) && !value.includes("\\")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
export function safeSocialUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
export function normalizeSiteContent(value: unknown): SiteContent {
  const c =
    value && typeof value === "object" ? (value as Partial<SiteContent>) : {};
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v.slice(0, 3000) : fallback;
  const list = <T>(
    v: unknown,
    map: (v: Record<string, unknown>, i: number) => T,
    max: number,
  ): T[] =>
    Array.isArray(v)
      ? v
          .slice(0, max)
          .filter((v) => v && typeof v === "object")
          .map(map)
      : [];
  return {
    name: str(c.name, "Dois.Zero"),
    logo: safeMediaUrl(str(c.logo)),
    eyebrow: str(c.eyebrow),
    headline: str(c.headline),
    highlight: str(c.highlight),
    intro: str(c.intro),
    about: str(c.about),
    email: str(c.email),
    whatsapp: str(c.whatsapp).replace(/\D/g, ""),
    instagram: safeSocialUrl(str(c.instagram)),
    linkedin: safeSocialUrl(str(c.linkedin)),
    address: str(c.address),
    projects: list(
      c.projects,
      (p, i) => ({
        id: `project-${i}`,
        title: str(p.title),
        category: str(p.category),
        description: str(p.description),
        image: safeMediaUrl(str(p.image)),
        result: str(p.result),
        concept: p.concept !== false,
        tone: ["lime", "violet", "coral", "silver"].includes(String(p.tone))
          ? (p.tone as SiteProject["tone"])
          : "violet",
        placement: p.placement === "hero" ? "hero" : "gallery",
      }),
      12,
    ),
    clients: list(
      c.clients,
      (p) => ({ name: str(p.name), logo: safeMediaUrl(str(p.logo)) }),
      30,
    ),
    team: list(
      c.team,
      (p) => ({
        name: str(p.name),
        role: str(p.role),
        photo: safeMediaUrl(str(p.photo)),
      }),
      20,
    ),
    faqs: list(
      c.faqs,
      (p) => ({ question: str(p.question), answer: str(p.answer) }),
      16,
    ),
  };
}
export const draftKey = (agencyId: string) =>
  `doiszero:public-site:draft:${agencyId}`;
export function readSiteDraft(agencyId: string): SiteContent | null {
  try {
    const raw = localStorage.getItem(draftKey(agencyId));
    return raw ? normalizeSiteContent(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
export function writeSiteDraft(agencyId: string, content: SiteContent) {
  localStorage.setItem(
    draftKey(agencyId),
    JSON.stringify(normalizeSiteContent(content)),
  );
}
