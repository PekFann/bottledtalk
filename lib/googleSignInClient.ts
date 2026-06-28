/** Mobile Safari and in-app browsers need GIS redirect mode instead of popup. */
export function prefersGoogleRedirectSignIn(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isIosSafari = /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
  const isInAppBrowser = /FBAN|FBAV|Instagram|Twitter|Line\/|WhatsApp|wv\)/i.test(ua);

  return isMobile || isIosSafari || isInAppBrowser;
}

export function setGoogleRedirectCookie(redirectTo: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `bt_google_redirect=${encodeURIComponent(redirectTo)}; path=/; max-age=600; SameSite=Lax${secure}`;
}

export function googleCallbackUri(): string {
  return `${window.location.origin}/auth/google/callback`;
}
