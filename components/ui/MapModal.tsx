"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const closeButtonClassName =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors";

export function MapModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={closeButtonClassName}
      aria-label="Close"
    >
      <X className="h-5 w-5" strokeWidth={2.25} />
    </button>
  );
}

const maxWidthClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

type MapModalProps = {
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  headerBelow?: ReactNode;
  children: ReactNode;
  maxWidth?: keyof typeof maxWidthClass;
  align?: "sheet" | "center";
  panelClassName?: string;
  bodyClassName?: string;
  headerSticky?: boolean;
  panelScroll?: boolean;
};

export default function MapModal({
  onClose,
  title,
  subtitle,
  headerBelow,
  children,
  maxWidth = "lg",
  align = "sheet",
  panelClassName = "",
  bodyClassName = "p-5",
  headerSticky = false,
  panelScroll = false,
}: MapModalProps) {
  const alignClass =
    align === "center"
      ? "items-center"
      : "items-end sm:items-center";

  const panelBase = panelScroll
    ? `w-full ${maxWidthClass[maxWidth]} rounded-xl game-panel-light overflow-y-auto flex flex-col ${panelClassName}`
    : `w-full ${maxWidthClass[maxWidth]} rounded-xl game-panel-light overflow-hidden flex flex-col ${panelClassName}`;

  const headerClass = headerSticky
    ? "glass-header sticky top-0 z-10 rounded-t-xl"
    : "glass-header rounded-t-xl";

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/40 px-4 pb-4 sm:pb-0 ${alignClass}`}
    >
      <motion.div
        className={panelBase}
        initial={{ y: align === "center" ? 0 : 40, opacity: 0, scale: align === "center" ? 0.95 : 1 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        <div className={headerClass}>
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              {subtitle}
            </div>
            <MapModalCloseButton onClick={onClose} />
          </div>
          {headerBelow}
        </div>
        {panelScroll ? (
          <div className={bodyClassName}>{children}</div>
        ) : (
          <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
        )}
      </motion.div>
    </div>
  );
}

type MapBottomSheetProps = {
  children: ReactNode;
  className?: string;
};

export function MapBottomSheet({ children, className = "" }: MapBottomSheetProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-36 sm:pb-6">
      <motion.div
        className={`mx-auto max-w-lg rounded-xl game-panel-light p-5 ${className}`}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200/80" />
        {children}
      </motion.div>
    </div>
  );
}
