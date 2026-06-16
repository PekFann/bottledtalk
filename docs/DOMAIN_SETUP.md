# Production domain setup (bottledtalk.com)

Use this checklist when `www.bottledtalk.com` works but `bottledtalk.com` shows an SSL error.

## Root cause (confirmed)

Public DNS currently resolves:

- `bottledtalk.com` → `103.7.9.22` (MSCHosting server — **wrong**, causes SSL mismatch)
- `www.bottledtalk.com` → Vercel via CNAME (correct)

The apex domain must point to Vercel, not your hosting panel IP.

## 1. DNS at MSCHosting (registrar)

In **Edit Zone - bottledtalk.com**:

| Type  | Name | Value                                  | Action                    |
|-------|------|----------------------------------------|---------------------------|
| A     | `@`  | `216.198.79.1`                         | **Set / keep** (Vercel IP) |
| A     | `@`  | `103.7.9.22`                           | **Delete** if present     |
| A     | `@`  | `76.76.21.21`                          | **Delete** if present     |
| CNAME | `www`| `f1d487d713e46774.vercel-dns-017.com` | Keep (value from Vercel)  |

**Important:** If you added a DNS zone with IP `103.7.9.22`, that created a default A record pointing apex to hosting instead of Vercel. Remove it.

Do not add a second `www` CNAME.

Verify after changes (may take 15–60 minutes):

```bash
nslookup bottledtalk.com
```

Must return `216.198.79.1` only — not `103.7.9.22`.

## 2. Vercel

1. **Settings → Environment Variables** — confirm all three are set for Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
2. **Settings → Domains** — click **Refresh** on `bottledtalk.com` and `www.bottledtalk.com`
3. Wait until both show **Valid Configuration**
4. Apex should show: `bottledtalk.com` → `308` → `www.bottledtalk.com`
5. **Redeploy** after env var or code changes

## 3. Supabase

**Authentication → URL Configuration**

- **Site URL:** `https://www.bottledtalk.com`
- **Redirect URLs:**
  - `https://www.bottledtalk.com/**`
  - `https://bottledtalk.com/**`
  - `http://localhost:3000/**`

## 4. Verify

1. `https://www.bottledtalk.com` — loads with no errors
2. `https://bottledtalk.com` — redirects to `www` with no SSL warning
3. Sign up / sign in works on production

Test in an incognito window to avoid cached SSL errors.

## App-level redirect (backup)

The app also redirects apex to www in [`next.config.ts`](../next.config.ts). This only works after DNS and SSL are correct on Vercel.
