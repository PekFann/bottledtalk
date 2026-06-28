import Link from "next/link";
import BottleImage from "@/components/bottles/BottleImage";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { isGoogleAuthEnabled } from "@/lib/googleAuthConfig";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const googleAuth = isGoogleAuthEnabled();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-blue-50 px-4">
      <div className="w-full max-w-md rounded-2xl glass shadow-xl p-8">
        <div className="text-center mb-8">
          <BottleImage size="md" className="mx-auto" />
          <h1 className="text-2xl font-bold text-sky-900 mt-2">BottledTalk</h1>
          <p className="text-slate-600 mt-1">Welcome back, sailor</p>
        </div>

        {params.error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            {params.error}
          </div>
        )}

        {googleAuth && <GoogleSignIn redirectTo={params.redirect ?? "/map"} mode="signin" />}

        {googleAuth && (
          <p className="text-center text-xs text-slate-500 my-4">or continue with email</p>
        )}

        <form action="/auth/login" method="post" className="space-y-4">
          <input type="hidden" name="redirect" value={params.redirect ?? "/map"} />

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary-block"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          New here?{" "}
          <Link href="/signup" className="text-sky-600 font-medium hover:underline">
            Create an account
          </Link>
        </p>

        <p className="text-center mt-4">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
