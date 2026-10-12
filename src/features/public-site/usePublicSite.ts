import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  defaultSiteContent,
  normalizeSiteContent,
  readSiteDraft,
  SITE_SLUG,
} from "./siteContent";
export function usePublicSite() {
  const auth = useAuth();
  const draftRequested = new URLSearchParams(window.location.search).get(
    "draft",
  );
  const mayPreviewDraft = Boolean(
    draftRequested &&
      auth.activeAgency?.agencyId === draftRequested &&
      (auth.isDemo || auth.activeAgency?.roleName === "OWNER"),
  );
  const query = useQuery({
    queryKey: ["public-site", SITE_SLUG],
    retry: false,
    queryFn: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from("agency_public_sites")
        .select("content")
        .eq("slug", SITE_SLUG)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeSiteContent(data.content) : null;
    },
  });
  const draft = mayPreviewDraft ? readSiteDraft(draftRequested!) : null;
  return {
    content: draft ?? query.data ?? defaultSiteContent,
    draft: Boolean(draft),
    configured: Boolean(query.data),
    // O conteúdo padrão é uma landing completa e segura: a página pública não
    // deve desaparecer apenas porque o registro editável do Supabase está
    // ausente, não publicado ou temporariamente indisponível.
    available: true,
    pending: query.isLoading,
  };
}
