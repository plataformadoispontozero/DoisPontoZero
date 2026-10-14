export interface AgencyAccess {
  agencyId: string;
  agencyName: string;
  roleId: string;
  roleName: string;
}

export function localDemoAllowed(
  flag: string | undefined,
  hostname: string,
  configured: boolean,
) {
  return (
    flag === "true" &&
    !configured &&
    ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
  );
}

export function safeReturnPath(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/^\/(login|forgot-password|reset-password)(\/|\?|$)/.test(value)
    ? value
    : "/dashboard";
}

export function routePermission(path: string): string | null {
  const segments = path.split("/").filter(Boolean);
  const module = segments[0];
  if (module === "team")
    return segments[1] === "new" ? "members.invite" : "members.view";
  if (module === "social-media") return "strategy.view";
  if (module === "editorial") return "strategy.view";
  if (module === "production") return "tasks.view";
  if (module === "traffic") return "traffic.view";
  if (
    module === "settings" &&
    segments[1] === "integrations" &&
    segments[2] === "meta"
  )
    return "meta.connections.view";
  if (module === "chat") return "chat.access";
  if (module === "calendar" || module === "agenda") return "meetings.view";
  if (module === "notifications") return null;
  if (module === "settings") {
    if (segments[1] === "permissions") return "permissions.manage";
    if (segments[1] === "team") return "members.view";
    if (segments[1] === "public-site") return "branding.manage";
    if (segments[1] === "branding") return "branding.manage";
    return "settings.view";
  }
  if (
    [
      "dashboard",
      "clients",
      "projects",
      "tasks",
      "squads",
      "briefings",
      "strategy",
      "drive",
      "presentations",
      "meetings",
    ].includes(module)
  ) {
    if (segments.at(-1) === "edit") return `${module}.edit`;
    if (segments[1] === "new") return `${module}.create`;
    return `${module}.view`;
  }
  return null;
}

export function isManagementRole(role: string | undefined) { return ['OWNER','ADMIN','MANAGER'].includes(role||'') }
