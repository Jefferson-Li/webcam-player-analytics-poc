"use client";

import type {
  ExpressionName,
  ExpressionScores,
  Gender,
} from "@/lib/types";

export interface FaceSnapshot {
  box: { x: number; y: number; width: number; height: number };
  age: number;
  gender: Gender;
  genderProbability: number;
  expressions: ExpressionScores;
  dominantExpression: ExpressionName;
  detectionScore: number;
  expressionConfidence: number;
}

const EMPTY_EXPRESSIONS: ExpressionScores = {
  neutral: 0,
  happy: 0,
  sad: 0,
  angry: 0,
  fearful: 0,
  disgusted: 0,
  surprised: 0,
};

/** Discard weak face hits before they pollute age / emotion averages. */
const MIN_DETECTION_SCORE = 0.55;
/** Gender votes below this confidence are ignored when aggregating. */
const MIN_GENDER_PROBABILITY = 0.65;
/** Dominant expression must clear this margin over the runner-up. */
const MIN_EXPRESSION_CONFIDENCE = 0.35;

let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

/** EMA state for smoother on-screen age / expression readout. */
let emaAge: number | null = null;
let emaExpressions: ExpressionScores | null = null;
const EMA_ALPHA = 0.28;

export function resetFaceSmoothing(): void {
  emaAge = null;
  emaExpressions = null;
}

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const faceapi = await import("@vladmandic/face-api");
    const modelUrl = "/models";
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
      faceapi.nets.ageGenderNet.loadFromUri(modelUrl),
      faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
    ]);
    modelsLoaded = true;
  })();

  return loadPromise;
}

function toExpressionScores(
  expressions: Record<string, number>,
): ExpressionScores {
  return {
    neutral: expressions.neutral ?? 0,
    happy: expressions.happy ?? 0,
    sad: expressions.sad ?? 0,
    angry: expressions.angry ?? 0,
    fearful: expressions.fearful ?? 0,
    disgusted: expressions.disgusted ?? 0,
    surprised: expressions.surprised ?? 0,
  };
}

function dominantFrom(scores: ExpressionScores): {
  name: ExpressionName;
  confidence: number;
} {
  const ranked = (Object.entries(scores) as [ExpressionName, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const [name, top] = ranked[0];
  const second = ranked[1]?.[1] ?? 0;
  return { name, confidence: top - second };
}

function blendExpressions(
  prev: ExpressionScores | null,
  next: ExpressionScores,
  alpha: number,
): ExpressionScores {
  if (!prev) return { ...next };
  const out = { ...EMPTY_EXPRESSIONS };
  for (const key of Object.keys(out) as (keyof ExpressionScores)[]) {
    out[key] = prev[key] * (1 - alpha) + next[key] * alpha;
  }
  return out;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Drop extreme age outliers (top/bottom ~15%) before median. */
function trimmedAges(ages: number[]): number[] {
  if (ages.length < 6) return ages;
  const sorted = [...ages].sort((a, b) => a - b);
  const trim = Math.max(1, Math.floor(sorted.length * 0.15));
  return sorted.slice(trim, sorted.length - trim);
}

export async function detectFace(
  video: HTMLVideoElement,
): Promise<FaceSnapshot | null> {
  const faceapi = await import("@vladmandic/face-api");

  // Landmarks align the face crop — large accuracy win for ageGenderNet.
  // inputSize 416 improves small/far faces vs the old 224 setting.
  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5,
      }),
    )
    .withFaceLandmarks()
    .withAgeAndGender()
    .withFaceExpressions();

  if (!detection) return null;

  const detectionScore = detection.detection.score;
  if (detectionScore < MIN_DETECTION_SCORE) return null;

  const box = detection.detection.box;
  // Reject tiny / partial faces that skew age & emotion.
  const minSide = Math.min(box.width, box.height);
  const frameMin = Math.min(video.videoWidth || 640, video.videoHeight || 480);
  if (minSide < frameMin * 0.12) return null;

  const rawExpressions = toExpressionScores(
    detection.expressions as unknown as Record<string, number>,
  );

  emaAge =
    emaAge == null
      ? detection.age
      : emaAge * (1 - EMA_ALPHA) + detection.age * EMA_ALPHA;
  emaExpressions = blendExpressions(
    emaExpressions,
    rawExpressions,
    EMA_ALPHA,
  );

  const smoothedExpressions = emaExpressions ?? rawExpressions;
  const { name: dominantExpression, confidence: expressionConfidence } =
    dominantFrom(smoothedExpressions);

  return {
    box: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    },
    age: emaAge ?? detection.age,
    gender: detection.gender as Gender,
    genderProbability: detection.genderProbability,
    expressions: smoothedExpressions,
    dominantExpression:
      expressionConfidence >= MIN_EXPRESSION_CONFIDENCE
        ? dominantExpression
        : "neutral",
    detectionScore,
    expressionConfidence,
  };
}

export function averageSnapshots(snapshots: FaceSnapshot[]): {
  age: number;
  gender: Gender;
  genderProbability: number;
  expressions: ExpressionScores;
  dominantExpression: ExpressionName;
} | null {
  const reliable = snapshots.filter(
    (s) =>
      s.detectionScore >= MIN_DETECTION_SCORE &&
      s.genderProbability >= MIN_GENDER_PROBABILITY * 0.7,
  );
  const pool = reliable.length >= 5 ? reliable : snapshots;
  if (pool.length === 0) return null;

  const age = median(trimmedAges(pool.map((s) => s.age)));

  const genderVotes = pool.filter(
    (s) => s.genderProbability >= MIN_GENDER_PROBABILITY,
  );
  const votePool = genderVotes.length >= 3 ? genderVotes : pool;
  const maleVotes = votePool.filter((s) => s.gender === "male");
  const femaleVotes = votePool.filter((s) => s.gender === "female");
  const gender: Gender =
    maleVotes.length >= femaleVotes.length ? "male" : "female";
  const genderGroup = gender === "male" ? maleVotes : femaleVotes;
  const genderProbability =
    genderGroup.length > 0
      ? genderGroup.reduce((sum, s) => sum + s.genderProbability, 0) /
        genderGroup.length
      : 0;

  const expressions: ExpressionScores = { ...EMPTY_EXPRESSIONS };
  for (const snap of pool) {
    for (const key of Object.keys(expressions) as (keyof ExpressionScores)[]) {
      expressions[key] += snap.expressions[key];
    }
  }
  for (const key of Object.keys(expressions) as (keyof ExpressionScores)[]) {
    expressions[key] /= pool.length;
  }

  const { name: dominantExpression, confidence } = dominantFrom(expressions);

  return {
    age: Math.round(age),
    gender,
    genderProbability,
    expressions,
    dominantExpression:
      confidence >= MIN_EXPRESSION_CONFIDENCE ? dominantExpression : "neutral",
  };
}
