import { addSession, clearSessions, getAnalyticsStats, listSessions } from "@/lib/store";
import { isGameId } from "@/lib/games";
import type { CreateSessionInput, ExpressionScores, Gender } from "@/lib/types";

const EXPRESSIONS = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised",
] as const;

function isGender(value: unknown): value is Gender {
  return value === "male" || value === "female";
}

function isExpressionScores(value: unknown): value is ExpressionScores {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return EXPRESSIONS.every((key) => typeof record[key] === "number");
}

function parseCreateInput(body: unknown): CreateSessionInput | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;

  if (
    !isGameId(data.gameId) ||
    typeof data.playerId !== "string" ||
    data.playerId.length < 4 ||
    data.playerId.length > 80 ||
    typeof data.age !== "number" ||
    !isGender(data.gender) ||
    typeof data.genderProbability !== "number" ||
    typeof data.dominantExpression !== "string" ||
    !EXPRESSIONS.includes(
      data.dominantExpression as (typeof EXPRESSIONS)[number],
    ) ||
    !isExpressionScores(data.expressions) ||
    typeof data.score !== "number" ||
    typeof data.durationMs !== "number"
  ) {
    return null;
  }

  return {
    gameId: data.gameId,
    playerId: data.playerId,
    age: Math.round(data.age),
    gender: data.gender,
    genderProbability: data.genderProbability,
    dominantExpression:
      data.dominantExpression as CreateSessionInput["dominantExpression"],
    expressions: data.expressions,
    score: Math.max(0, Math.round(data.score)),
    durationMs: Math.max(0, Math.round(data.durationMs)),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("view") === "stats") {
    return Response.json(getAnalyticsStats());
  }
  return Response.json({ sessions: listSessions() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = parseCreateInput(body);
  if (!input) {
    return Response.json({ error: "Invalid session payload" }, { status: 400 });
  }

  const session = addSession(input);
  return Response.json({ session }, { status: 201 });
}

export async function DELETE() {
  clearSessions();
  return Response.json({ ok: true });
}
