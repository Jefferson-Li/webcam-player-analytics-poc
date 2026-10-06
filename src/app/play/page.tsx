"use client";

import { useState } from "react";
import { EmotionMatchGame } from "@/components/EmotionMatchGame";
import { SiteNav } from "@/components/SiteNav";
import { WebcamGame } from "@/components/WebcamGame";
import type { GameId } from "@/lib/types";
import { GAME_LABELS } from "@/lib/games";

export default function PlayPage() {
  const [gameId, setGameId] = useState<GameId>("face-catch");

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(251,191,36,0.12),_transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <SiteNav active="play" />

        <div className="flex flex-wrap gap-2">
          {(Object.keys(GAME_LABELS) as GameId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setGameId(id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                gameId === id
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {GAME_LABELS[id]}
            </button>
          ))}
        </div>

        {gameId === "face-catch" ? <WebcamGame /> : <EmotionMatchGame />}
      </div>
    </div>
  );
}
