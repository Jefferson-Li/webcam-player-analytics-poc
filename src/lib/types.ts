export type Gender = "male" | "female";

export type GameId = "face-catch" | "emotion-match";

export type ExpressionName =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "disgusted"
  | "surprised";

export interface ExpressionScores {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface PlayerSession {
  id: string;
  gameId: GameId;
  playerId: string;
  age: number;
  gender: Gender;
  genderProbability: number;
  dominantExpression: ExpressionName;
  expressions: ExpressionScores;
  score: number;
  durationMs: number;
  createdAt: string;
}

export interface CreateSessionInput {
  gameId: GameId;
  playerId: string;
  age: number;
  gender: Gender;
  genderProbability: number;
  dominantExpression: ExpressionName;
  expressions: ExpressionScores;
  score: number;
  durationMs: number;
}

export interface GenderStat {
  gender: Gender;
  count: number;
}

export interface AgeBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface ExpressionStat {
  expression: ExpressionName;
  count: number;
}

export interface TimelinePoint {
  hour: string;
  count: number;
}

export interface GameStat {
  gameId: GameId;
  label: string;
  attempts: number;
  totalDurationMs: number;
  uniquePlayers: number;
  averageScore: number;
}

export interface DailyUserStat {
  date: string;
  users: number;
  sessions: number;
}

export interface AnalyticsStats {
  totalSessions: number;
  averageAge: number;
  averageScore: number;
  genderDistribution: GenderStat[];
  ageDistribution: AgeBucket[];
  expressionDistribution: ExpressionStat[];
  sessionsByHour: TimelinePoint[];
  recentSessions: PlayerSession[];
  gameStats: GameStat[];
  mostTimeSpentGame: GameStat | null;
  mostAttemptedGame: GameStat | null;
  dailyUsers: DailyUserStat[];
  todayUsers: number;
}
