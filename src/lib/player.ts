const STORAGE_KEY = "wpa_player_id";

/** Anonymous browser-local id used only for daily unique-player stats. */
export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `p_ephemeral_${Date.now()}`;
  }
}
