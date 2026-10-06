import type { GameId } from "./types";

export const GAME_IDS: GameId[] = ["face-catch", "emotion-match"];

export const GAME_LABELS: Record<GameId, string> = {
  "face-catch": "Face Catch",
  "emotion-match": "Emotion Match",
};

export function isGameId(value: unknown): value is GameId {
  return value === "face-catch" || value === "emotion-match";
}
