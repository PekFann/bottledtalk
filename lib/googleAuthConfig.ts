/** Trimmed Google OAuth web client ID from env. */
export function getGoogleClientId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return id || undefined;
}

/** True when Google Identity Services sign-in is configured (Client ID in env). */
export function isGoogleAuthEnabled(): boolean {
  return Boolean(getGoogleClientId());
}
