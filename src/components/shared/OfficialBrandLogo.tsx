export function OfficialBrandLogo({ src, name, hero = false }: { src: string; name: string; hero?: boolean }) {
  const official = src.includes("official-logo.webp");
  return <span className={`dz-brand-logo ${hero ? "dz-brand-hero" : ""} ${official ? "dz-brand-official" : ""}`}>
    <img className={hero ? "dz-hero-logo" : undefined} src={src} alt={name} width="275" height="39" />
    {official && <img className="dz-brand-symbol" src={src} alt="" aria-hidden="true" width="275" height="39" />}
  </span>;
}
