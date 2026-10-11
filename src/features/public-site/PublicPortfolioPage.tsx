import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { usePublicSite } from "./usePublicSite";
import { Poster } from "./Poster";
import "./public-site.css";
export function PublicPortfolioPage() {
  const { projectId } = useParams();
  const { content, available, pending } = usePublicSite();
  const project = available ? content.projects.find((p) => p.id === projectId) : undefined;
  useEffect(() => { window.scrollTo(0, 0); const previous = document.title; document.title = `${project?.title || "Portfólio"} — ${content.name}`; return () => { document.title = previous; }; }, [project?.title, content.name]);
  return <main className="dz-site dz-portfolio-page"><div className="dz-container">
    <Link className="dz-text-link" to="/#projetos"><ArrowLeft size={18} /> Voltar ao portfólio</Link>
    {pending ? <h1>Carregando projeto…</h1> : !project ? <><h1>Projeto indisponível</h1><p>Este projeto ainda não foi publicado ou não está disponível.</p></> : <>
      <p className="dz-eyebrow">{project.concept ? "ESTUDO AUTORAL" : "PROJETO DA AGÊNCIA"} / {project.category}</p>
      <h1>{project.title}</h1>
      {project.client && <p className="dz-portfolio-client">Cliente: {project.client}</p>}
      <div className="dz-portfolio-cover"><Poster project={project} /></div>
      <section className="dz-portfolio-story"><h2>A ideia por trás do projeto.</h2><p>{project.description}</p>{project.result && <p className="dz-result">{project.result}</p>}</section>
      {!!project.materials?.length && <section aria-label="Materiais do projeto" className="dz-portfolio-materials">{project.materials.map((m, i) => <figure key={i}><img src={m.image} alt={m.caption || `Material ${i + 1} de ${project.title}`} loading="lazy" />{m.caption && <figcaption>{m.caption}</figcaption>}</figure>)}</section>}
      <Link className="dz-button" to="/brief">Começar meu projeto <ArrowUpRight size={18} /></Link>
    </>}
  </div></main>;
}
