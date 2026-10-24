import { useState, type CSSProperties } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, GripVertical, ArrowUp, ArrowDown, Settings2 } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/features/auth/AuthProvider";
import { routePermission, isManagementRole } from "@/features/auth/access";
import { navItems } from "./NavLinks";
import { navigationGroups, navigationContext } from "./navigationConfig";
import { normalizeMenuOrder, moveMenuGroup } from "./menuOrder";
import { Tooltip } from "@/components/ui/Tooltip";
function GroupSections({
  collapsed = false,
  footer = false,
  scope = "desktop",
}: {
  collapsed?: boolean;
  footer?: boolean;
  scope?: string;
}) {
  const { branding } = useBranding();
  const theme = {
    "--color-primary": branding.colors.primary,
    "--color-text-primary": branding.colors.textPrimary,
    "--color-text-secondary": branding.colors.textSecondary,
    "--color-text-muted": branding.colors.muted,
    "--color-surface-elevated": branding.colors.surfaceElevated,
  } as CSSProperties;
  const auth = useAuth(),
    location = useLocation(),
    active = navigationContext(location.pathname);
  const key = `dz_navigation_groups:${auth.user?.id || "demo"}:${auth.activeAgency?.agencyId || "none"}`;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") as Record<
        string,
        boolean
      >;
    } catch {
      return {};
    }
  };
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const saved = read();
    const group = navigationGroups.find((g) => g.items.includes(active || ""));
    return group ? { ...saved, [group.id]: true } : saved;
  });
  const orderKey=`dz_navigation_order:${auth.user?.id||'demo'}:${auth.activeAgency?.agencyId||'none'}`;
  const defaults=['panel','strategy','commercial','projects','production','people','communication','system'];
  const [order,setOrder]=useState<string[]>(()=>{try{return normalizeMenuOrder(JSON.parse(localStorage.getItem(orderKey)||'null'),defaults)}catch{return defaults}});
  const [organizing,setOrganizing]=useState(false);
  const canOrganize=auth.isDemo||isManagementRole(auth.activeAgency?.roleName);
  function saveOrder(next:string[]){setOrder(next);try{localStorage.setItem(orderKey,JSON.stringify(next))}catch{/* remains usable without preference storage */}}
  function move(source:string,target:string){saveOrder(moveMenuGroup(order,source,target))}
  function toggle(id: string) {
    setOpen((old) => {
      const next = { ...read(), [id]: old[id] === false };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* preference storage unavailable */
      }
      return next;
    });
  }
  return (
    <div className="space-y-3" style={theme}>
      {!footer&&!collapsed&&canOrganize&&<div className="space-y-2"><button type="button" aria-pressed={organizing} onClick={()=>setOrganizing(v=>!v)} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-xs text-[var(--color-text-secondary)]"><Settings2 className="h-3 w-3"/>{organizing?'Concluir organização':'Organizar menu'}</button>{organizing&&<p className="px-3 text-[10px] text-[var(--color-text-muted)]">Arraste os setores ou use as setas. Preferência neste navegador.</p>}</div>}
      {[...navigationGroups].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id))
        .filter((g) => (footer ? g.id === "system" : g.id !== "system"))
        .map((group) => {
          const items = group.items.flatMap((id) => {
            const item = navItems.find((i) => i.id === id);
            if (!item || (id === "projects" && !auth.isDemo && !isManagementRole(auth.activeAgency?.roleName))) return [];
            const permission = routePermission(item.path);
            return auth.isDemo ||
              auth.activeAgency?.roleName === "OWNER" ||
              !permission ||
              auth.permissions.has(permission)
              ? [item]
              : [];
          });
          if (!items.length) return null;
          const expanded = open[group.id] !== false,
            controls = `nav-${scope}-${group.id}`;
          return (
            <section key={group.id} aria-label={group.label}
              draggable={organizing&&!collapsed&&!footer}
              onDragStart={e=>e.dataTransfer.setData('text/plain',group.id)}
              onDragOver={e=>{if(organizing)e.preventDefault()}}
              onDrop={e=>{if(organizing){e.preventDefault();move(e.dataTransfer.getData('text/plain'),group.id)}}}>
              {organizing&&!collapsed&&!footer&&<div className="flex items-center justify-end gap-1"><GripVertical aria-hidden="true" className="h-3 w-3 mr-auto"/>{[-1,1].map(direction=><button key={direction} type="button" aria-label={`${direction<0?'Subir':'Descer'} ${group.label}`} disabled={order.indexOf(group.id)+direction<0||order.indexOf(group.id)+direction>=order.length-1} onClick={()=>{const next=[...order],i=next.indexOf(group.id),j=i+direction;if(j>=0&&j<next.length-1){[next[i],next[j]]=[next[j],next[i]];saveOrder(next)}}} className="p-2 rounded disabled:opacity-30">{direction<0?<ArrowUp className="h-3 w-3"/>:<ArrowDown className="h-3 w-3"/>}</button>)}</div>}
              {!collapsed && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={controls}
                  onClick={() => toggle(group.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[10px] font-semibold tracking-wide text-[var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg"
                >
                  {group.label}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform motion-reduce:transition-none ${expanded ? "" : "-rotate-90"}`}
                  />
                </button>
              )}
              <ul
                id={controls}
                hidden={!collapsed && !expanded}
                className="space-y-1"
              >
                {items.map((item) => {
                  const link = (
                    <NavLink
                      to={item.path}
                      aria-label={item.label}
                      aria-current={active === item.id ? "page" : undefined}
                      className={`flex w-full min-h-[44px] items-center rounded-lg text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${collapsed ? "justify-center p-0" : "gap-3 px-3"} ${active === item.id ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );
                  return (
                    <li key={item.id}>
                      {collapsed ? (
                        <Tooltip
                          content={item.label}
                          position="right"
                          className="w-full"
                        >
                          {link}
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
    </div>
  );
}

export function NavigationGroups(props: {
  collapsed?: boolean;
  footer?: boolean;
  scope?: string;
}) {
  const auth = useAuth(),
    location = useLocation();
  return (
    <GroupSections
      key={`${auth.user?.id}:${auth.activeAgency?.agencyId}:${location.pathname}`}
      {...props}
    />
  );
}
