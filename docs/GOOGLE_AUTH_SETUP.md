# Google Sign-In (no Supabase custom domain)

Google login uses **Google Identity Services** on `www.bottledtalk.com` and `signInWithIdToken` — users never redirect through `*.supabase.co`. Works on Supabase **free tier** (no custom domain add-on).

## 1. Google Cloud Console

1. Create or open a project at [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs & Services → OAuth consent screen**
   - User type: External
   - App name: **BottledTalk**
   - Support email, home page `https://www.bottledtalk.com`
   - Privacy policy and terms URLs on your domain (required for production)
   - Add **Authorized domains:** `bottledtalk.com`
   - Verify domain in [Google Search Console](https://search.google.com/search-console) if prompted
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     - `https://www.bottledtalk.com`
     - `https://bottledtalk.com` (optional)
     - `http://localhost:3000`
   - **Authorized redirect URIs:** leave empty for the ID-token flow (no `supabase.co` callback needed)
4. Copy the **Client ID** and **Client secret**

## 2. Supabase (free)

1. **Authentication → Providers → Google** → Enable
2. Paste **Client ID** and **Client secret** from Google Cloud
3. **Authentication → URL Configuration** (should already match [DOMAIN_SETUP.md](./DOMAIN_SETUP.md)):
   - Site URL: `https://www.bottledtalk.com`
   - Redirect URLs: `https://www.bottledtalk.com/**`, `http://localhost:3000/**`

## 3. Environment variables

Add to `.env.local` and Vercel Production:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

The client secret stays in Supabase only — not in the Next.js app.

## 4. Database (optional but recommended)

Run in Supabase SQL Editor:

```
supabase/migrations/015_google_profile_name.sql
```

This sets new Google users’ display names from `full_name` / `name` in auth metadata.

## Verify

1. Open `https://www.bottledtalk.com/login` in incognito
2. Click **Sign in with Google**
3. Google shows **BottledTalk** (after consent screen branding is configured)
4. After login, you land on `/map` — address bar never shows `supabase.co`
