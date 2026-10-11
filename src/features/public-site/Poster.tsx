import type { SiteProject } from "./siteContent";
export function Poster({
  project,
  decorative = false,
}: {
  project: SiteProject;
  decorative?: boolean;
}) {
  return (
    <div
      className={`dz-poster dz-poster-${project.tone}`}
      aria-hidden={decorative || undefined}
    >
      {project.image ? (
        <img
          src={project.image}
          alt={decorative ? "" : project.title}
          loading="lazy"
          width="720"
          height="900"
        />
      ) : (
        <>
          <span className="dz-poster-top">DOIS.ZERO / CREATIVE LAB</span>
          <div className="dz-poster-orbit">
            <i />
            <i />
            <i />
          </div>
          <span className="dz-poster-title">{project.title}</span>
          <span className="dz-poster-bottom">
            {project.category}
            <b>↗</b>
          </span>
        </>
      )}
    </div>
  );
}
