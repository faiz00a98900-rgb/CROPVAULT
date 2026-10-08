"use client";

import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLanguage, LANGS, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/** Compact language dropdown for the top bar (English / हिन्दी / मराठी). */
export function LanguageSelector() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="neu-btn !px-3 !py-2.5 text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("topbar.language")}
      >
        <Globe className="h-4 w-4 text-leaf-dark" />
        <span className="hidden max-w-[80px] truncate sm:inline">{current.native}</span>
        <ChevronDown className="h-4 w-4 text-ink-faint" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl2 bg-base p-2 shadow-neu">
            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              {t("topbar.language")}
            </p>
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code as Lang);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:shadow-inset-sm",
                  l.code === lang ? "text-leaf-dark" : "text-ink"
                )}
              >
                <span>{l.native}</span>
                <span className="text-[11px] uppercase text-ink-faint">{l.code}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
