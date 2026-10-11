import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUpRight,
  Menu,
  X,
  Pause,
  Play,
  Camera,
  Mail,
} from "lucide-react";
import { usePublicSite } from "./usePublicSite";
import { Poster } from "./Poster";
import { useSceneMotion } from "./useSceneMotion";
import { siteServices } from "./siteContent";
import "./public-site.css";
export function PublicSitePage() {
  const { content: c, draft, configured, available, pending } = usePublicSite();
  const [year] = useState(() => new Date().getFullYear());
  const [menu, setMenu] = useState(false);
  const [paused, setPaused] = useState(false);
  const [motion, setMotion] = useState(true);
  const hero = c.projects.filter((p) => p.placement === "hero").slice(0, 3);
  const gallery = c.projects.filter((p) => p.placement === "gallery");
  const scene = useSceneMotion(motion && available && !pending && gallery.length > 1, gallery.length);
  useEffect(() => {
    const previous = document.title;
    document.title = `${c.name} — Estratégia, design e marketing`;
    return () => {
      document.title = previous;
    };
  }, [c.name]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const whatsapp = c.whatsapp ? `https://wa.me/${c.whatsapp}` : "";
  if (!available)
    return (
      <main className="dz-site dz-brief">
        <div className="dz-brief-main">
          <p className="dz-eyebrow">DOIS.ZERO</p>
          <h1>{pending ? "Carregando…" : "Nosso site está em preparação."}</h1>
          <p>Enquanto isso, a plataforma da agência continua disponível.</p>
          <Link className="dz-button" to="/login">
            Acessar plataforma <ArrowUpRight size={18} />
          </Link>
        </div>
      </main>
    );
  return (
    <div
      className={`dz-site ${paused ? "dz-paused" : ""} ${!motion ? "dz-static" : ""}`}
    >
      <a className="dz-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      {draft && (
        <div className="dz-draft-banner" role="status">
          Prévia do rascunho · visível neste navegador.{" "}
          <Link to="/settings/public-site">Voltar ao editor</Link>
        </div>
      )}
      <header className="dz-nav">
        <Link className="dz-wordmark" to="/" aria-label={`${c.name} — início`}>
          dois<span>.</span>zero<span className="dz-wordmark-symbol">↗</span>
        </Link>
        <button
          className="dz-menu-button"
          type="button"
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menu}
          aria-controls="dz-navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav
          id="dz-navigation"
          className={menu ? "dz-menu-open" : ""}
          aria-label="Menu principal"
        >
          {["Projetos", "Serviços", "Sobre", "Contato"].map((label, i) => (
            <a
              key={label}
              href={`#${["projetos", "servicos", "sobre", "contato"][i]}`}
              onClick={() => setMenu(false)}
            >
              {label}
            </a>
          ))}
          <Link to="/login" className="dz-client-login">
            Área da agência <ArrowUpRight size={14} />
          </Link>
        </nav>
        <Link className="dz-nav-cta" to="/brief">
          Vamos conversar <ArrowUpRight size={16} />
        </Link>
      </header>
      <main id="conteudo">
        <section className="dz-hero" aria-labelledby="hero-title">
          <div className="dz-hero-grid" aria-hidden="true" />
          <div className="dz-hero-art" aria-hidden="true">
            {hero.map((p, i) => (
              <div key={p.id} className={`dz-hero-poster dz-hero-poster-${i}`}>
                <Poster project={p} decorative />
              </div>
            ))}
          </div>
          <div className="dz-hero-copy">
            {c.logo && (
              <img
                className="dz-hero-logo"
                src={c.logo}
                alt={c.name}
                width="220"
                height="65"
              />
            )}
            <p className="dz-eyebrow">
              <span className="dz-status-dot" />
              {c.eyebrow}
            </p>
            <h1 id="hero-title">
              {c.headline}
              <br />
              <span>{c.highlight}</span>
            </h1>
            <p className="dz-hero-intro">{c.intro}</p>
            <div className="dz-actions">
              <Link className="dz-button" to="/brief">
                Começar meu projeto <ArrowUpRight size={20} />
              </Link>
              <a className="dz-text-link" href="#projetos">
                Explore nosso universo <ArrowDown size={16} />
              </a>
            </div>
          </div>
          <div className="dz-hero-footer">
            <span>
              {c.address || "ESTÚDIO CRIATIVO"}
              <span className="dz-small-dot">•</span>Ideias sem fronteiras
            </span>
            <button
              type="button"
              onClick={() => setMotion(!motion)}
              aria-pressed={!motion}
            >
              {motion ? <Pause size={13} /> : <Play size={13} />}{" "}
              {motion ? "Reduzir movimento" : "Ativar movimento"}
            </button>
            <a href="#projetos">
              SCROLL PARA EXPLORAR <ArrowDown size={14} />
            </a>
          </div>
        </section>
        <section className="dz-intro dz-container" id="projetos">
          <p className="dz-eyebrow">01 / UNIVERSO CRIATIVO</p>
          <div className="dz-section-heading">
            <h2>
              Boas ideias não
              <br />
              ficam <em>paradas.</em>
            </h2>
            <p>
              Estratégia encontra design.
              <br />
              Design encontra pessoas.
              <br />É aí que a marca acontece.
            </p>
          </div>
          {gallery.some((p) => p.concept) && (
            <p className="dz-concept-note">
              Estudos autorais de direção criativa. Cases e resultados reais
              serão apresentados nas peças identificadas.
            </p>
          )}
        </section>
        {gallery.length > 0 && (
          <section
            ref={scene}
            className={`dz-gallery ${!motion ? "dz-gallery-static" : ""} ${gallery.length === 1 ? "dz-gallery-single" : ""}`}
            aria-label="Projetos em destaque"
          >
            <div className="dz-gallery-stage">
              <div className="dz-stage-line" aria-hidden="true" />
              <div className="dz-scene-camera">
                {gallery.map((p, i) => (
                  <article
                    key={p.id}
                    className="dz-scene-panel"
                    data-scene-panel
                    onFocus={() => {
                      if (
                        motion &&
                        window.innerWidth >= 768 &&
                        !window.matchMedia("(prefers-reduced-motion: reduce)")
                          .matches &&
                        scene.current &&
                        gallery.length > 1
                      )
                        window.scrollTo({
                          top:
                            scene.current.offsetTop +
                            (i / (gallery.length - 1)) *
                              (scene.current.offsetHeight - window.innerHeight),
                          behavior: "instant",
                        });
                    }}
                    style={
                      motion
                        ? {
                            transform: `translate3d(${i * 115}%, ${i * 5}%, ${-i * 180}px) rotateY(${-i * 18}deg)`,
                          }
                        : undefined
                    }
                  >
                    <div className="dz-scene-art">
                      <Poster project={p} />
                      <span className="dz-project-index">
                        0{i + 1} / 0{gallery.length}
                      </span>
                    </div>
                    <div className="dz-scene-copy">
                      <p className="dz-eyebrow">{p.category}</p>
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                      {p.result && <p className="dz-result">{p.result}</p>}
                      <span className="dz-project-kind">
                        {p.concept ? "ESTUDO AUTORAL" : "PROJETO DA AGÊNCIA"}
                      </span>
                      <Link className="dz-text-link" to="/brief">
                        Quero criar algo assim <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
              <div className="dz-scene-progress" aria-hidden="true">
                <i />
              </div>
            </div>
          </section>
        )}
        {c.clients.length > 0 && (
          <section className="dz-clients" aria-labelledby="clients-title">
            <div className="dz-container dz-clients-heading">
              <p id="clients-title" className="dz-eyebrow">
                MARCAS QUE JÁ CRUZARAM NOSSO CAMINHO
              </p>
              <button
                type="button"
                onClick={() => setPaused(!paused)}
                aria-pressed={paused}
                aria-label={paused ? "Retomar logos" : "Pausar logos"}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </div>
            <div className="dz-marquee">
              <div className="dz-marquee-track">
                {[0, 1].map((copy) => (
                  <div
                    className="dz-marquee-group"
                    key={copy}
                    aria-hidden={copy === 1 || undefined}
                  >
                    {c.clients.map((client, i) => (
                      <div
                        className="dz-client-logo"
                        key={`${client.name}-${i}`}
                      >
                        {client.logo ? (
                          <img
                            src={client.logo}
                            alt={copy ? "" : client.name}
                            loading="lazy"
                            width="150"
                            height="70"
                          />
                        ) : (
                          <span>{client.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        <section id="servicos" className="dz-services dz-container">
          <p className="dz-eyebrow">02 / O QUE CONECTAMOS</p>
          <div className="dz-section-heading">
            <h2>
              Do pensamento
              <br />
              ao <em>impacto.</em>
            </h2>
            <p>
              Uma marca. Várias possibilidades.
              <br />O plano começa no que você precisa.
            </p>
          </div>
          <div className="dz-service-list">
            {siteServices.map((s) => (
              <Link
                key={s.number}
                to={`/brief?service=${encodeURIComponent(s.name)}`}
              >
                <span>{s.number}</span>
                <h3>{s.name}</h3>
                <p>{s.detail}</p>
                <ArrowUpRight size={27} />
              </Link>
            ))}
          </div>
        </section>
        <section id="sobre" className="dz-about">
          <div className="dz-container dz-about-grid">
            <div>
              <p className="dz-eyebrow">03 / PESSOAS POR TRÁS DAS IDEIAS</p>
              <h2>
                Dois pontos.
                <br />
                <em>Infinitas conexões.</em>
              </h2>
            </div>
            <div className="dz-about-copy">
              <p>{c.about}</p>
              <Link className="dz-text-link" to="/brief">
                Conheça a agência em uma conversa <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <div className="dz-container dz-team-heading">
            <p className="dz-eyebrow">QUEM CRIA COM VOCÊ</p>
            <h2>Nossa <em>equipe.</em></h2>
          </div>
          {c.team.length > 0 ? (
            <div className="dz-container dz-team">
              {c.team.map((person, i) => (
                <article key={i}>
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      width="400"
                      height="500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="dz-team-initial" aria-hidden="true">
                      {person.name.charAt(0)}
                    </div>
                  )}
                  <h3>{person.name}</h3>
                  <p>{person.role}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="dz-container dz-team">
              {["Designer", "Social Media", "Tráfego Pago", "Videomaker"].map((role) => (
                <article key={role}>
                  <div className="dz-team-initial dz-team-placeholder" aria-label="Espaço reservado para foto">
                    <Camera size={40} strokeWidth={1} />
                    <span>Foto em breve</span>
                  </div>
                  <h3>{role}</h3>
                  <p>Apresentação da equipe em breve.</p>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="dz-faq dz-container">
          <p className="dz-eyebrow">04 / ANTES DO PRIMEIRO OLÁ</p>
          <div className="dz-faq-grid">
            <h2>
              Algumas
              <br />
              <em>boas respostas.</em>
            </h2>
            <div>
              {c.faqs.map((faq, i) => (
                <details key={i}>
                  <summary>
                    {faq.question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section id="contato" className="dz-contact">
          <div className="dz-container">
            <p className="dz-eyebrow">05 / SEU PRÓXIMO CAPÍTULO</p>
            <h2>
              Uma ideia na cabeça?
              <br />
              <span>Vamos tirar do papel.</span>
              <ArrowUpRight className="dz-contact-arrow" />
            </h2>
            <div className="dz-contact-bottom">
              <p>
                Conte seu desafio. A gente começa
                <br />
                pela pergunta certa.
              </p>
              <Link className="dz-button" to="/brief">
                Enviar meu briefing <ArrowUpRight size={22} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="dz-footer dz-container">
        <div className="dz-footer-top">
          <Link to="/" className="dz-wordmark">
            dois<span>.</span>zero
          </Link>
          <div className="dz-footer-links">
            {c.instagram && (
              <a href={c.instagram} target="_blank" rel="noopener noreferrer">
                <Camera size={16} /> Instagram <ArrowUpRight size={13} />
              </a>
            )}
            {c.linkedin && (
              <a href={c.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn <ArrowUpRight size={13} />
              </a>
            )}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp <ArrowUpRight size={13} />
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`}>
                <Mail size={16} />
                {c.email}
              </a>
            )}
          </div>
        </div>
        <div className="dz-footer-bottom">
          <span>
            © {year} {c.name} · Estratégia com personalidade.
          </span>
          <span>{c.address}</span>
          <Link to="/login">Acesso à plataforma ↗</Link>
        </div>
      </footer>
      {!configured && (
        <span className="dz-preview-label">
          PRÉVIA CRIATIVA · CONTEÚDO EDITÁVEL
        </span>
      )}
    </div>
  );
}
