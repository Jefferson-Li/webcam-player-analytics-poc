"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/dictionaries";

export function SiteNav({
  active,
}: {
  active?: "home" | "play" | "admin";
}) {
  const { locale, setLocale, t } = useI18n();

  const linkClass = (key: typeof active) =>
    `rounded-lg px-3 py-1.5 text-sm transition ${
      active === key
        ? "bg-white/10 text-white"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  const langBtn = (code: Locale) =>
    `rounded-md px-2.5 py-1 text-xs font-semibold transition ${
      locale === code
        ? "bg-cyan-400 text-slate-950"
        : "text-slate-400 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="group flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30">
          ◈
        </span>
        <span className="font-[family-name:var(--font-display)] text-lg tracking-tight text-white group-hover:text-cyan-100">
          {t.nav.brand}
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex items-center gap-1">
          <Link href="/" className={linkClass("home")}>
            {t.nav.home}
          </Link>
          <Link href="/play" className={linkClass("play")}>
            {t.nav.play}
          </Link>
          <Link href="/admin" className={linkClass("admin")}>
            {t.nav.admin}
          </Link>
        </nav>
        <div
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/70 p-0.5"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            className={langBtn("zh")}
            onClick={() => setLocale("zh")}
          >
            {t.nav.langZh}
          </button>
          <button
            type="button"
            className={langBtn("en")}
            onClick={() => setLocale("en")}
          >
            {t.nav.langEn}
          </button>
        </div>
      </div>
    </header>
  );
}
