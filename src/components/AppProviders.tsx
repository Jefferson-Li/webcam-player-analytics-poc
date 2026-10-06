"use client";

import { LocaleProvider } from "@/lib/i18n/context";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
