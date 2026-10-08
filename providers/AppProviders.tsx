"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "./toast";
import { StoreProvider } from "./store";
import { LanguageProvider } from "@/lib/i18n";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        <StoreProvider>{children}</StoreProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
