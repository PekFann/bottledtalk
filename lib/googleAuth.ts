import type { SupabaseClient, User } from "@supabase/supabase-js";

export function getGoogleDisplayName(user: User): string | null {
  const meta = user.user_metadata;
  const name = meta?.full_name ?? meta?.name ?? meta?.display_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

export async function syncGoogleProfileName(
  supabase: SupabaseClient,
  user: User
): Promise<void> {
  const name = getGoogleDisplayName(user);
  if (!name) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return;

  const emailLocal = user.email?.split("@")[0] ?? "";
  const generic =
    !profile.display_name ||
    profile.display_name === "Sailor" ||
    profile.display_name === emailLocal;

  if (generic) {
    await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
  }
}
