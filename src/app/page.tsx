"use client";

import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { useI18n } from "@/lib/i18n/context";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_rgba(34,211,238,0.22),_transparent),radial-gradient(ellipse_50%_40%_at_100%_100%,_rgba(251,191,36,0.12),_transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-8 sm:px-6 sm:py-10">
        <SiteNav active="home" />

        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/90">
              {t.home.eyebrow}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-white sm:text-6xl">
              {t.home.titleLine1}
              <span className="block text-cyan-300">{t.home.titleLine2}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {t.home.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/play"
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {t.home.ctaPlay}
              </Link>
              <Link
                href="/admin"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t.home.ctaAdmin}
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-cyan-400/25 bg-slate-900 shadow-[0_0_80px_rgba(34,211,238,0.15)]">
            <div className="absolute inset-0 bg-[linear-gradient(160deg,#0f172a_0%,#083344_45%,#0f172a_100%)]" />
            <div className="absolute inset-6 rounded-2xl border border-dashed border-cyan-300/30" />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300/80 shadow-[0_0_30px_rgba(34,211,238,0.45)]" />
            <div className="absolute left-[58%] top-[28%] h-4 w-4 animate-pulse rounded-full bg-amber-300 shadow-[0_0_16px_#fbbf24]" />
            <div className="absolute left-[30%] top-[42%] h-3 w-3 animate-pulse rounded-full bg-amber-300/80 delay-150" />
            <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-slate-950/70 px-4 py-3 text-xs text-slate-300 backdrop-blur">
              {t.home.heroBadge}
            </div>
          </div>
        </section>

        <section className="grid gap-6 border-t border-white/10 pt-10 sm:grid-cols-3">
          <Feature title={t.home.feature1Title} body={t.home.feature1Body} />
          <Feature title={t.home.feature2Title} body={t.home.feature2Body} />
          <Feature title={t.home.feature3Title} body={t.home.feature3Body} />
        </section>
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-lg text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}
