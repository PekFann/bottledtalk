"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User } from "lucide-react";

type Props = {
  displayName: string | null;
  email: string | null;
};

function getInitials(displayName: string | null, email: string | null): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export default function UserMenu({ displayName, email }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const initials = getInitials(displayName, email);
  const label = displayName ?? email ?? "Account";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 border border-white/25 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="glass-dropdown absolute right-0 top-full mt-2 w-48 py-1 z-30"
        >
          <p className="px-3 py-2 text-xs text-white/60 truncate border-b border-white/10">
            {label}
          </p>

          <button
            type="button"
            role="menuitem"
            disabled
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-white/40 cursor-not-allowed"
          >
            <User className="h-4 w-4 shrink-0" />
            Profile
            <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-white/40 cursor-not-allowed"
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
            <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
          </button>

          <div className="my-1 border-t border-white/10" />

          <form action="/auth/logout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
