import Link from "next/link";

export function SiteNav({
  active,
}: {
  active?: "home" | "play" | "admin";
}) {
  const linkClass = (key: typeof active) =>
    `rounded-lg px-3 py-1.5 text-sm transition ${
      active === key
        ? "bg-white/10 text-white"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="group flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30">
          ◈
        </span>
        <span className="font-[family-name:var(--font-display)] text-lg tracking-tight text-white group-hover:text-cyan-100">
          Webcam Analytics POC
        </span>
      </Link>
      <nav className="flex items-center gap-1">
        <Link href="/" className={linkClass("home")}>
          首頁
        </Link>
        <Link href="/play" className={linkClass("play")}>
          前台遊戲
        </Link>
        <Link href="/admin" className={linkClass("admin")}>
          後台分析
        </Link>
      </nav>
    </header>
  );
}
