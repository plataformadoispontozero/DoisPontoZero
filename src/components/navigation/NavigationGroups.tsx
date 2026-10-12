import { useState, type CSSProperties } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/features/auth/AuthProvider";
import { routePermission } from "@/features/auth/access";
import { navItems } from "./NavLinks";
import { navigationGroups, navigationContext } from "./navigationConfig";
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
      {navigationGroups
        .filter((g) => (footer ? g.id === "system" : g.id !== "system"))
        .map((group) => {
          const items = group.items.flatMap((id) => {
            const item = navItems.find((i) => i.id === id);
            if (!item) return [];
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
            <section key={group.id} aria-label={group.label}>
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
                      className={`flex w-full min-h-[44px] items-center rounded-lg text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${collapsed ? "justify-center p-0" : "gap-3 px-3"} ${active === item.id ? "bg-[var(--color-primary)] text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"}`}
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
