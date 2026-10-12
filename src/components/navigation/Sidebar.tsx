import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { BrandLogo, BrandSymbol } from "@/components/shared/BrandLogo";
import { useBranding } from "@/hooks/useBranding";
import { IconButton } from "@/components/ui/IconButton";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/components/ui/Toast";
import { NavigationGroups } from "./NavigationGroups";
import { WorkspaceSelector } from "./WorkspaceSelector";
export const Sidebar: React.FC<{
  collapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ collapsed, onToggleCollapse }) => {
  const auth = useAuth(),
    { branding } = useBranding();
  return (
    <aside
      style={
        {
          "--color-primary": branding.colors.primary,
          "--color-surface": branding.colors.surface,
          "--color-bg": branding.colors.background,
          "--color-border": branding.colors.border,
          "--color-text-primary": branding.colors.textPrimary,
          "--color-text-secondary": branding.colors.textSecondary,
        } as React.CSSProperties
      }
      aria-label="Navegação Principal"
      data-collapsed={collapsed}
      className={`hidden md:flex flex-col h-svh sticky top-0 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-[width] motion-reduce:transition-none z-30 ${collapsed ? "w-[72px]" : "w-[248px]"}`}
    >
      <div
        className={`shrink-0 border-b border-[var(--color-border)] flex items-center ${collapsed ? "flex-col justify-center gap-1 py-3" : "h-20 justify-between px-3.5"}`}
      >
        <NavLink
          to="/dashboard"
          aria-label={branding.name}
          className="flex min-w-0 max-w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          {collapsed ? <BrandSymbol size={32} /> : <BrandLogo size="md" />}
        </NavLink>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          aria-label={
            collapsed ? "Expandir barra lateral" : "Recolher barra lateral"
          }
          className="shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </IconButton>
      </div>
      <div className="shrink-0 p-2 border-b border-[var(--color-border)]">
        <WorkspaceSelector collapsed={collapsed} onExpand={onToggleCollapse} />
      </div>
      <nav
        aria-label="Módulos da agência"
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3"
      >
        <NavigationGroups collapsed={collapsed} />
      </nav>
      <div className="shrink-0 p-2.5 border-t border-[var(--color-border)] space-y-2">
        <NavigationGroups collapsed={collapsed} footer scope="desktop-footer" />
        <div
          className={`flex items-center rounded-xl bg-[var(--color-bg)] p-2 ${collapsed ? "flex-col justify-center gap-1" : "gap-2"}`}
        >
          <Avatar name={auth.name || "Usuário"} size="sm" status="online" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">
                {auth.name || "Usuário"}
              </p>
              <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                {auth.user?.email || "Demonstração local"}
              </p>
            </div>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Sair do sistema"
            onClick={() =>
              void auth
                .signOut()
                .catch(() => toast.error("Não foi possível encerrar a sessão."))
            }
          >
            <LogOut className="w-4 h-4" />
          </IconButton>
        </div>
      </div>
    </aside>
  );
};
