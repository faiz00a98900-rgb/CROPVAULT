"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "./toast";
import { StoreProvider } from "./store";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <StoreProvider>{children}</StoreProvider>
    </ToastProvider>
  );
}
