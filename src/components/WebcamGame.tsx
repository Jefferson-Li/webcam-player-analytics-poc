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

type GamePhase = "idle" | "loading" | "ready" | "playing" | "submitting" | "done" | "error";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface LiveStats {
  age: number;
  gender: string;
  expression: string;
  confidence: number;
}

const ROUND_MS = 30_000;
/** Slightly slower cadence — landmark + 416 input is heavier but stabler. */
const DETECT_INTERVAL_MS = 220;

export function WebcamGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snapshotsRef = useRef<FaceSnapshot[]>([]);
  const faceRef = useRef<FaceSnapshot | null>(null);
  const starsRef = useRef<Star[]>([]);
  const scoreRef = useRef(0);
  const starIdRef = useRef(0);
  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const detectTimerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS / 1000);
  const [live, setLive] = useState<LiveStats | null>(null);
  const [consent, setConsent] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

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

  async function startCamera() {
    setError(null);
    setPhase("loading");
    setResultSummary(null);
    snapshotsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setLive(null);

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
        err instanceof Error ? err.message : "無法啟動攝影機或模型";
      setError(message);
      setPhase("error");
    }
  }

  function spawnStar(width: number): Star {
    starIdRef.current += 1;
    return {
      id: starIdRef.current,
      x: Math.random() * Math.max(40, width - 40),
      y: -20,
      size: 18 + Math.random() * 14,
      speed: 1.6 + Math.random() * 2.4,
    };
  }

  function overlaps(
    face: FaceSnapshot,
    star: Star,
    videoWidth: number,
    displayWidth: number,
    displayHeight: number,
    videoHeight: number,
  ) {
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;
    // Mirrored video: flip face box on X
    const faceX =
      displayWidth - (face.box.x + face.box.width) * scaleX;
    const faceY = face.box.y * scaleY;
    const faceW = face.box.width * scaleX;
    const faceH = face.box.height * scaleY;

    const cx = star.x;
    const cy = star.y;
    return (
      cx > faceX &&
      cx < faceX + faceW &&
      cy > faceY &&
      cy < faceY + faceH
    );
  }

  function startRound() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    resetFaceSmoothing();
    starsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    snapshotsRef.current = [];
    startedAtRef.current = performance.now();
    setTimeLeft(ROUND_MS / 1000);
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

      // Mirror overlay to match CSS mirrored video
      const face = faceRef.current;
      if (face && video.videoWidth > 0) {
        const scaleX = w / video.videoWidth;
        const scaleY = h / video.videoHeight;
        const fx = w - (face.box.x + face.box.width) * scaleX;
        const fy = face.box.y * scaleY;
        const fw = face.box.width * scaleX;
        const fh = face.box.height * scaleY;

        ctx.strokeStyle = "rgba(34, 211, 238, 0.95)";
        ctx.lineWidth = 3;
        ctx.strokeRect(fx, fy, fw, fh);

        ctx.fillStyle = "rgba(8, 47, 73, 0.72)";
        ctx.fillRect(fx, Math.max(0, fy - 28), Math.max(120, fw), 24);
        ctx.fillStyle = "#e0f2fe";
        ctx.font = "600 12px ui-sans-serif, system-ui";
        ctx.fillText(
          `${Math.round(face.age)}y · ${face.gender} · ${face.dominantExpression}`,
          fx + 8,
          Math.max(14, fy - 10),
        );
      }

      // Stars
      if (Math.random() < 0.04 && starsRef.current.length < 8) {
        starsRef.current.push(spawnStar(w));
      }

      const nextStars: Star[] = [];
      for (const star of starsRef.current) {
        star.y += star.speed;
        let caught = false;
        if (face && video.videoWidth > 0) {
          caught = overlaps(
            face,
            star,
            video.videoWidth,
            w,
            h,
            video.videoHeight,
          );
        }
        if (caught) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
          continue;
        }
        if (star.y < h + 30) {
          nextStars.push(star);
          // draw star
          ctx.beginPath();
          ctx.fillStyle = "#fbbf24";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 12;
          const r = star.size / 2;
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = star.x + Math.cos(angle) * r;
            const py = star.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      starsRef.current = nextStars;

      const elapsed = performance.now() - startedAtRef.current;
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
          if (snapshotsRef.current.length > 80) {
            snapshotsRef.current.shift();
          }
          setLive({
            age: Math.round(snap.age),
            gender: snap.gender,
            expression: snap.dominantExpression,
            confidence: snap.expressionConfidence,
          });
        }
      } catch {
        // ignore transient detection errors
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
      setResultSummary(`得分 ${scoreRef.current}，但未穩定偵測到臉部，未上傳分析資料。`);
      setPhase("done");
      return;
    }

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: "face-catch",
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
      if (!res.ok) throw new Error("上傳失敗");
      setResultSummary(
        `得分 ${scoreRef.current}｜估測約 ${Math.round(avg.age)} 歲｜${avg.gender === "male" ? "男性" : "女性"}｜表情 ${avg.dominantExpression}`,
      );
      setPhase("done");
    } catch {
      setError("遊戲結束，但分析資料上傳失敗");
      setPhase("error");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            Webcam Mini Game
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
            Face Catch
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
            用臉去接落下的星星。遊戲期間會在瀏覽器端估測年齡、性別與表情，結束後上傳匿名統計到後台（不存影片）。
            請正面對鏡頭、光線充足、臉部佔畫面約 1/4 以上，估測會較穩。
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <StatChip label="時間" value={`${timeLeft}s`} />
          <StatChip label="得分" value={String(score)} />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-cyan-400/20 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
        <input
          type="checkbox"
          className="mt-1 accent-cyan-400"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          我了解這是 POC：臉部推斷僅在本機模型執行，上傳的是匿名年齡／性別／表情估計與分數，非真實身分資料。
        </span>
      </label>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950 shadow-[0_0_60px_rgba(34,211,238,0.12)]">
        <div className="relative aspect-[4/3] w-full bg-slate-900">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
          />
          {phase === "idle" || phase === "loading" || phase === "error" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-6 text-center">
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl text-white">
                  {phase === "loading" ? "載入模型與攝影機…" : "準備開始"}
                </p>
                {error ? (
                  <p className="mt-2 text-sm text-rose-300">{error}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    允許攝影機權限後，對準臉部即可遊玩
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
                即時：約 {live.age} 歲 ·{" "}
                {live.gender === "male" ? "男性" : "女性"} · {live.expression}
                {live.confidence < 0.35 ? "（表情不確定）" : ""}
              </span>
            ) : (
              <span>等待臉部偵測…請靠近鏡頭並保持正面</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(phase === "idle" || phase === "error" || phase === "done") && (
              <button
                type="button"
                disabled={!consent}
                onClick={() => void startCamera()}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {phase === "done" ? "再開一局" : "開啟攝影機"}
              </button>
            )}
            {phase === "ready" && (
              <button
                type="button"
                onClick={startRound}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                開始 30 秒
              </button>
            )}
            {phase === "playing" && (
              <button
                type="button"
                onClick={() => void finishRound()}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                提前結束
              </button>
            )}
            {phase === "submitting" && (
              <span className="text-sm text-cyan-200">上傳分析中…</span>
            )}
          </div>
        </div>
      </div>

      {resultSummary ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          {resultSummary}{" "}
          <a href="/admin" className="underline decoration-emerald-300/60 underline-offset-2">
            前往後台看圖表 →
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
