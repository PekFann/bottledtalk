"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncGoogleProfileName } from "@/lib/googleAuth";
import { getGoogleClientId } from "@/lib/googleAuthConfig";
import {
  googleCallbackUri,
  prefersGoogleRedirectSignIn,
  setGoogleRedirectCookie,
} from "@/lib/googleSignInClient";

const GIS_SCRIPT = "https://accounts.google.com/gsi/client";

type Props = {
  redirectTo?: string;
  mode?: "signin" | "signup";
};

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector(`script[src="${GIS_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  });
}

export default function GoogleSignIn({ redirectTo = "/map", mode = "signin" }: Props) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);

  const clientId = getGoogleClientId();

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) return;

      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });

      if (signInError) {
        setLoading(false);
        setError(signInError.message);
        return;
      }

      if (data.user) {
        await syncGoogleProfileName(supabase, data.user);
      }

      router.push(redirectTo);
      router.refresh();
    },
    [redirectTo, router]
  );

  useEffect(() => {
    setInAppBrowser(/FBAN|FBAV|Instagram|Twitter|Line\/|WhatsApp/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    setGoogleRedirectCookie(redirectTo);
  }, [redirectTo]);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    let cancelled = false;
    const useRedirect = prefersGoogleRedirectSignIn();

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

        buttonRef.current.innerHTML = "";
        setGoogleRedirectCookie(redirectTo);

        if (useRedirect) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            ux_mode: "redirect",
            login_uri: googleCallbackUri(),
            itp_support: true,
          });
        } else {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredential,
            itp_support: true,
          });
        }

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: mode === "signup" ? "signup_with" : "signin_with",
          shape: "rectangular",
          width: Math.min(320, buttonRef.current.clientWidth || 320),
          logo_alignment: "left",
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, handleCredential, mode, redirectTo]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="space-y-3">
      {inAppBrowser && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
          Google sign-in may not work inside this app&apos;s browser. Open{" "}
          <span className="font-medium">www.bottledtalk.com</span> in Safari or Chrome instead.
        </p>
      )}
      <div
        ref={buttonRef}
        className={`flex justify-center min-h-[44px] ${loading ? "opacity-50 pointer-events-none" : ""}`}
        aria-busy={loading}
      />
      {error && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
