export const PROFILE_KEYS = [
  "niche",
  "city",
  "instagram",
  "plan",
  "average_ticket",
  "monthly_content_count",
  "target_audience",
  "age_range",
  "audience_gender",
  "tone",
  "differential",
  "special_dates",
  "renewal_date",
  "source_id",
  "source_created_at",
  "source_updated_at",
  "positioning",
  "structure",
  "monthly_objective",
  "drive_url",
  "maps_url",
  "meta_ad_account_id",
] as const;
export type ClientProfileKey = (typeof PROFILE_KEYS)[number];
export type ClientProfile = Partial<
  Record<
    Exclude<ClientProfileKey, "average_ticket" | "monthly_content_count">,
    string
  >
> & {
  average_ticket?: number;
  monthly_content_count?: number;
};
export interface ClientProfileField {
  key: ClientProfileKey;
  label: string;
  section: "comercial" | "publico" | "estrategia" | "origem";
  type: "text" | "textarea" | "number" | "date" | "url";
  maxLength?: number;
}
export const CLIENT_PROFILE_FIELDS: readonly ClientProfileField[] = [
  {key:"meta_ad_account_id",label:"Conta Meta Ads (act_ID)",section:"comercial",type:"text",maxLength:50},
  {
    key: "niche",
    label: "Nicho",
    section: "comercial",
    type: "text",
    maxLength: 200,
  },
  {
    key: "city",
    label: "Cidade",
    section: "comercial",
    type: "text",
    maxLength: 200,
  },
  {
    key: "instagram",
    label: "Instagram",
    section: "comercial",
    type: "text",
    maxLength: 500,
  },
  {
    key: "plan",
    label: "Plano",
    section: "comercial",
    type: "text",
    maxLength: 200,
  },
  {
    key: "average_ticket",
    label: "Ticket médio",
    section: "comercial",
    type: "number",
  },
  {
    key: "monthly_content_count",
    label: "Conteúdos por mês",
    section: "comercial",
    type: "number",
  },
  {
    key: "target_audience",
    label: "Público-alvo",
    section: "publico",
    type: "textarea",
    maxLength: 4000,
  },
  {
    key: "age_range",
    label: "Faixa etária",
    section: "publico",
    type: "text",
    maxLength: 200,
  },
  {
    key: "audience_gender",
    label: "Gênero do público",
    section: "publico",
    type: "text",
    maxLength: 100,
  },
  {
    key: "tone",
    label: "Tom de comunicação",
    section: "estrategia",
    type: "textarea",
    maxLength: 1000,
  },
  {
    key: "differential",
    label: "Diferencial",
    section: "estrategia",
    type: "textarea",
    maxLength: 4000,
  },
  {
    key: "positioning",
    label: "Posicionamento",
    section: "estrategia",
    type: "textarea",
    maxLength: 4000,
  },
  {
    key: "structure",
    label: "Estrutura",
    section: "estrategia",
    type: "textarea",
    maxLength: 4000,
  },
  {
    key: "monthly_objective",
    label: "Objetivo do mês",
    section: "estrategia",
    type: "textarea",
    maxLength: 4000,
  },
  {
    key: "special_dates",
    label: "Datas especiais",
    section: "estrategia",
    type: "textarea",
    maxLength: 4000,
  },
  {
    key: "renewal_date",
    label: "Data de renovação",
    section: "comercial",
    type: "date",
    maxLength: 10,
  },
  {
    key: "drive_url",
    label: "Pasta no Drive",
    section: "comercial",
    type: "url",
    maxLength: 2048,
  },
  {
    key: "maps_url",
    label: "Localização no Maps",
    section: "comercial",
    type: "url",
    maxLength: 2048,
  },
  {
    key: "source_id",
    label: "ID na origem",
    section: "origem",
    type: "text",
    maxLength: 200,
  },
  {
    key: "source_created_at",
    label: "Cadastrado na origem",
    section: "origem",
    type: "text",
    maxLength: 100,
  },
  {
    key: "source_updated_at",
    label: "Atualizado na origem",
    section: "origem",
    type: "text",
    maxLength: 100,
  },
];
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 1900 &&
    year <= 9999 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
function validSourceDate(value: string) {
  const br =
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ ,T]+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
      value,
    );
  if (br)
    return (
      validDate(`${br[3]}-${br[2]}-${br[1]}`) &&
      (!br[4] || (+br[4] < 24 && +br[5] < 60 && +(br[6] || 0) < 60))
    );
  if (validDate(value)) return true;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  )
    return false;
  return validDate(value.slice(0, 10)) && Number.isFinite(Date.parse(value));
}
export function validateClientProfile(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return ["Perfil inválido."];
  const errors: string[] = [],
    profile = value as Record<string, unknown>;
  if (new TextEncoder().encode(JSON.stringify(profile)).byteLength > 32768)
    errors.push("Perfil acima de 32 KB.");
  for (const [key, item] of Object.entries(profile)) {
    const field = CLIENT_PROFILE_FIELDS.find((field) => field.key === key);
    if (!field) {
      errors.push(`Campo não permitido: ${key}.`);
      continue;
    }
    if (item === null || item === "") continue;
    if (field.type === "number") {
      if (
        typeof item !== "number" ||
        !Number.isFinite(item) ||
        item < 0 ||
        (key === "monthly_content_count"
          ? !Number.isInteger(item) || item > 1000
          : item > 1e9 || Number(item.toFixed(2)) !== item)
      )
        errors.push(`${field.label}: número inválido.`);
    } else if (
      typeof item !== "string" ||
      item.length > (field.maxLength || 4000)
    )
      errors.push(`${field.label}: texto inválido.`);
    else if (key === "meta_ad_account_id" && !/^act_\d{5,40}$/.test(item))
      errors.push("Conta Meta Ads: use act_ seguido do ID numérico da conta.");
    else if (field.type === "date" && !validDate(item))
      errors.push(`${field.label}: data inválida.`);
    else if (
      (key === "source_created_at" || key === "source_updated_at") &&
      !validSourceDate(item)
    )
      errors.push(`${field.label}: data da origem inválida.`);
    else if (field.type === "url") {
      try {
        const url = new URL(item);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password ||
          !url.hostname
        )
          throw Error();
      } catch {
        errors.push(`${field.label}: use URL HTTP ou HTTPS válida.`);
      }
    }
  }
  return errors;
}
export function readClientProfile(value: unknown): ClientProfile {
  const profile: ClientProfile = {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    return profile;
  for (const key of PROFILE_KEYS) {
    const item = (value as Record<string, unknown>)[key];
    if (
      item !== undefined &&
      item !== null &&
      (typeof item !== "string" || item.trim() !== "") &&
      validateClientProfile({ [key]: item }).length === 0
    )
      Object.assign(profile, {
        [key]: typeof item === "string" ? item.trim() : item,
      });
  }
  return profile;
}
export function missingProfileFields(
  current: unknown,
  incoming: unknown,
): ClientProfile {
  const original = readClientProfile(current),
    source = readClientProfile(incoming),
    result: ClientProfile = {};
  for (const key of PROFILE_KEYS)
    if (original[key] === undefined && source[key] !== undefined)
      Object.assign(result, { [key]: source[key] });
  return result;
}
