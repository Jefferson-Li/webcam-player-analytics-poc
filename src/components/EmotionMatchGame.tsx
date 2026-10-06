"use client";

import { useEffect, useRef, useState } from "react";
import {
  averageSnapshots,
  detectFace,
  loadFaceModels,
  resetFaceSmoothing,
  type FaceSnapshot,
} from "@/lib/face";
import { getOrCreatePlayerId } from "@/lib/player";
import { useI18n } from "@/lib/i18n/context";
import type { ExpressionName } from "@/lib/types";

type GamePhase =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "submitting"
  | "done"
  | "error";

interface LiveStats {
  age: number;
  gender: string;
  expression: string;
  confidence: number;
}

const ROUND_MS = 30_000;
const DETECT_INTERVAL_MS = 220;
const PROMPT_MS = 5_000;
const HOLD_MS = 700;
const MATCH_THRESHOLD = 0.38;

const PROMPTS: ExpressionName[] = [
  "happy",
  "surprised",
  "angry",
  "sad",
  "neutral",
  "fearful",
];

const PROMPT_EMOJI: Record<ExpressionName, string> = {
  neutral: "",
  happy: "😊",
  sad: "😢",
  angry: "😠",
  fearful: "😨",
  disgusted: "🤢",
  surprised: "😮",
};

export function EmotionMatchGame() {
  const { t, format } = useI18n();
  const i18nRef = useRef({ t, format });
  i18nRef.current = { t, format };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snapshotsRef = useRef<FaceSnapshot[]>([]);
  const faceRef = useRef<FaceSnapshot | null>(null);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const detectTimerRef = useRef<number | null>(null);
  const promptRef = useRef<ExpressionName>("happy");
  const promptStartedRef = useRef(0);
  const holdStartedRef = useRef<number | null>(null);
  const scoredThisPromptRef = useRef(false);

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS / 1000);
  const [prompt, setPrompt] = useState<ExpressionName>("happy");
  const [live, setLive] = useState<LiveStats | null>(null);
  const [consent, setConsent] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [matchProgress, setMatchProgress] = useState(0);

  useEffect(() => {
    return () => {
      stopLoop();
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function stopLoop() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (detectTimerRef.current != null) {
      window.clearInterval(detectTimerRef.current);
      detectTimerRef.current = null;
    }
  }

  function nextPrompt(now: number) {
    const current = promptRef.current;
    let next = current;
    for (let i = 0; i < 6; i++) {
      next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      if (next !== current) break;
    }
    promptRef.current = next;
    promptStartedRef.current = now;
    holdStartedRef.current = null;
    scoredThisPromptRef.current = false;
    setPrompt(next);
    setMatchProgress(0);
  }

  async function startCamera() {
    setError(null);
    setPhase("loading");
    setResultSummary(null);
    snapshotsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setLive(null);
    setMatchProgress(0);

    try {
      resetFaceSmoothing();
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");
      video.srcObject = stream;
      await video.play();
      setPhase("ready");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t.emotionMatch.cameraError;
      setError(message);
      setPhase("error");
    }
  }

  function startRound() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    resetFaceSmoothing();
    scoreRef.current = 0;
    setScore(0);
    snapshotsRef.current = [];
    startedAtRef.current = performance.now();
    setTimeLeft(ROUND_MS / 1000);
    nextPrompt(performance.now());
    setPhase("playing");

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !video) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);

      const now = performance.now();
      if (now - promptStartedRef.current >= PROMPT_MS) {
        nextPrompt(now);
      }

      const face = faceRef.current;
      if (face && video.videoWidth > 0) {
        const scaleX = w / video.videoWidth;
        const scaleY = h / video.videoHeight;
        const fx = w - (face.box.x + face.box.width) * scaleX;
        const fy = face.box.y * scaleY;
        const fw = face.box.width * scaleX;
        const fh = face.box.height * scaleY;

        const target = promptRef.current;
        const strength = face.expressions[target] ?? 0;
        const matched =
          face.dominantExpression === target || strength >= MATCH_THRESHOLD;

        ctx.strokeStyle = matched
          ? "rgba(52, 211, 153, 0.95)"
          : "rgba(251, 113, 133, 0.9)";
        ctx.lineWidth = 3;
        ctx.strokeRect(fx, fy, fw, fh);

        if (matched && !scoredThisPromptRef.current) {
          if (holdStartedRef.current == null) holdStartedRef.current = now;
          const held = now - holdStartedRef.current;
          const progress = Math.min(1, held / HOLD_MS);
          setMatchProgress(progress);
          if (held >= HOLD_MS) {
            scoredThisPromptRef.current = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            setMatchProgress(1);
          }
        } else if (!matched) {
          holdStartedRef.current = null;
          setMatchProgress(0);
        }
      }

      // Prompt banner
      const { t: dict } = i18nRef.current;
      const promptLabel = `${dict.expressions[promptRef.current]}${
        PROMPT_EMOJI[promptRef.current]
          ? ` ${PROMPT_EMOJI[promptRef.current]}`
          : ""
      }`;
      ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
      ctx.fillRect(16, 16, Math.min(w - 32, 360), 64);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 14px ui-sans-serif, system-ui";
      ctx.fillText(dict.emotionMatch.promptBanner, 28, 40);
      ctx.font = "700 22px ui-sans-serif, system-ui";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(promptLabel, 28, 68);

      if (matchProgress > 0) {
        ctx.fillStyle = "rgba(52, 211, 153, 0.25)";
        ctx.fillRect(16, 88, Math.min(w - 32, 360) * matchProgress, 8);
      }

      const elapsed = now - startedAtRef.current;
      const left = Math.max(0, Math.ceil((ROUND_MS - elapsed) / 1000));
      setTimeLeft(left);

      if (elapsed >= ROUND_MS) {
        void finishRound();
        return;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    detectTimerRef.current = window.setInterval(async () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      try {
        const snap = await detectFace(v);
        faceRef.current = snap;
        if (snap) {
          snapshotsRef.current.push(snap);
          if (snapshotsRef.current.length > 80) snapshotsRef.current.shift();
          setLive({
            age: Math.round(snap.age),
            gender: snap.gender,
            expression: snap.dominantExpression,
            confidence: snap.expressionConfidence,
          });
        }
      } catch {
        // ignore
      }
    }, DETECT_INTERVAL_MS);

    rafRef.current = requestAnimationFrame(draw);
  }

  async function finishRound() {
    stopLoop();
    setPhase("submitting");
    const avg = averageSnapshots(snapshotsRef.current);
    const durationMs = Math.round(performance.now() - startedAtRef.current);

    if (!avg) {
      setResultSummary(
        format(t.emotionMatch.noFaceUpload, { score: scoreRef.current }),
      );
      setPhase("done");
      return;
    }

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: "emotion-match",
          playerId: getOrCreatePlayerId(),
          age: avg.age,
          gender: avg.gender,
          genderProbability: avg.genderProbability,
          dominantExpression: avg.dominantExpression,
          expressions: avg.expressions,
          score: scoreRef.current,
          durationMs,
        }),
      });
      if (!res.ok) throw new Error("upload failed");
      setResultSummary(
        format(t.emotionMatch.result, {
          score: scoreRef.current,
          age: Math.round(avg.age),
          gender: avg.gender === "male" ? t.common.male : t.common.female,
        }),
      );
      setPhase("done");
    } catch {
      setError(t.emotionMatch.uploadFail);
      setPhase("error");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
            {t.emotionMatch.eyebrow}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
            {t.emotionMatch.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
            {t.emotionMatch.description}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <StatChip label={t.common.time} value={`${timeLeft}s`} />
          <StatChip label={t.common.score} value={String(score)} />
          <StatChip label={t.common.target} value={t.expressions[prompt]} />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
        <input
          type="checkbox"
          className="mt-1 accent-amber-400"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>{t.common.consent}</span>
      </label>

      <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-slate-950 shadow-[0_0_60px_rgba(251,191,36,0.12)]">
        <div className="relative aspect-[4/3] w-full bg-slate-900">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          {phase === "idle" || phase === "loading" || phase === "error" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-6 text-center">
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl text-white">
                  {phase === "loading"
                    ? t.common.loadingCamera
                    : t.common.ready}
                </p>
                {error ? (
                  <p className="mt-2 text-sm text-rose-300">{error}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    {t.emotionMatch.overlayHint}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3">
          <div className="text-xs text-slate-400">
            {live ? (
              <span>
                {t.common.livePrefix}: ~{live.age}
                {t.common.yearsOld} ·{" "}
                {live.gender === "male" ? t.common.male : t.common.female} ·{" "}
                {t.expressions[
                  live.expression as keyof typeof t.expressions
                ] ?? live.expression}
              </span>
            ) : (
              <span>{t.common.waitingFace}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(phase === "idle" || phase === "error" || phase === "done") && (
              <button
                type="button"
                disabled={!consent}
                onClick={() => void startCamera()}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {phase === "done" ? t.common.playAgain : t.common.openCamera}
              </button>
            )}
            {phase === "ready" && (
              <button
                type="button"
                onClick={startRound}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {t.common.start30s}
              </button>
            )}
            {phase === "playing" && (
              <button
                type="button"
                onClick={() => void finishRound()}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                {t.common.endEarly}
              </button>
            )}
            {phase === "submitting" && (
              <span className="text-sm text-amber-200">
                {t.common.uploading}
              </span>
            )}
          </div>
        </div>
      </div>

      {resultSummary ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          {resultSummary}{" "}
          <a
            href="/admin"
            className="underline decoration-emerald-300/60 underline-offset-2"
          >
            {t.common.viewAdmin}
          </a>
        </p>
      ) : null}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[72px] rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="font-[family-name:var(--font-display)] text-xl text-white">
        {value}
      </div>
    </div>
  );
}
