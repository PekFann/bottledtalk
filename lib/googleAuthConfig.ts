/** True when Google Identity Services sign-in is configured (Client ID in env). */
export function isGoogleAuthEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());
}
