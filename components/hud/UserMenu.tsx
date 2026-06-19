"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Menu, User } from "lucide-react";

type Props = {
  displayName: string | null;
  email: string | null;
  userId: string | null;
};

export default function UserMenu({ displayName, email, userId }: Props) {
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

  const label = displayName ?? email ?? "Account";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/40 backdrop-blur-md border border-white/30 text-slate-700 hover:bg-white/55 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="glass-dropdown-pastel absolute right-0 top-full mt-2 w-48 py-1 z-30"
        >
          <p className="px-3 py-2 text-xs text-slate-500 truncate border-b border-slate-200/80">
            {label}
          </p>

          {userId ? (
            <Link
              href={`/profile/${userId}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 transition-colors"
            >
              <User className="h-4 w-4 shrink-0" />
              Profile
            </Link>
          ) : (
            <button
              type="button"
              role="menuitem"
              disabled
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
            >
              <User className="h-4 w-4 shrink-0" />
              Profile
            </button>
          )}

          <div className="my-1 border-t border-slate-200/80" />

          <form action="/auth/logout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 transition-colors"
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
