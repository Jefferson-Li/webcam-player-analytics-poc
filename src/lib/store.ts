import { randomUUID } from "crypto";
import { GAME_IDS, GAME_LABELS } from "./games";
import type {
  AgeBucket,
  AnalyticsStats,
  CreateSessionInput,
  DailyUserStat,
  ExpressionName,
  ExpressionStat,
  GameStat,
  GenderStat,
  PlayerSession,
  TimelinePoint,
} from "./types";

const globalForStore = globalThis as unknown as {
  __playerSessions?: PlayerSession[];
};

function getSessions(): PlayerSession[] {
  if (!globalForStore.__playerSessions) {
    globalForStore.__playerSessions = [];
  }
  return globalForStore.__playerSessions;
}

const AGE_BUCKETS: Omit<AgeBucket, "count">[] = [
  { label: "0-17", min: 0, max: 17 },
  { label: "18-24", min: 18, max: 24 },
  { label: "25-34", min: 25, max: 34 },
  { label: "35-44", min: 35, max: 44 },
  { label: "45-54", min: 45, max: 54 },
  { label: "55+", min: 55, max: 200 },
];

const EXPRESSIONS: ExpressionName[] = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised",
];

function toDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addSession(input: CreateSessionInput): PlayerSession {
  const session: PlayerSession = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  getSessions().unshift(session);
  if (getSessions().length > 500) {
    getSessions().length = 500;
  }
  return session;
}

export function listSessions(): PlayerSession[] {
  return [...getSessions()];
}

export function clearSessions(): void {
  getSessions().length = 0;
}

function buildGameStats(sessions: PlayerSession[]): GameStat[] {
  return GAME_IDS.map((gameId) => {
    const subset = sessions.filter((s) => s.gameId === gameId);
    const attempts = subset.length;
    const totalDurationMs = subset.reduce((sum, s) => sum + s.durationMs, 0);
    const uniquePlayers = new Set(subset.map((s) => s.playerId)).size;
    const averageScore =
      attempts === 0
        ? 0
        : Math.round(
            (subset.reduce((sum, s) => sum + s.score, 0) / attempts) * 10,
          ) / 10;
    return {
      gameId,
      label: GAME_LABELS[gameId],
      attempts,
      totalDurationMs,
      uniquePlayers,
      averageScore,
    };
  });
}

function buildDailyUsers(sessions: PlayerSession[]): DailyUserStat[] {
  const map = new Map<string, { users: Set<string>; sessions: number }>();
  for (const session of sessions) {
    const date = toDateKey(session.createdAt);
    let bucket = map.get(date);
    if (!bucket) {
      bucket = { users: new Set(), sessions: 0 };
      map.set(date, bucket);
    }
    bucket.users.add(session.playerId);
    bucket.sessions += 1;
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { users, sessions: count }]) => ({
      date,
      users: users.size,
      sessions: count,
    }));
}

export function getAnalyticsStats(): AnalyticsStats {
  const sessions = listSessions();
  const totalSessions = sessions.length;
  const emptyGameStats = buildGameStats([]);

  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      averageAge: 0,
      averageScore: 0,
      genderDistribution: [
        { gender: "male", count: 0 },
        { gender: "female", count: 0 },
      ],
      ageDistribution: AGE_BUCKETS.map((b) => ({ ...b, count: 0 })),
      expressionDistribution: EXPRESSIONS.map((expression) => ({
        expression,
        count: 0,
      })),
      sessionsByHour: [],
      recentSessions: [],
      gameStats: emptyGameStats,
      mostTimeSpentGame: null,
      mostAttemptedGame: null,
      dailyUsers: [],
      todayUsers: 0,
    };
  }

  const averageAge =
    sessions.reduce((sum, s) => sum + s.age, 0) / totalSessions;
  const averageScore =
    sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions;

  const genderDistribution: GenderStat[] = [
    {
      gender: "male",
      count: sessions.filter((s) => s.gender === "male").length,
    },
    {
      gender: "female",
      count: sessions.filter((s) => s.gender === "female").length,
    },
  ];

  const ageDistribution: AgeBucket[] = AGE_BUCKETS.map((bucket) => ({
    ...bucket,
    count: sessions.filter(
      (s) => s.age >= bucket.min && s.age <= bucket.max,
    ).length,
  }));

  const expressionDistribution: ExpressionStat[] = EXPRESSIONS.map(
    (expression) => ({
      expression,
      count: sessions.filter((s) => s.dominantExpression === expression)
        .length,
    }),
  );

  const hourMap = new Map<string, number>();
  for (const session of sessions) {
    const date = new Date(session.createdAt);
    const key = `${String(date.getHours()).padStart(2, "0")}:00`;
    hourMap.set(key, (hourMap.get(key) ?? 0) + 1);
  }
  const sessionsByHour: TimelinePoint[] = [...hourMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }));

  const gameStats = buildGameStats(sessions);
  const withAttempts = gameStats.filter((g) => g.attempts > 0);
  const mostTimeSpentGame =
    withAttempts.length === 0
      ? null
      : [...withAttempts].sort(
          (a, b) => b.totalDurationMs - a.totalDurationMs,
        )[0];
  const mostAttemptedGame =
    withAttempts.length === 0
      ? null
      : [...withAttempts].sort((a, b) => b.attempts - a.attempts)[0];

  const dailyUsers = buildDailyUsers(sessions);
  const todayKey = toDateKey(new Date().toISOString());
  const todayUsers =
    dailyUsers.find((d) => d.date === todayKey)?.users ?? 0;

  return {
    totalSessions,
    averageAge: Math.round(averageAge * 10) / 10,
    averageScore: Math.round(averageScore * 10) / 10,
    genderDistribution,
    ageDistribution,
    expressionDistribution,
    sessionsByHour,
    recentSessions: sessions.slice(0, 20),
    gameStats,
    mostTimeSpentGame,
    mostAttemptedGame,
    dailyUsers,
    todayUsers,
  };
}
