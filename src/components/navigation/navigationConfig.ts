import { matchPath } from "react-router-dom";
import { navItems } from "./NavLinks";
export const navigationGroups = [
  { id: "panel", label: "PAINEL", items: ["dashboard", "calendar"] },
  {
    id: "commercial",
    label: "CLIENTES & BRIEFINGS",
    items: ["clients", "briefings"],
  },
  {
    id: "projects",
    label: "PROJETOS & ENTREGAS",
    items: ["projects", "tasks"],
  },
  { id: "people", label: "PESSOAS & EQUIPES", items: ["team", "squads"] },
  {
    id: "production",
    label: "PRODUÇÃO CRIATIVA",
    items: ["design", "videomaker", "paid-traffic"],
  },
  {
    id: "strategy",
    label: "ESTRATÉGIA & CONTEÚDO",
    items: ["social-media", "strategy", "editorial"],
  },
  {
    id: "communication",
    label: "COMUNICAÇÃO",
    items: ["meetings", "chat", "presentations"],
  },
  { id: "system", label: "SISTEMA", items: ["settings"] },
];
export function navigationContext(pathname: string) {
  return [...navItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((i) => matchPath({ path: i.path + "/*", end: false }, pathname))?.id;
}
