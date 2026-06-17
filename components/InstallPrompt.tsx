"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "bottledtalk-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export default function InstallPrompt({ aboveFab = false }: { aboveFab?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"chrome" | "ios">("chrome");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!isMobile() || isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "true") return;

    if (isIOS()) {
      setMode("ios");
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode("chrome");
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed left-0 right-0 z-40 p-4 md:hidden ${
        aboveFab ? "bottom-36" : "bottom-0"
      }`}
    >
      <div className="mx-auto max-w-lg rounded-2xl bg-white shadow-2xl border border-sky-100 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-xl">
            🍾
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">Add BottledTalk to Home Screen</p>
            {mode === "ios" ? (
              <p className="text-sm text-slate-600 mt-1">
                Tap{" "}
                <span className="inline-flex items-center font-medium text-sky-700">
                  Share
                </span>{" "}
                <span aria-hidden="true">⎋</span> then{" "}
                <span className="font-medium text-sky-700">Add to Home Screen</span>
              </p>
            ) : (
              <p className="text-sm text-slate-600 mt-1">
                Install the app for quick access to the map and bottles nearby.
              </p>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        {mode === "chrome" && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full rounded-lg bg-sky-600 text-white font-semibold py-2.5 hover:bg-sky-700 transition-colors"
          >
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
