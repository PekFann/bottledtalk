import { createClient } from "@/lib/supabase/server";
import { syncGoogleProfileName } from "@/lib/googleAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function safeRedirectPath(value: string | undefined): string {
  if (!value) return "/map";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  } catch {
    // ignore malformed cookie
  }
  return "/map";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const credential = formData.get("credential");
  const csrfToken = formData.get("g_csrf_token");

  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get("g_csrf_token")?.value;

  if (
    typeof credential !== "string" ||
    !credential ||
    typeof csrfToken !== "string" ||
    !csrfCookie ||
    csrfToken !== csrfCookie
  ) {
    redirect(
      `/login?error=${encodeURIComponent("Google sign-in failed. Please try again in Safari or Chrome.")}`
    );
  }

  const redirectTo = safeRedirectPath(cookieStore.get("bt_google_redirect")?.value);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await syncGoogleProfileName(supabase, data.user);
  }

  try {
    cookieStore.set("bt_google_redirect", "", { path: "/", maxAge: 0 });
  } catch {
    // ignore in edge cases
  }

  redirect(redirectTo);
}
